import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Constants ──────────────────────────────────────────────────────────────────
const SKILLS_OPTS = ['Technical', 'Business', 'Design', 'Marketing', 'Sales', 'Finance', 'Legal', 'Operations', 'AI/ML', 'Product']
const INTERESTS_OPTS = ['Fintech', 'Edtech', 'Healthtech', 'SaaS', 'E-commerce', 'AI Tools', 'Climate', 'Developer Tools', 'Consumer Apps', 'B2B', 'Gaming', 'Deep Tech']
const BATCH_OPTS = ['S25', 'W26', 'S26', 'W27', 'Not sure yet']
const COMMITMENT_OPTS = ['Full-time', 'Part-time', 'Exploring']

// ── Helpers ────────────────────────────────────────────────────────────────────
function scoreColor(score) {
  if (score === null) return '#444444'
  if (score >= 80) return '#FF6600'
  if (score >= 60) return '#FF8C00'
  return '#666666'
}

function ideaStageLabel(stage) {
  const map = { clear: 'Clear Idea', rough: 'Rough Idea', looking: 'Seeking Idea' }
  return map[stage] || stage || 'Unknown'
}

// ── Skeleton Card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[#111111] border border-[#FF6600]/20 rounded-xl p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#1a1a1a]" />
        <div className="flex-1">
          <div className="h-4 bg-[#1a1a1a] rounded w-32 mb-2" />
          <div className="h-3 bg-[#1a1a1a] rounded w-20" />
        </div>
        <div className="w-14 h-14 rounded-full bg-[#1a1a1a]" />
      </div>
      <div className="h-3 bg-[#1a1a1a] rounded w-full mb-2" />
      <div className="h-3 bg-[#1a1a1a] rounded w-4/5 mb-4" />
      <div className="flex gap-2 mb-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-6 w-16 rounded-full bg-[#1a1a1a]" />)}
      </div>
      <div className="flex gap-2 mt-4 pt-4 border-t border-[#FF6600]/10">
        <div className="h-8 flex-1 rounded-lg bg-[#1a1a1a]" />
        <div className="h-8 flex-1 rounded-lg bg-[#1a1a1a]" />
      </div>
    </div>
  )
}

// ── Multi-Select Dropdown ──────────────────────────────────────────────────────
function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-black border border-[#FF6600]/50 text-white text-sm rounded-lg px-3 py-2 hover:border-[#FF6600] transition-colors min-w-[130px]"
      >
        <span className="flex-1 text-left truncate">
          {selected.length === 0 ? label : `${label} (${selected.length})`}
        </span>
        <span className="text-[#FF6600] text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-[#111] border border-[#FF6600]/40 rounded-xl shadow-2xl min-w-[180px] py-2 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-[#FF6600]/10 flex items-center gap-2"
            >
              <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs
                ${selected.includes(opt) ? 'bg-[#FF6600] border-[#FF6600] text-black' : 'border-[#FF6600]/40'}`}>
                {selected.includes(opt) ? '✓' : ''}
              </span>
              <span className={selected.includes(opt) ? 'text-[#FF6600]' : 'text-white'}>{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Single Select Dropdown ─────────────────────────────────────────────────────
function SingleSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-black border border-[#FF6600]/50 text-white text-sm rounded-lg px-3 py-2 hover:border-[#FF6600] transition-colors min-w-[130px]"
      >
        <span className="flex-1 text-left">{value || label}</span>
        <span className="text-[#FF6600] text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-[#111] border border-[#FF6600]/40 rounded-xl shadow-2xl min-w-[150px] py-2">
          <button
            onClick={() => { onChange(''); setOpen(false) }}
            className="w-full text-left px-4 py-2 text-sm text-white/40 hover:bg-[#FF6600]/10"
          >
            All
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#FF6600]/10 ${value === opt ? 'text-[#FF6600]' : 'text-white'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Profile Modal ─────────────────────────────────────────────────────────────
function ProfileModal({ founder, matchData, connectionStatus, onConnect, onClose }) {
  const score = matchData?.score ?? null
  const reasons = matchData?.reasons ?? []
  const warning = matchData?.warning ?? null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={onClose}>
      <div
        className="relative bg-[#111] border border-[#FF6600]/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white/60 hover:text-white hover:bg-[#FF6600]/20 transition-all z-10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="p-8 border-b border-[#FF6600]/20">
          <div className="flex items-start gap-5">
            {founder.photoURL ? (
              <img src={founder.photoURL} alt={founder.name} className="w-20 h-20 rounded-full border-2 border-[#FF6600] flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-[#FF6600] bg-black flex items-center justify-center text-[#FF6600] font-bold text-3xl flex-shrink-0">
                {founder.name?.[0] || '?'}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-white font-bold text-2xl">{founder.name}</h2>
              <p className="text-white/50 text-sm mt-1">{founder.location}</p>
              {founder.linkedin && (
                <a href={founder.linkedin} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[#FF6600] text-sm hover:underline">
                  🔗 LinkedIn
                </a>
              )}
            </div>
            {/* Score */}
            <div className="flex-shrink-0 text-center">
              <div
                className="w-20 h-20 rounded-full flex flex-col items-center justify-center border-4"
                style={{ borderColor: scoreColor(score), backgroundColor: scoreColor(score) + '15' }}
              >
                {score !== null ? (
                  <>
                    <span className="font-extrabold text-xl" style={{ color: scoreColor(score) }}>{score}</span>
                    <span className="text-white/40 text-xs">match</span>
                  </>
                ) : (
                  <span className="text-[#FF6600] text-lg animate-spin">⟳</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Bio */}
          <div>
            <h3 className="text-[#FF6600] font-semibold text-xs uppercase tracking-wider mb-2">About</h3>
            <p className="text-white/70 text-sm leading-relaxed">{founder.bio || 'No bio provided.'}</p>
          </div>

          {/* Skills */}
          {founder.skills?.length > 0 && (
            <div>
              <h3 className="text-[#FF6600] font-semibold text-xs uppercase tracking-wider mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {founder.skills.map((s) => (
                  <span key={s} className="text-xs border border-[#FF6600]/60 text-[#FF6600] rounded-full px-3 py-1">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {founder.interests?.length > 0 && (
            <div>
              <h3 className="text-[#FF6600] font-semibold text-xs uppercase tracking-wider mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {founder.interests.map((i) => (
                  <span key={i} className="text-xs border border-white/20 text-white/60 rounded-full px-3 py-1">{i}</span>
                ))}
              </div>
            </div>
          )}

          {/* Batch + Commitment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-[#FF6600] font-semibold text-xs uppercase tracking-wider mb-2">Target Batch</h3>
              <p className="text-white text-sm">{founder.targetBatch || '—'}</p>
            </div>
            <div>
              <h3 className="text-[#FF6600] font-semibold text-xs uppercase tracking-wider mb-2">Commitment</h3>
              <p className="text-white text-sm">{founder.commitmentLevel || '—'}</p>
            </div>
          </div>

          {/* Startup Idea */}
          {founder.startupIdea && (
            <div>
              <h3 className="text-[#FF6600] font-semibold text-xs uppercase tracking-wider mb-2">Startup Idea</h3>
              <p className="text-white/70 text-sm leading-relaxed">{founder.startupIdea}</p>
            </div>
          )}

          {/* Biggest Strength */}
          {founder.biggestStrength && (
            <div>
              <h3 className="text-[#FF6600] font-semibold text-xs uppercase tracking-wider mb-2">Biggest Strength</h3>
              <p className="text-white/70 text-sm leading-relaxed">{founder.biggestStrength}</p>
            </div>
          )}

          {/* Match Reasons */}
          {reasons.length > 0 && (
            <div className="bg-black/40 rounded-xl p-4 border border-[#FF6600]/20">
              <h3 className="text-[#FF6600] font-semibold text-xs uppercase tracking-wider mb-3">Why you match</h3>
              <ul className="space-y-2">
                {reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-[#FF6600] mt-0.5 flex-shrink-0">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
              {warning && (
                <p className="mt-3 text-xs text-[#FF4400] border-t border-[#FF4400]/20 pt-3">
                  ⚠ {warning}
                </p>
              )}
            </div>
          )}

          {/* Connect Button */}
          <div className="pt-2">
            {connectionStatus === 'connected' ? (
              <div className="w-full py-3 text-center rounded-lg bg-[#FF6600]/10 border border-[#FF6600]/40 text-[#FF6600] font-semibold text-sm">
                Connected ✓
              </div>
            ) : connectionStatus === 'pending' ? (
              <div className="w-full py-3 text-center rounded-lg bg-black/50 border border-white/10 text-white/40 font-semibold text-sm">
                Request Sent
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="w-full btn-primary py-3 text-base font-bold rounded-lg"
              >
                Connect with {founder.name?.split(' ')[0]} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Founder Card ───────────────────────────────────────────────────────────────
function FounderCard({ founder, matchData, connectionStatus, onConnect, onViewProfile }) {
  const [expanded, setExpanded] = useState(false)
  const score = matchData?.score ?? null
  const reasons = matchData?.reasons ?? []
  const warning = matchData?.warning ?? null
  const isLoading = matchData === undefined

  return (
    <div
      className="bg-[#111111] border border-[#FF6600]/30 rounded-xl p-5 flex flex-col hover:border-[#FF6600]/70 transition-all duration-300 group"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Top Row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1">
          {founder.photoURL ? (
            <img src={founder.photoURL} alt={founder.name} className="w-11 h-11 rounded-full border border-[#FF6600]/50 mb-2" />
          ) : (
            <div className="w-11 h-11 rounded-full border border-[#FF6600]/50 bg-black flex items-center justify-center text-[#FF6600] font-bold text-lg mb-2">
              {founder.name?.[0] || '?'}
            </div>
          )}
          <h3 className="text-white font-bold text-base leading-tight">{founder.name}</h3>
          <p className="text-white/40 text-xs mt-0.5">{founder.location}</p>
        </div>

        {/* Score Badge */}
        <div
          className="w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 flex-shrink-0"
          style={{
            borderColor: scoreColor(score),
            backgroundColor: scoreColor(score) + '15',
          }}
        >
          {isLoading ? (
            <span className="text-[#FF6600] text-lg animate-spin">⟳</span>
          ) : (
            <>
              <span className="font-extrabold text-sm leading-none" style={{ color: scoreColor(score) }}>{score}</span>
              <span className="text-white/30 text-[9px]">match</span>
            </>
          )}
        </div>
      </div>

      {/* Bio */}
      <p className="text-white/55 text-xs leading-relaxed mb-3 overflow-hidden line-clamp-2 flex-shrink-0">
        {founder.bio || 'No bio provided.'}
      </p>

      {/* Skills */}
      {founder.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {founder.skills.slice(0, 4).map((s) => (
            <span key={s} className="text-[10px] border border-[#FF6600]/50 text-[#FF6600] rounded-full px-2 py-0.5">{s}</span>
          ))}
          {founder.skills.length > 4 && <span className="text-[10px] text-white/30 px-1">+{founder.skills.length - 4}</span>}
        </div>
      )}

      {/* Interests */}
      {founder.interests?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {founder.interests.slice(0, 3).map((i) => (
            <span key={i} className="text-[10px] border border-white/15 text-white/40 rounded-full px-2 py-0.5">{i}</span>
          ))}
        </div>
      )}

      {/* Tags Row */}
      <div className="flex items-center gap-2 mb-3">
        {founder.ideaStage && (
          <span className="text-[10px] bg-[#FF6600] text-black font-semibold rounded-full px-2.5 py-0.5">
            {ideaStageLabel(founder.ideaStage)}
          </span>
        )}
        {founder.targetBatch && (
          <span className="text-[10px] text-[#FF6600]">Targeting {founder.targetBatch}</span>
        )}
      </div>

      {/* Expand: Match Reasons */}
      <div className={`overflow-hidden transition-all duration-300 ${expanded && reasons.length > 0 ? 'max-h-40 opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-[#FF6600]/15 pt-3">
          <p className="text-[#FF6600] text-[10px] font-semibold uppercase tracking-wider mb-2">Why you match</p>
          <ul className="space-y-1.5">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-white/60">
                <span className="text-[#FF6600] flex-shrink-0 mt-0.5">✓</span>
                {r}
              </li>
            ))}
          </ul>
          {warning && (
            <p className="mt-2 text-[10px] text-[#FF4400]">⚠ {warning}</p>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Buttons */}
      <div className="flex gap-2 pt-3 border-t border-[#FF6600]/10 mt-2">
        <button
          onClick={onViewProfile}
          className="flex-1 text-xs border border-[#FF6600] text-[#FF6600] rounded-lg py-2 hover:bg-[#FF6600]/10 transition-colors font-medium"
        >
          View Profile
        </button>
        {connectionStatus === 'connected' ? (
          <div className="flex-1 text-xs text-center rounded-lg py-2 bg-[#FF6600]/10 border border-[#FF6600]/30 text-[#FF6600] font-semibold">
            Connected ✓
          </div>
        ) : connectionStatus === 'pending' ? (
          <div className="flex-1 text-xs text-center rounded-lg py-2 bg-black/40 border border-white/10 text-white/30 font-semibold">
            Request Sent
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="flex-1 text-xs bg-[#FF6600] text-black rounded-lg py-2 hover:bg-[#FF8C00] transition-colors font-bold"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Browse Component ──────────────────────────────────────────────────────
export default function Browse() {
  const { user } = useAuth()
  const [currentUserData, setCurrentUserData] = useState(null)
  const [founders, setFounders] = useState([])
  const [matchData, setMatchData] = useState({}) // uid → { score, reasons, warning } | undefined (loading)
  const [connectionMap, setConnectionMap] = useState({}) // uid → 'connected' | 'pending' | null
  const [loading, setLoading] = useState(true)
  const [selectedFounder, setSelectedFounder] = useState(null)

  // Filters
  const [filterSkills, setFilterSkills] = useState([])
  const [filterInterests, setFilterInterests] = useState([])
  const [filterBatch, setFilterBatch] = useState('')
  const [filterCommitment, setFilterCommitment] = useState('')

  // Load current user data from Firestore
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) setCurrentUserData(snap.data())
    })
  }, [user])

  // Fetch founders from backend
  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetch(`${API_BASE}/api/founders?exclude_uid=${user.uid}`)
      .then((r) => r.json())
      .then((data) => {
        setFounders(data.founders || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  // Compute match scores asynchronously once we have current user data and founders
  useEffect(() => {
    if (!currentUserData || founders.length === 0) return

    // Set all as loading (undefined)
    const initial = {}
    founders.forEach((f) => { initial[f.uid] = undefined })
    setMatchData(initial)

    // Fetch match score for each founder in parallel
    founders.forEach((f) => {
      fetch(`${API_BASE}/api/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUser: currentUserData, otherUser: f }),
      })
        .then((r) => r.json())
        .then((data) => {
          setMatchData((prev) => ({ ...prev, [f.uid]: data }))
        })
        .catch(() => {
          setMatchData((prev) => ({ ...prev, [f.uid]: { score: 50, reasons: [], warning: null } }))
        })
    })
  }, [currentUserData, founders])

  // Build connection map from current user's connections/pendingRequests
  useEffect(() => {
    if (!currentUserData) return
    const map = {}
    ;(currentUserData.connections || []).forEach((uid) => { map[uid] = 'connected' })
    ;(currentUserData.pendingRequests || []).forEach((uid) => { map[uid] = 'pending' })
    setConnectionMap(map)
  }, [currentUserData])

  const handleConnect = useCallback(async (founderUid) => {
    if (!user) return
    try {
      await fetch(`${API_BASE}/api/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUid: user.uid, toUid: founderUid }),
      })
      setConnectionMap((prev) => ({ ...prev, [founderUid]: 'pending' }))
    } catch (err) {
      console.error('Connect error', err)
    }
  }, [user])

  // Filter logic
  const filteredFounders = founders.filter((f) => {
    if (filterSkills.length > 0 && !filterSkills.some((s) => f.skills?.includes(s))) return false
    if (filterInterests.length > 0 && !filterInterests.some((i) => f.interests?.includes(i))) return false
    if (filterBatch && f.targetBatch !== filterBatch) return false
    if (filterCommitment && f.commitmentLevel !== filterCommitment) return false
    return true
  })

  // Sort by match score (highest first), loading ones go last
  const sortedFounders = [...filteredFounders].sort((a, b) => {
    const aScore = matchData[a.uid]?.score ?? -1
    const bScore = matchData[b.uid]?.score ?? -1
    return bScore - aScore
  })

  const hasFilters = filterSkills.length > 0 || filterInterests.length > 0 || filterBatch || filterCommitment
  const resetFilters = () => {
    setFilterSkills([])
    setFilterInterests([])
    setFilterBatch('')
    setFilterCommitment('')
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-white font-extrabold text-3xl mb-1">Find Your Co-Founder</h1>
          <p className="text-[#FF6600] font-medium text-base">AI-matched founders for your YC journey</p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-[#111]/80 rounded-xl border border-[#FF6600]/20">
          <MultiSelect label="Skills" options={SKILLS_OPTS} selected={filterSkills} onChange={setFilterSkills} />
          <MultiSelect label="Interests" options={INTERESTS_OPTS} selected={filterInterests} onChange={setFilterInterests} />
          <SingleSelect label="Batch" options={BATCH_OPTS} value={filterBatch} onChange={setFilterBatch} />
          <SingleSelect label="Commitment" options={COMMITMENT_OPTS} value={filterCommitment} onChange={setFilterCommitment} />
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="text-sm border border-[#FF6600] text-[#FF6600] rounded-lg px-4 py-2 hover:bg-[#FF6600]/10 transition-colors"
            >
              Reset Filters
            </button>
          )}
          <span className="text-white/30 text-xs ml-auto">
            {filteredFounders.length} founder{filteredFounders.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : sortedFounders.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-5">🔍</div>
            <h3 className="text-white font-bold text-xl mb-2">No founders match your filters yet.</h3>
            <p className="text-white/40 text-sm mb-6">Try adjusting your filters or check back soon.</p>
            {hasFilters && (
              <button onClick={resetFilters} className="btn-outline text-sm px-6 py-2.5 rounded-lg">
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedFounders.map((f) => (
              <FounderCard
                key={f.uid}
                founder={f}
                matchData={matchData[f.uid]}
                connectionStatus={connectionMap[f.uid] || null}
                onConnect={() => handleConnect(f.uid)}
                onViewProfile={() => setSelectedFounder(f)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Profile Modal */}
      {selectedFounder && (
        <ProfileModal
          founder={selectedFounder}
          matchData={matchData[selectedFounder.uid]}
          connectionStatus={connectionMap[selectedFounder.uid] || null}
          onConnect={() => {
            handleConnect(selectedFounder.uid)
            setSelectedFounder(null)
          }}
          onClose={() => setSelectedFounder(null)}
        />
      )}
    </div>
  )
}
