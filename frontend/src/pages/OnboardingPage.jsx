import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

// ── Data ──────────────────────────────────────────────────────────────────────
const SKILLS = ['Technical', 'Business', 'Design', 'Marketing', 'Sales', 'Finance', 'Legal', 'Operations', 'AI/ML', 'Product']
const INTERESTS = ['Fintech', 'Edtech', 'Healthtech', 'SaaS', 'E-commerce', 'AI Tools', 'Climate', 'Developer Tools', 'Consumer Apps', 'B2B', 'Gaming', 'Deep Tech']
const IDEA_STAGES = [
  { value: 'clear', label: 'I have a clear idea', desc: 'I know exactly what I want to build.' },
  { value: 'rough', label: 'I have a rough idea', desc: 'I have direction but still figuring out details.' },
  { value: 'looking', label: 'I am looking for an idea', desc: 'I want to find the right problem to solve.' },
]
const COMMITMENT_LEVELS = ['Full-time', 'Part-time', 'Exploring']
const BATCHES = ['S25', 'W26', 'S26', 'W27', 'Not sure yet']
const LOOKING_FOR = ['Technical', 'Business', 'Design', 'Marketing', 'Sales', 'Finance', 'AI/ML', 'Product']

// ── Pill Toggle ────────────────────────────────────────────────────────────────
function PillToggle({ options, selected, onToggle, single = false }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const isSelected = single ? selected === opt : selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`pill ${isSelected ? 'selected' : ''}`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ── Progress Bar ───────────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`text-xs font-semibold ${i < step ? 'text-[#FF6600]' : 'text-white/30'}`}
          >
            Step {i + 1}
          </span>
        ))}
      </div>
      <div className="w-full h-1.5 bg-[#FF6600]/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FF6600] rounded-full transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // Step 1 state
  const [name, setName] = useState(user?.displayName || '')
  const [bio, setBio] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [location, setLocation] = useState('')

  // Step 2 state
  const [skills, setSkills] = useState([])
  const [interests, setInterests] = useState([])
  const [ideaStage, setIdeaStage] = useState('')
  const [commitment, setCommitment] = useState('')

  // Step 3 state
  const [targetBatch, setTargetBatch] = useState('')
  const [lookingFor, setLookingFor] = useState([])
  const [startupIdea, setStartupIdea] = useState('')
  const [biggestStrength, setBiggestStrength] = useState('')

  const toggleMulti = (setter, current, val) => {
    setter(current.includes(val) ? current.filter((v) => v !== val) : [...current, val])
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email: user.email,
        photoURL: user.photoURL,
        bio,
        linkedin,
        location,
        skills,
        interests,
        ideaStage,
        commitmentLevel: commitment,
        targetBatch,
        lookingFor,
        startupIdea,
        biggestStrength,
        createdAt: serverTimestamp(),
        connections: [],
        pendingRequests: [],
      })
      setDone(true)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  // ── Success State ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="card rounded-2xl p-12 max-w-md w-full text-center border border-[#FF6600]/40">
          <div className="text-6xl mb-6 animate-bounce">✅</div>
          <h2 className="text-white font-extrabold text-3xl mb-3">You're in!</h2>
          <p className="text-white/60 mb-8 text-base leading-relaxed">
            Let's find your team.
          </p>
          <button
            id="browse-founders-btn"
            onClick={() => navigate('/browse')}
            className="btn-primary w-full py-4 text-base font-bold rounded-lg"
          >
            Browse Founders →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[#FF6600] font-extrabold text-2xl mb-1">YFounder</h1>
          <h2 className="text-white font-bold text-2xl">Create your founder profile</h2>
          <p className="text-white/40 text-sm mt-2">Tell us about yourself so we can find your perfect co-founder.</p>
        </div>

        <ProgressBar step={step} total={3} />

        <div className="card rounded-2xl p-8 border border-[#FF6600]/40">

          {/* ── STEP 1 ─────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-white font-bold text-xl mb-6">
                <span className="text-[#FF6600]">01</span> Basic Info
              </h3>

              {/* Profile Photo */}
              <div className="flex items-center gap-4 p-4 bg-black/50 rounded-xl border border-[#FF6600]/20">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-14 h-14 rounded-full border-2 border-[#FF6600]" />
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-[#FF6600] bg-[#111] flex items-center justify-center text-[#FF6600] font-bold text-xl">
                    {user?.displayName?.[0] || 'Y'}
                  </div>
                )}
                <div>
                  <p className="text-white text-sm font-medium">Profile photo from Google</p>
                  <p className="text-white/40 text-xs">Automatically synced from your account</p>
                </div>
              </div>

              <div>
                <label className="text-white/70 text-sm font-medium block mb-2">Full Name *</label>
                <input
                  id="input-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm font-medium block mb-2">One-line bio *</label>
                <input
                  id="input-bio"
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ex: CS grad who wants to build in fintech"
                  maxLength={120}
                  className="input-field"
                />
                <p className="text-white/30 text-xs mt-1">{bio.length}/120</p>
              </div>

              <div>
                <label className="text-white/70 text-sm font-medium block mb-2">LinkedIn URL <span className="text-white/30">(optional)</span></label>
                <input
                  id="input-linkedin"
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm font-medium block mb-2">Location *</label>
                <input
                  id="input-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* ── STEP 2 ─────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-8">
              <h3 className="text-white font-bold text-xl mb-6">
                <span className="text-[#FF6600]">02</span> Founder Profile
              </h3>

              <div>
                <label className="text-white/80 text-sm font-semibold block mb-3">Your Skills</label>
                <PillToggle
                  options={SKILLS}
                  selected={skills}
                  onToggle={(v) => toggleMulti(setSkills, skills, v)}
                />
              </div>

              <div>
                <label className="text-white/80 text-sm font-semibold block mb-3">Your Interests</label>
                <PillToggle
                  options={INTERESTS}
                  selected={interests}
                  onToggle={(v) => toggleMulti(setInterests, interests, v)}
                />
              </div>

              <div>
                <label className="text-white/80 text-sm font-semibold block mb-3">Your Idea Stage</label>
                <div className="space-y-3">
                  {IDEA_STAGES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setIdeaStage(s.value)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                        ideaStage === s.value
                          ? 'border-[#FF6600] bg-[#FF6600]/10'
                          : 'border-[#FF6600]/20 bg-black/30 hover:border-[#FF6600]/50'
                      }`}
                    >
                      <p className={`font-semibold text-sm ${ideaStage === s.value ? 'text-[#FF6600]' : 'text-white'}`}>
                        {s.label}
                      </p>
                      <p className="text-white/40 text-xs mt-1">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white/80 text-sm font-semibold block mb-3">Commitment Level</label>
                <PillToggle
                  options={COMMITMENT_LEVELS}
                  selected={commitment}
                  onToggle={setCommitment}
                  single
                />
              </div>
            </div>
          )}

          {/* ── STEP 3 ─────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-8">
              <h3 className="text-white font-bold text-xl mb-6">
                <span className="text-[#FF6600]">03</span> YC Goals
              </h3>

              <div>
                <label className="text-white/80 text-sm font-semibold block mb-3">Which YC batch are you targeting?</label>
                <select
                  id="select-batch"
                  value={targetBatch}
                  onChange={(e) => setTargetBatch(e.target.value)}
                  className="input-field appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23FF6600' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                >
                  <option value="" disabled>Select a batch</option>
                  {BATCHES.map((b) => (
                    <option key={b} value={b} className="bg-black">{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white/80 text-sm font-semibold block mb-3">What kind of co-founder are you looking for?</label>
                <PillToggle
                  options={LOOKING_FOR}
                  selected={lookingFor}
                  onToggle={(v) => toggleMulti(setLookingFor, lookingFor, v)}
                />
              </div>

              <div>
                <label className="text-white/80 text-sm font-semibold block mb-2">Tell us about your startup idea</label>
                <textarea
                  id="textarea-idea"
                  value={startupIdea}
                  onChange={(e) => setStartupIdea(e.target.value)}
                  placeholder="Describe your idea in 2-3 sentences. If you don't have one yet, describe what problem you want to solve."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="text-white/80 text-sm font-semibold block mb-2">Your biggest strength as a founder</label>
                <textarea
                  id="textarea-strength"
                  value={biggestStrength}
                  onChange={(e) => setBiggestStrength(e.target.value)}
                  placeholder="What makes you an exceptional founder?"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ────────────────────────────────────────── */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[#FF6600]/20">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn-outline px-6 py-3 text-sm"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="btn-primary px-8 py-3 text-sm font-bold"
                id={`next-step-${step}-btn`}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                id="submit-profile-btn"
                className="btn-primary px-8 py-3 text-sm font-bold disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Complete Profile →'}
              </button>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <p className="text-center text-white/30 text-xs mt-6">Step {step} of 3</p>
      </div>
    </div>
  )
}
