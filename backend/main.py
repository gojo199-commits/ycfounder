import os
import json
import re
import time
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

# ── Firebase Admin Init ────────────────────────────────────────────────────────
service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccountKey.json")
db = None
_firebase_error = None

try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    _firebase_error = str(e)
    print(f"⚠️  Firebase init failed: {e}")
    print("   → Place serviceAccountKey.json in the backend/ directory to enable Firestore features.")

# ── Gemini Client ───────────────────────────────────────────────────────────
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(title="YFounder API", version="1.0.0")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:5173",
        "http://localhost:4173",
        "https://ycfounder-a572c.web.app",
        "https://ycfounder-a572c.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ────────────────────────────────────────────────────────────
class MatchRequest(BaseModel):
    currentUser: dict
    otherUser: dict

class ConnectRequest(BaseModel):
    fromUid: str
    toUid: str

class AcceptRequest(BaseModel):
    fromUid: str
    toUid: str

class YCFeedbackRequest(BaseModel):
    question: str
    answer: str
    teamProfiles: list

class ReadinessRequest(BaseModel):
    teamProfiles: list
    answers: dict

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "app": "YFounder API v1"}


@app.get("/api/founders")
def get_founders(exclude_uid: Optional[str] = None):
    """Fetch all user profiles from Firestore, excluding the logged-in user."""
    if db is None:
        raise HTTPException(status_code=503, detail=f"Firebase not configured: {_firebase_error}")
    try:
        users_ref = db.collection("users")
        docs = users_ref.stream()

        founders = []
        for doc in docs:
            data = doc.to_dict()
            # Exclude the requesting user
            if exclude_uid and data.get("uid") == exclude_uid:
                continue
            # Remove sensitive fields if any
            data.pop("pendingRequests", None)
            founders.append(data)

        return {"founders": founders, "count": len(founders)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/match")
def calculate_match(req: MatchRequest):
    """
    Use Gemini gemini-2.5-flash to calculate a compatibility score between two founders.
    Caches results in Firestore under matches/{uid1}_{uid2} to avoid re-computation.
    Returns: { score, reasons, warning }
    """
    current = req.currentUser
    other = req.otherUser

    # ── Check Firestore cache ──
    uid1 = current.get("uid", "")
    uid2 = other.get("uid", "")
    if uid1 and uid2 and db:
        cache_key = f"{min(uid1, uid2)}_{max(uid1, uid2)}"
        try:
            cached = db.collection("matches").document(cache_key).get()
            if cached.exists:
                return cached.to_dict()
        except Exception:
            pass  # Cache miss — continue to compute

    prompt = f"""You are a startup team compatibility analyzer.
Given two founder profiles, calculate a match score from 0-100.
Consider:
- Complementary skills (if one is technical and other is business, score higher)
- Shared interests (same domains = higher score)
- Same target YC batch (higher score)
- Compatible commitment levels
- How well their "looking for" matches the other person's skills

Founder A:
- Name: {current.get('name', 'Unknown')}
- Skills: {', '.join(current.get('skills', []))}
- Interests: {', '.join(current.get('interests', []))}
- Idea Stage: {current.get('ideaStage', 'unknown')}
- Commitment: {current.get('commitmentLevel', 'unknown')}
- Target Batch: {current.get('targetBatch', 'unknown')}
- Looking For: {', '.join(current.get('lookingFor', []))}
- Bio: {current.get('bio', '')}

Founder B:
- Name: {other.get('name', 'Unknown')}
- Skills: {', '.join(other.get('skills', []))}
- Interests: {', '.join(other.get('interests', []))}
- Idea Stage: {other.get('ideaStage', 'unknown')}
- Commitment: {other.get('commitmentLevel', 'unknown')}
- Target Batch: {other.get('targetBatch', 'unknown')}
- Looking For: {', '.join(other.get('lookingFor', []))}
- Bio: {other.get('bio', '')}

Return ONLY a JSON object in this exact format (no markdown, no explanation, just raw JSON):
{{
  "score": <number 0-100>,
  "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
  "warning": "<one concern or null>"
}}"""

    try:
        raw = _rate_limited_gemini(prompt, max_tokens=512)
        result = json.loads(raw)

        # Validate structure
        score = max(0, min(100, int(result.get("score", 50))))
        reasons = result.get("reasons", ["Compatible profiles", "Shared goals", "Complementary skills"])
        warning = result.get("warning", None)
        if warning == "null" or warning == "":
            warning = None

        match_result = {"score": score, "reasons": reasons[:3], "warning": warning}

        # ── Cache to Firestore ──
        if uid1 and uid2 and db:
            try:
                cache_key = f"{min(uid1, uid2)}_{max(uid1, uid2)}"
                db.collection("matches").document(cache_key).set(match_result)
            except Exception:
                pass  # Cache write failure is non-critical

        return match_result

    except json.JSONDecodeError:
        return {"score": 50, "reasons": ["Compatible profiles", "Aligned vision", "Complementary backgrounds"], "warning": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")


@app.post("/api/connect")
def send_connection(req: ConnectRequest):
    """
    Send a connection request.
    - Adds toUid to fromUid's pendingRequests
    - Adds fromUid to toUid's incomingRequests
    """
    if db is None:
        raise HTTPException(status_code=503, detail=f"Firebase not configured: {_firebase_error}")
    try:
        from_ref = db.collection("users").document(req.fromUid)
        to_ref = db.collection("users").document(req.toUid)

        from_doc = from_ref.get()
        to_doc = to_ref.get()

        if not from_doc.exists or not to_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        # Update pendingRequests for sender
        from_data = from_doc.to_dict()
        pending = from_data.get("pendingRequests", [])
        if req.toUid not in pending:
            pending.append(req.toUid)
        from_ref.update({"pendingRequests": pending})

        # Update incomingRequests for receiver
        to_data = to_doc.to_dict()
        incoming = to_data.get("incomingRequests", [])
        if req.fromUid not in incoming:
            incoming.append(req.fromUid)
        to_ref.update({"incomingRequests": incoming})

        return {"success": True, "message": "Connection request sent"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/accept")
def accept_connection(req: AcceptRequest):
    """
    Accept a connection request.
    - Moves both uids to each other's connections array
    - Removes from pendingRequests / incomingRequests
    """
    if db is None:
        raise HTTPException(status_code=503, detail=f"Firebase not configured: {_firebase_error}")
    try:
        from_ref = db.collection("users").document(req.fromUid)
        to_ref = db.collection("users").document(req.toUid)

        from_doc = from_ref.get()
        to_doc = to_ref.get()

        if not from_doc.exists or not to_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        from_data = from_doc.to_dict()
        to_data = to_doc.to_dict()

        # Add to connections
        from_connections = from_data.get("connections", [])
        if req.toUid not in from_connections:
            from_connections.append(req.toUid)

        to_connections = to_data.get("connections", [])
        if req.fromUid not in to_connections:
            to_connections.append(req.fromUid)

        # Remove from pending / incoming
        from_pending = [u for u in from_data.get("pendingRequests", []) if u != req.toUid]
        to_incoming = [u for u in to_data.get("incomingRequests", []) if u != req.fromUid]

        from_ref.update({"connections": from_connections, "pendingRequests": from_pending})
        to_ref.update({"connections": to_connections, "incomingRequests": to_incoming})

        return {"success": True, "message": "Connection accepted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/team/{uid}")
def get_team(uid: str):
    """Fetch all connected founders for the given user."""
    if db is None:
        raise HTTPException(status_code=503, detail=f"Firebase not configured: {_firebase_error}")
    try:
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        connections = user_doc.to_dict().get("connections", [])
        teammates = []
        for conn_uid in connections:
            conn_doc = db.collection("users").document(conn_uid).get()
            if conn_doc.exists:
                data = conn_doc.to_dict()
                data.pop("pendingRequests", None)
                data.pop("incomingRequests", None)
                teammates.append(data)

        return {"teammates": teammates, "count": len(teammates)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/incoming-requests/{uid}")
def get_incoming_requests(uid: str):
    """Return list of users who sent connection requests to this uid."""
    if db is None:
        raise HTTPException(status_code=503, detail=f"Firebase not configured: {_firebase_error}")
    try:
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        incoming = user_doc.to_dict().get("incomingRequests", [])
        requesters = []
        for req_uid in incoming:
            req_doc = db.collection("users").document(req_uid).get()
            if req_doc.exists:
                data = req_doc.to_dict()
                data.pop("pendingRequests", None)
                data.pop("incomingRequests", None)
                requesters.append(data)

        return {"requests": requesters, "count": len(requesters)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Rate-limit helper ──────────────────────────────────────────────────────────
_last_gemini_call = 0.0

def _rate_limited_gemini(prompt: str, max_tokens: int = 1024) -> str:
    """Call Gemini with a rate-limit delay to stay within 5 req/min free tier."""
    global _last_gemini_call
    elapsed = time.time() - _last_gemini_call
    if elapsed < 12:
        time.sleep(12 - elapsed)

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=max_tokens,
        )
    )
    _last_gemini_call = time.time()
    raw = response.text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw


@app.post("/api/yc-feedback")
def yc_feedback(req: YCFeedbackRequest):
    """
    Use Gemini to get YC coach feedback on a question/answer pair.
    Returns: { score, verdict, feedback, improvements, redFlag }
    """
    prompt = f"""You are a Y Combinator application coach with deep knowledge
of what YC partners look for in founding teams.
You have studied every successful YC batch.
Be direct, specific, and brutally honest like a YC partner would be.
Do not be vague.

YC Application Question: {req.question}
Team's Answer: {req.answer}
Team Profiles: {json.dumps(req.teamProfiles)}

Give feedback in this exact JSON format (no markdown, no explanation, just raw JSON):
{{
  "score": <number 0-100>,
  "verdict": "Strong" | "Good" | "Weak" | "Critical",
  "feedback": "<2-3 sentences of direct feedback>",
  "improvements": ["<specific rewrite or suggestion 1>", "<specific rewrite or suggestion 2>"],
  "redFlag": "<major YC concern or null>"
}}"""

    try:
        raw = _rate_limited_gemini(prompt)
        result = json.loads(raw)

        score = max(0, min(100, int(result.get("score", 50))))
        verdict = result.get("verdict", "Good")
        if verdict not in ["Strong", "Good", "Weak", "Critical"]:
            verdict = "Good"
        feedback = result.get("feedback", "Needs improvement.")
        improvements = result.get("improvements", ["Be more specific", "Add metrics"])[:2]
        red_flag = result.get("redFlag", None)
        if red_flag == "null" or red_flag == "":
            red_flag = None

        return {
            "score": score,
            "verdict": verdict,
            "feedback": feedback,
            "improvements": improvements,
            "redFlag": red_flag
        }
    except json.JSONDecodeError:
        return {
            "score": 50,
            "verdict": "Good",
            "feedback": "Your answer shows potential but needs more specifics.",
            "improvements": ["Be more specific about your unique approach", "Add concrete metrics or traction data"],
            "redFlag": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")


@app.post("/api/readiness-score")
def readiness_score(req: ReadinessRequest):
    """
    Calculate overall YC readiness score from all answers + team profiles.
    Returns: { score, breakdown: { teamComposition, ideaClarity, marketUnderstanding, executionPlan } }
    """
    prompt = f"""You are a Y Combinator readiness evaluator.
Given a team's profiles and their answers to YC application questions,
calculate an overall readiness score and category breakdown.

Team Profiles: {json.dumps(req.teamProfiles)}
YC Answers: {json.dumps(req.answers)}

Return ONLY a JSON object (no markdown, no explanation, just raw JSON):
{{
  "score": <overall score 0-100>,
  "breakdown": {{
    "teamComposition": <score 0-100>,
    "ideaClarity": <score 0-100>,
    "marketUnderstanding": <score 0-100>,
    "executionPlan": <score 0-100>
  }}
}}"""

    try:
        raw = _rate_limited_gemini(prompt)
        result = json.loads(raw)

        score = max(0, min(100, int(result.get("score", 50))))
        breakdown = result.get("breakdown", {})
        breakdown = {
            "teamComposition": max(0, min(100, int(breakdown.get("teamComposition", 50)))),
            "ideaClarity": max(0, min(100, int(breakdown.get("ideaClarity", 50)))),
            "marketUnderstanding": max(0, min(100, int(breakdown.get("marketUnderstanding", 50)))),
            "executionPlan": max(0, min(100, int(breakdown.get("executionPlan", 50)))),
        }

        return {"score": score, "breakdown": breakdown}
    except json.JSONDecodeError:
        return {
            "score": 50,
            "breakdown": {
                "teamComposition": 50,
                "ideaClarity": 50,
                "marketUnderstanding": 50,
                "executionPlan": 50
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
