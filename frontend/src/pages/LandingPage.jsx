import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const features = [
  { icon: '🤖', title: 'AI-Powered Matching', description: 'Our AI analyzes your skills, interests, and goals to connect you with founders who complement your profile — not just anyone who applied.' },
  { icon: '🚀', title: 'YC Prep Workspace', description: 'Practice YC interview questions, refine your pitch, and get AI feedback — all inside a workspace built specifically for aspiring YC founders.' },
  { icon: '📊', title: 'Team Readiness Score', description: 'Get a live score showing how YC-ready your team is based on skill coverage, idea clarity, and commitment alignment.' },
]

const steps = [
  { num: '01', icon: '👤', title: 'Create your founder profile', desc: 'Tell your skills, interests, and YC goals to our matching engine.' },
  { num: '02', icon: '🤝', title: 'Get AI-matched with co-founders', desc: 'Our AI finds founders whose skills complement yours perfectly.' },
  { num: '03', icon: '🎯', title: 'Prep for YC together', desc: 'Practice application questions and get real-time AI coaching.' },
]

const stats = [
  { value: '10,000+', label: 'Founders' },
  { value: '500+', label: 'Teams Formed' },
  { value: 'YC S25 & W26', label: 'Targeting' },
  { value: 'AI-Powered', label: 'Matching' },
]

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black font-inter relative overflow-hidden">
      {/* Floating Dots CSS Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-[#FF6600]"
            style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              opacity: 0.15 + Math.random() * 0.2,
              animation: `float ${8 + Math.random() * 12}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }} />
        ))}
        <style>{`@keyframes float { 0%,100% { transform: translateY(0px) translateX(0px); } 25% { transform: translateY(-20px) translateX(10px); } 50% { transform: translateY(-10px) translateX(-15px); } 75% { transform: translateY(-30px) translateX(5px); } }`}</style>
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-5 border-b border-[#FF6600]/20">
        <span className="text-[#FF6600] font-bold text-xl tracking-tight">YFounder</span>
        <Link to="/auth" className="text-sm text-white hover:text-[#FF6600] transition-colors duration-200 font-medium">Sign In →</Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-6 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}>
          <div className="mb-8 inline-flex items-center gap-2 border border-[#FF6600]/40 rounded-full px-4 py-2 bg-[#FF6600]/5">
            <span className="w-2 h-2 rounded-full bg-[#FF6600] animate-pulse inline-block" />
            <span className="text-[#FF6600] text-xs font-semibold uppercase tracking-widest">Built for Y Combinator Aspirants</span>
          </div>
        </motion.div>

        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold text-white leading-tight max-w-4xl mb-4">
          Y Combinator doesn't fund{' '}
          <span className="relative">solo founders<span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#FF6600] rounded-full" style={{ bottom: '-4px' }} /></span>.
        </motion.h1>

        <motion.h2 initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-6xl font-extrabold text-[#FF6600] mt-6 mb-8">
          It funds <em className="not-italic">teams</em>.
        </motion.h2>

        <motion.p initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6, delay: 0.3 }}
          className="text-white/70 text-lg md:text-xl max-w-2xl leading-relaxed mb-12">
          YFounder finds and forms your team for you — matching aspiring entrepreneurs by skills and interests before you ever hit apply for Y Combinator.
        </motion.p>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth" id="get-started-btn"
            className="btn-primary text-base px-8 py-4 rounded-lg font-bold tracking-wide hover:scale-[1.02] transition-transform">
            Get Started
          </Link>
          <a href="#features" className="btn-outline text-base px-8 py-4 rounded-lg font-bold tracking-wide hover:scale-[1.02] transition-transform">
            Learn More
          </a>
        </motion.div>

        <div className="mt-20 flex flex-wrap gap-12 justify-center border-t border-[#FF6600]/20 pt-10">
          {[
            { label: 'Founders Matched', value: '1,200+' },
            { label: 'Teams Formed', value: '340+' },
            { label: 'YC Applications', value: '80+' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[#FF6600] text-3xl font-extrabold">{s.value}</p>
              <p className="text-white/50 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-center text-white text-3xl font-bold mb-4">Everything you need to get into YC</h3>
          <p className="text-center text-white/50 mb-16 text-base max-w-xl mx-auto">
            From finding your co-founder to acing the interview — YFounder has you covered.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ duration: 0.5, delay: i * 0.15 }}
                className="card hover:border-[#FF6600]/70 transition-all duration-300 hover:-translate-y-1 group">
                <div className="text-4xl mb-5 group-hover:scale-110 transition-transform duration-200">{f.icon}</div>
                <h4 className="text-white font-bold text-lg mb-3">{f.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 py-24 px-6 border-t border-[#FF6600]/20">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-center text-white text-3xl font-bold mb-4">How it Works</h3>
          <p className="text-center text-white/50 mb-16 text-base">Three simple steps to your YC-ready team</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Dashed line connecting steps (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] border-t-2 border-dashed border-[#FF6600]/30" />

            {steps.map((s, i) => (
              <motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ duration: 0.5, delay: i * 0.2 }}
                className="text-center relative z-10">
                <div className="w-24 h-24 rounded-full bg-[#FF6600]/10 border-2 border-[#FF6600]/30 mx-auto flex items-center justify-center mb-5">
                  <span className="text-[#FF6600] font-extrabold text-3xl">{s.num}</span>
                </div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h4 className="text-white font-bold text-lg mb-2">{s.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why YFounder */}
      <section className="relative z-10 py-24 px-6 border-t border-[#FF6600]/20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} transition={{ duration: 0.5 }}>
            <h3 className="text-white text-4xl font-extrabold mb-4 leading-tight">
              Why YFounder?
            </h3>
            <p className="text-[#FF6600] text-lg leading-relaxed">
              YC doesn't just fund ideas — it funds exceptional teams. We help you build the team that
              gets you in. With AI-powered matching and real coaching tools, you'll go from solo founder
              to YC-ready team in days, not months.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ duration: 0.4, delay: i * 0.1 }}
                className="card rounded-xl text-center py-8">
                <p className="text-[#FF6600] text-2xl font-extrabold mb-1">{s.value}</p>
                <p className="text-white/50 text-sm">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 py-20 px-6 border-t border-[#FF6600]/20">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-white text-3xl font-bold mb-4">Ready to find your co-founder?</h3>
          <p className="text-white/50 mb-8">Join hundreds of founders already using YFounder to build their YC-ready teams.</p>
          <Link to="/auth" className="btn-primary text-base px-10 py-4 rounded-lg font-bold tracking-wide inline-block hover:scale-[1.02] transition-transform">
            Join YFounder — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#FF6600]/20 py-8 text-center">
        <p className="text-white/40 text-sm">YFounder © 2025 — Built for founders, by founders</p>
      </footer>
    </div>
  )
}
