import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const YC_QUESTIONS = [
  { id: 'q1', text: 'What are you building? Describe your product in one clear sentence.' },
  { id: 'q2', text: 'Who are your target users and what is their exact pain?' },
  { id: 'q3', text: 'Why is now the right time to build this?' },
  { id: 'q4', text: 'Why is your team uniquely qualified to solve this problem?' },
  { id: 'q5', text: 'What is your current traction or evidence of demand?' },
  { id: 'q6', text: 'What is your 18-month plan if you get into YC?' },
]

/* ─── Toast Component ─────────────────────────────────────────────────────── */
function Toast({ show }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-[#111111] border border-[#FF6600]/60 text-[#FF6600] 
        px-5 py-3 rounded-lg font-medium text-sm shadow-lg shadow-[#FF6600]/10
        transition-all duration-300 flex items-center gap-2
        ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      Saved
    </div>
  )
}

/* ─── Circular Score ──────────────────────────────────────────────────────── */
function CircularScore({ score, size = 160, label }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#FF6600" strokeOpacity={0.15}
          strokeWidth={10} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#FF6600"
          strokeWidth={10} fill="none" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-white font-extrabold text-4xl">{score}</span>
        <span className="text-white/40 text-sm">/100</span>
      </div>
      {label && <p className="text-white/50 text-sm mt-3">{label}</p>}
    </div>
  )
}

/* ─── Section 1: Your Team ────────────────────────────────────────────────── */
function TeamSection({ teammates, loading }) {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="min-w-[220px] h-48 bg-[#111111] rounded-xl animate-pulse border border-[#FF6600]/10" />
        ))}
      </div>
    )
  }

  if (!teammates.length) {
    return (
      <div className="card rounded-xl flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-[#FF6600]/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#FF6600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-white font-semibold text-lg mb-1">Your team is empty</p>
        <p className="text-white/40 text-sm mb-5">Find co-founders who complement your skills</p>
        <Link to="/browse" className="btn-primary text-sm px-6 py-2.5 rounded-lg inline-flex items-center gap-2">
          Go find your co-founders →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {teammates.map(t => (
        <div key={t.uid} className="min-w-[220px] card rounded-xl p-5 flex flex-col items-center text-center hover:border-[#FF6600]/60 transition-colors">
          <div className="w-14 h-14 rounded-full bg-[#FF6600]/20 flex items-center justify-center text-[#FF6600] font-bold text-xl mb-3">
            {t.photoURL
              ? <img src={t.photoURL} className="w-14 h-14 rounded-full object-cover" alt={t.name} />
              : (t.name?.[0] || '?')}
          </div>
          <p className="text-white font-semibold text-sm mb-2 truncate w-full">{t.name}</p>
          <div className="flex flex-wrap justify-center gap-1 mb-3">
            {(t.skills || []).slice(0, 3).map(s => (
              <span key={s} className="bg-[#FF6600]/10 text-[#FF6600] text-[10px] px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
          <span className="text-white/30 text-xs">{t.ideaStage || 'Exploring'}</span>
        </div>
      ))}
      <Link to="/browse"
        className="min-w-[100px] card rounded-xl flex flex-col items-center justify-center hover:border-[#FF6600]/60 transition-colors group">
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#FF6600]/30 flex items-center justify-center group-hover:border-[#FF6600]/60 transition-colors">
          <span className="text-[#FF6600] text-xl">+</span>
        </div>
        <span className="text-white/40 text-xs mt-2">Add Member</span>
      </Link>
    </div>
  )
}

/* ─── Section 2: Incoming Requests ────────────────────────────────────────── */
function RequestsSection({ requests, onAccept, onDecline, processing }) {
  if (!requests.length) return null

  return (
    <section className="mb-10">
      <h2 className="text-[#FF6600] font-bold text-xl mb-4">Connection Requests</h2>
      <div className="space-y-3">
        {requests.map(r => (
          <div key={r.uid} className="card rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FF6600]/20 flex items-center justify-center text-[#FF6600] font-bold flex-shrink-0">
              {r.photoURL
                ? <img src={r.photoURL} className="w-12 h-12 rounded-full object-cover" alt={r.name} />
                : (r.name?.[0] || '?')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{r.name}</p>
              <p className="text-white/40 text-xs truncate">{(r.skills || []).join(', ')}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onAccept(r.uid)}
                disabled={processing === r.uid}
                className="btn-primary text-xs px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {processing === r.uid ? '...' : 'Accept'}
              </button>
              <button
                onClick={() => onDecline(r.uid)}
                disabled={processing === r.uid}
                className="border border-[#FF6600]/40 text-[#FF6600] text-xs px-4 py-2 rounded-lg hover:bg-[#FF6600]/10 transition-colors disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── Section 4: YC Prep Accordion Card ───────────────────────────────────── */
function YCQuestionCard({ q, answer, feedback, onSave, onGetFeedback, loadingFeedback, teamProfiles }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(answer || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setText(answer || '') }, [answer])

  const verdictColor = (v) => {
    if (v === 'Strong') return 'bg-[#FF6600] text-black'
    if (v === 'Good') return 'bg-[#FF8C00] text-black'
    if (v === 'Weak') return 'bg-[#CC5500] text-white'
    return 'bg-red-600 text-white'
  }

  const scoreColor = (s) => {
    if (s >= 80) return 'text-[#FF6600]'
    if (s >= 60) return 'text-[#FF8C00]'
    return 'text-red-500'
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(q.id, text)
    setSaving(false)
  }

  return (
    <div className="bg-[#111111] rounded-xl border-l-[3px] border-[#FF6600] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-white font-semibold text-sm pr-4">{q.text}</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          {feedback && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${verdictColor(feedback.verdict)}`}>
              {feedback.verdict}
            </span>
          )}
          <svg className={`w-5 h-5 text-[#FF6600] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {open && (
        <div className="px-5 pb-5 space-y-4">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your team's answer here..."
              className="w-full bg-black border border-[#FF6600]/40 text-white rounded-lg p-4 text-sm
                focus:outline-none focus:ring-2 focus:ring-[#FF6600]/50 focus:border-[#FF6600]
                placeholder-white/30 resize-none transition-colors"
              rows={4}
            />
            <span className="absolute bottom-3 right-3 text-white/30 text-xs">{text.length} chars</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onGetFeedback(q.id, q.text, text)}
              disabled={!text.trim() || loadingFeedback}
              className="btn-primary text-sm px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingFeedback ? 'Getting Feedback...' : 'Get AI Feedback'}
            </button>
            <button
              onClick={handleSave}
              disabled={!text.trim() || saving}
              className="border border-[#FF6600]/40 text-[#FF6600] text-sm px-5 py-2.5 rounded-lg 
                hover:bg-[#FF6600]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Answer'}
            </button>
          </div>

          {/* Loading State */}
          {loadingFeedback && (
            <div className="flex items-center gap-3 py-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-[#FF6600] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#FF6600] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#FF6600] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-white/50 text-sm">Your YC coach is reviewing...</span>
            </div>
          )}

          {/* Feedback Card */}
          {feedback && !loadingFeedback && (
            <div className="bg-black/50 border border-[#FF6600]/20 rounded-xl p-5 space-y-4">
              {/* Score + Verdict */}
              <div className="flex items-center gap-4">
                <span className={`font-extrabold text-3xl ${scoreColor(feedback.score)}`}>{feedback.score}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${verdictColor(feedback.verdict)}`}>
                  {feedback.verdict}
                </span>
              </div>

              {/* Feedback text */}
              <p className="text-white text-sm leading-relaxed">{feedback.feedback}</p>

              {/* Improvements */}
              {feedback.improvements?.length > 0 && (
                <div>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">How to improve</p>
                  <ul className="space-y-2">
                    {feedback.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-white text-sm">
                        <span className="text-[#FF6600] mt-0.5">▸</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flag */}
              {feedback.redFlag && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                  <span className="text-red-400 text-sm">⚠</span>
                  <p className="text-red-300 text-sm">{feedback.redFlag}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Section 5: Readiness Score Overlay ───────────────────────────────────── */
function ReadinessOverlay({ data, onClose }) {
  if (!data) return null

  const categories = [
    { key: 'teamComposition', label: 'Team Composition' },
    { key: 'ideaClarity', label: 'Idea Clarity' },
    { key: 'marketUnderstanding', label: 'Market Understanding' },
    { key: 'executionPlan', label: 'Execution Plan' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="max-w-lg w-full flex flex-col items-center">
        <div className="relative mb-8">
          <CircularScore score={data.score} size={200} />
        </div>

        <h2 className="text-white font-bold text-2xl mb-2">YC Readiness Score</h2>
        <p className="text-white/40 text-sm mb-10">Based on your team and application answers</p>

        <div className="w-full space-y-5">
          {categories.map(c => (
            <div key={c.key}>
              <div className="flex justify-between mb-1.5">
                <span className="text-white text-sm">{c.label}</span>
                <span className="text-[#FF6600] font-semibold text-sm">{data.breakdown[c.key]}</span>
              </div>
              <div className="w-full h-2.5 bg-[#FF6600]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF6600] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${data.breakdown[c.key]}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-white/30 text-sm mt-10 text-center">
          Keep refining your answers to increase your score
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth()

  // State
  const [teammates, setTeammates] = useState([])
  const [requests, setRequests] = useState([])
  const [answers, setAnswers] = useState({})
  const [feedbacks, setFeedbacks] = useState({})
  const [readinessScore, setReadinessScore] = useState(0)
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [loadingFeedback, setLoadingFeedback] = useState(null) // question id
  const [processingRequest, setProcessingRequest] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [readinessOverlay, setReadinessOverlay] = useState(null)
  const [calculatingReadiness, setCalculatingReadiness] = useState(false)

  const toast = useCallback(() => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }, [])

  // ── Load team, requests, and saved answers on mount ──
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      setLoadingTeam(true)

      // Load team
      try {
        const res = await fetch(`${API}/api/team/${user.uid}`)
        if (res.ok) {
          const data = await res.json()
          setTeammates(data.teammates || [])
        }
      } catch (e) { console.error('Team fetch error:', e) }

      // Load incoming requests
      try {
        const res = await fetch(`${API}/api/incoming-requests/${user.uid}`)
        if (res.ok) {
          const data = await res.json()
          setRequests(data.requests || [])
        }
      } catch (e) { console.error('Requests fetch error:', e) }

      // Load saved answers from Firestore
      try {
        const answersDoc = await getDoc(doc(db, 'teams', user.uid))
        if (answersDoc.exists()) {
          const savedAnswers = answersDoc.data().answers || {}
          setAnswers(savedAnswers)

          // Calculate readiness from number of answered questions
          const answeredCount = Object.values(savedAnswers).filter(a => a && a.trim()).length
          setReadinessScore(Math.round((answeredCount / 6) * 100 * 0.3)) // placeholder
        }
      } catch (e) { console.error('Answers fetch error:', e) }

      setLoadingTeam(false)
    }

    loadData()
  }, [user])

  // ── Accept connection ──
  const handleAccept = async (fromUid) => {
    setProcessingRequest(fromUid)
    try {
      const res = await fetch(`${API}/api/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUid, toUid: user.uid })
      })
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.uid !== fromUid))
        // Refresh team
        const teamRes = await fetch(`${API}/api/team/${user.uid}`)
        if (teamRes.ok) {
          const data = await teamRes.json()
          setTeammates(data.teammates || [])
        }
        toast()
      }
    } catch (e) { console.error('Accept error:', e) }
    setProcessingRequest(null)
  }

  // ── Decline connection ──
  const handleDecline = async (fromUid) => {
    setProcessingRequest(fromUid)
    // Remove from incomingRequests (we'll just filter locally for now)
    setRequests(prev => prev.filter(r => r.uid !== fromUid))
    setProcessingRequest(null)
  }

  // ── Save answer to Firestore ──
  const handleSaveAnswer = async (questionId, answerText) => {
    const newAnswers = { ...answers, [questionId]: answerText }
    setAnswers(newAnswers)

    try {
      await setDoc(doc(db, 'teams', user.uid), { answers: newAnswers }, { merge: true })

      const answeredCount = Object.values(newAnswers).filter(a => a && a.trim()).length
      setReadinessScore(Math.round((answeredCount / 6) * 100 * 0.3))

      toast()
    } catch (e) { console.error('Save error:', e) }
  }

  // ── Get AI Feedback ──
  const handleGetFeedback = async (questionId, questionText, answerText) => {
    if (!answerText.trim()) return
    setLoadingFeedback(questionId)

    try {
      const teamProfiles = teammates.length > 0 ? teammates : [{ name: user.displayName, skills: [], bio: '' }]

      const res = await fetch(`${API}/api/yc-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          answer: answerText,
          teamProfiles
        })
      })

      if (res.ok) {
        const data = await res.json()
        setFeedbacks(prev => ({ ...prev, [questionId]: data }))
      }
    } catch (e) { console.error('Feedback error:', e) }

    setLoadingFeedback(null)
  }

  // ── Calculate Final Readiness ──
  const handleCalculateReadiness = async () => {
    setCalculatingReadiness(true)
    try {
      const teamProfiles = teammates.length > 0 ? teammates : [{ name: user.displayName, skills: [], bio: '' }]

      const res = await fetch(`${API}/api/readiness-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamProfiles, answers })
      })

      if (res.ok) {
        const data = await res.json()
        setReadinessScore(data.score)
        setReadinessOverlay(data)
      }
    } catch (e) { console.error('Readiness error:', e) }
    setCalculatingReadiness(false)
  }

  const answeredCount = Object.values(answers).filter(a => a && a.trim()).length

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-white font-extrabold text-2xl sm:text-3xl mb-2">
            Welcome back,{' '}
            <span className="text-[#FF6600]">{user?.displayName?.split(' ')[0] || 'Founder'}</span> 👋
          </h1>
          <p className="text-white/50 text-sm">Your YC co-founder journey starts here.</p>
        </div>

        {/* ── SECTION 1: Your Team ── */}
        <section className="mb-10">
          <div className="flex items-baseline gap-3 mb-5">
            <h2 className="text-white font-bold text-xl">Your Team</h2>
            <span className="text-[#FF6600] text-sm">Your YC founding team</span>
          </div>
          <TeamSection teammates={teammates} loading={loadingTeam} />
        </section>

        {/* ── SECTION 2: Incoming Requests ── */}
        <RequestsSection
          requests={requests}
          onAccept={handleAccept}
          onDecline={handleDecline}
          processing={processingRequest}
        />

        {/* ── SECTION 3: YC Readiness Score ── */}
        {teammates.length > 0 && (
          <section className="mb-10">
            <div className="card rounded-xl p-8 flex flex-col items-center">
              <div className="relative">
                <CircularScore score={readinessScore} size={160} />
              </div>
              <p className="text-white font-semibold mt-4">YC Readiness Score</p>
              <p className="text-white/40 text-sm mt-1 text-center">
                Complete the prep questions below to improve your score
              </p>
            </div>
          </section>
        )}

        {/* ── SECTION 4: YC Prep Workspace ── */}
        <section className="mb-10">
          <div className="mb-6">
            <h2 className="text-white font-bold text-xl mb-1">YC Application Prep</h2>
            <p className="text-white/40 text-sm">
              Answer these questions as a team. Get real-time AI feedback from your YC coach.
            </p>
          </div>

          <div className="space-y-3">
            {YC_QUESTIONS.map(q => (
              <YCQuestionCard
                key={q.id}
                q={q}
                answer={answers[q.id]}
                feedback={feedbacks[q.id]}
                onSave={handleSaveAnswer}
                onGetFeedback={handleGetFeedback}
                loadingFeedback={loadingFeedback === q.id}
                teamProfiles={teammates}
              />
            ))}
          </div>
        </section>

        {/* ── SECTION 5: Generate Final Readiness Score ── */}
        {answeredCount >= 3 && (
          <section className="mb-16">
            <div className="flex justify-center">
              <button
                onClick={handleCalculateReadiness}
                disabled={calculatingReadiness}
                className="btn-primary text-lg px-10 py-4 rounded-xl font-bold disabled:opacity-50
                  shadow-lg shadow-[#FF6600]/20 hover:shadow-[#FF6600]/30 transition-all"
              >
                {calculatingReadiness ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Calculating...
                  </span>
                ) : 'Calculate Team Readiness Score'}
              </button>
            </div>
          </section>
        )}

      </main>

      {/* Toast */}
      <Toast show={showToast} />

      {/* Readiness Overlay */}
      <ReadinessOverlay data={readinessOverlay} onClose={() => setReadinessOverlay(null)} />
    </div>
  )
}
