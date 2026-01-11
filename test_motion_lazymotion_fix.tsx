'use client'

import { m, LazyMotion, domMax } from 'framer-motion'

// This should work without errors - using m instead of motion within LazyMotion
export function TestMotionFix() {
  return (
    <LazyMotion features={domMax} strict>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 bg-blue-500 text-white"
      >
        This should work correctly with LazyMotion + m component
      </m.div>
    </LazyMotion>
  )
}

// This would cause the error - motion within LazyMotion (commented out)
/*
import { motion, LazyMotion, domMax } from 'framer-motion'

export function TestMotionError() {
  return (
    <LazyMotion features={domMax} strict>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 bg-red-500 text-white"
      >
        This would cause the error: motion within LazyMotion
      </motion.div>
    </LazyMotion>
  )
}
*/