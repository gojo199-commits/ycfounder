import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}>
        <h1 className="text-[#FF6600] font-extrabold text-[120px] sm:text-[180px] leading-none mb-4">404</h1>
        <p className="text-white text-xl font-semibold mb-2">This page doesn't exist.</p>
        <p className="text-white/40 text-sm mb-8">The page you're looking for may have been moved or deleted.</p>
        <Link to="/" className="btn-primary text-base px-8 py-4 rounded-lg font-bold inline-block">
          Go back home
        </Link>
      </motion.div>
    </div>
  )
}
