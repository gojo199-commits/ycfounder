import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'

const SKILLS = ['Technical', 'Business', 'Design', 'Marketing', 'Sales', 'Finance', 'Legal', 'Operations', 'AI/ML', 'Product']
const INTERESTS = ['Fintech', 'Edtech', 'Healthtech', 'SaaS', 'E-commerce', 'AI Tools', 'Climate', 'Developer Tools', 'Consumer Apps', 'B2B', 'Gaming', 'Deep Tech']
const COMMITMENT_LEVELS = ['Full-time', 'Part-time', 'Exploring']
const BATCHES = ['S25', 'W26', 'S26', 'W27', 'Not sure yet']
const LOOKING_FOR = ['Technical', 'Business', 'Design', 'Marketing', 'Sales', 'Finance', 'AI/ML', 'Product']

function PillToggle({ options, selected, onToggle, single = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = single ? selected === opt : selected.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => onToggle(opt)}
            className={`pill ${isSelected ? 'selected' : ''}`}>{opt}</button>
        )
      })}
    </div>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [preview, setPreview] = useState(false)

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState([])
  const [interests, setInterests] = useState([])
  const [ideaStage, setIdeaStage] = useState('')
  const [commitment, setCommitment] = useState('')
  const [targetBatch, setTargetBatch] = useState('')
  const [lookingFor, setLookingFor] = useState([])
  const [startupIdea, setStartupIdea] = useState('')
  const [biggestStrength, setBiggestStrength] = useState('')

  const toggleMulti = (setter, current, val) =>
    setter(current.includes(val) ? current.filter(v => v !== val) : [...current, val])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const d = snap.data()
          setName(d.name || ''); setBio(d.bio || ''); setLinkedin(d.linkedin || '')
          setLocation(d.location || ''); setSkills(d.skills || []); setInterests(d.interests || [])
          setIdeaStage(d.ideaStage || ''); setCommitment(d.commitmentLevel || '')
          setTargetBatch(d.targetBatch || ''); setLookingFor(d.lookingFor || [])
          setStartupIdea(d.startupIdea || ''); setBiggestStrength(d.biggestStrength || '')
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name, bio, linkedin, location, skills, interests,
        ideaStage, commitmentLevel: commitment, targetBatch,
        lookingFor, startupIdea, biggestStrength
      })
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black"><Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-[#FF6600]/30 border-t-[#FF6600] rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // ── Preview Mode ──
  if (preview) {
    return (
      <div className="min-h-screen bg-black"><Navbar />
        <main className="max-w-2xl mx-auto px-6 py-12">
          <button onClick={() => setPreview(false)} className="text-[#FF6600] text-sm mb-6 hover:underline">← Back to edit</button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card rounded-2xl p-8 border border-[#FF6600]/40">
            <div className="flex items-center gap-4 mb-6">
              {user?.photoURL
                ? <img src={user.photoURL} className="w-16 h-16 rounded-full border-2 border-[#FF6600]" alt="" />
                : <div className="w-16 h-16 rounded-full bg-[#FF6600]/20 flex items-center justify-center text-[#FF6600] font-bold text-2xl">{name[0]}</div>}
              <div>
                <h2 className="text-white font-bold text-xl">{name}</h2>
                <p className="text-white/50 text-sm">{location}</p>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-4">{bio}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map(s => <span key={s} className="bg-[#FF6600]/10 text-[#FF6600] text-xs px-3 py-1 rounded-full">{s}</span>)}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.map(i => <span key={i} className="bg-white/5 text-white/60 text-xs px-3 py-1 rounded-full">{i}</span>)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-white/40">Idea Stage:</span> <span className="text-white">{ideaStage}</span></div>
              <div><span className="text-white/40">Commitment:</span> <span className="text-white">{commitment}</span></div>
              <div><span className="text-white/40">Target Batch:</span> <span className="text-[#FF6600] font-semibold">{targetBatch}</span></div>
              <div><span className="text-white/40">Looking For:</span> <span className="text-white">{lookingFor.join(', ')}</span></div>
            </div>
            {startupIdea && <div className="mt-4 pt-4 border-t border-[#FF6600]/20">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Startup Idea</p>
              <p className="text-white text-sm">{startupIdea}</p>
            </div>}
          </motion.div>
        </main>
      </div>
    )
  }

  // ── Edit Mode ──
  return (
    <div className="min-h-screen bg-black"><Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white font-extrabold text-2xl">Edit Profile</h1>
            <p className="text-white/40 text-sm mt-1">Update your founder profile</p>
          </div>
          <button onClick={() => setPreview(true)} className="text-[#FF6600] text-sm hover:underline">Preview →</button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card rounded-2xl p-6 sm:p-8 border border-[#FF6600]/40 space-y-6">

          {/* Photo */}
          <div className="flex items-center gap-4 p-4 bg-black/50 rounded-xl border border-[#FF6600]/20">
            {user?.photoURL
              ? <img src={user.photoURL} className="w-14 h-14 rounded-full border-2 border-[#FF6600]" alt="" />
              : <div className="w-14 h-14 rounded-full border-2 border-[#FF6600] bg-[#111] flex items-center justify-center text-[#FF6600] font-bold text-xl">{name[0]}</div>}
            <div>
              <p className="text-white text-sm font-medium">Profile photo from Google</p>
              <p className="text-white/40 text-xs">Synced from your account</p>
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Your full name" />
          </div>
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Bio</label>
            <input value={bio} onChange={e => setBio(e.target.value)} className="input-field" placeholder="One-line bio" maxLength={120} />
            <p className="text-white/30 text-xs mt-1">{bio.length}/120</p>
          </div>
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">LinkedIn</label>
            <input value={linkedin} onChange={e => setLinkedin(e.target.value)} className="input-field" placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} className="input-field" placeholder="City, Country" />
          </div>

          <div>
            <label className="text-white/80 text-sm font-semibold block mb-3">Skills</label>
            <PillToggle options={SKILLS} selected={skills} onToggle={v => toggleMulti(setSkills, skills, v)} />
          </div>
          <div>
            <label className="text-white/80 text-sm font-semibold block mb-3">Interests</label>
            <PillToggle options={INTERESTS} selected={interests} onToggle={v => toggleMulti(setInterests, interests, v)} />
          </div>
          <div>
            <label className="text-white/80 text-sm font-semibold block mb-3">Commitment</label>
            <PillToggle options={COMMITMENT_LEVELS} selected={commitment} onToggle={setCommitment} single />
          </div>
          <div>
            <label className="text-white/80 text-sm font-semibold block mb-3">Target Batch</label>
            <PillToggle options={BATCHES} selected={targetBatch} onToggle={setTargetBatch} single />
          </div>
          <div>
            <label className="text-white/80 text-sm font-semibold block mb-3">Looking For</label>
            <PillToggle options={LOOKING_FOR} selected={lookingFor} onToggle={v => toggleMulti(setLookingFor, lookingFor, v)} />
          </div>
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Startup Idea</label>
            <textarea value={startupIdea} onChange={e => setStartupIdea(e.target.value)}
              className="input-field resize-none" rows={3} placeholder="Describe your idea..." />
          </div>
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Biggest Strength</label>
            <textarea value={biggestStrength} onChange={e => setBiggestStrength(e.target.value)}
              className="input-field resize-none" rows={3} placeholder="What makes you exceptional?" />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full py-4 text-base font-bold rounded-lg disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </motion.div>
      </main>

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-50 bg-[#111] border border-[#FF6600]/60 text-[#FF6600]
        px-5 py-3 rounded-lg font-medium text-sm shadow-lg transition-all duration-300 flex items-center gap-2
        ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>Saved
      </div>
    </div>
  )
}
