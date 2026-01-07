'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface Collaborator {
  id: string
  name: string
  color: string
  cursor: { x: number; y: number }
}

interface CollaboratorCursorsProps {
  collaborators: Collaborator[]
}

export function CollaboratorCursors({ collaborators }: CollaboratorCursorsProps) {
  return (
    <AnimatePresence>
      {collaborators.map((collaborator) => (
        <motion.div
          key={collaborator.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="absolute pointer-events-none z-50"
          style={{
            left: collaborator.cursor.x,
            top: collaborator.cursor.y
          }}
        >
          {/* Cursor */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: collaborator.color }}
          >
            <path
              d="M5.65376 12.4563L5.65376 12.4563L5.65314 12.4619C5.60728 12.8991 5.73744 13.3352 6.01191 13.6746L6.01191 13.6746L6.01678 13.6806L11.0168 19.6806L11.0168 19.6806L11.0211 19.6858C11.3063 20.0266 11.7299 20.2234 12.1778 20.2234C12.6257 20.2234 13.0493 20.0266 13.3345 19.6858L13.3345 19.6858L13.3388 19.6806L18.3388 13.6806L18.3388 13.6806L18.3437 13.6746C18.6182 13.3352 18.7483 12.8991 18.7025 12.4619L18.7025 12.4619L18.7018 12.4563L17.7018 3.45626L17.7018 3.45626L17.7012 3.45066C17.6554 3.01346 17.4337 2.61273 17.0856 2.33449C16.7375 2.05625 16.2912 1.92352 15.8444 1.96513L15.8444 1.96513L15.8388 1.96574L6.83876 2.96574L6.83876 2.96574L6.83316 2.96639C6.39596 3.01225 5.99523 3.23395 5.71699 3.58205C5.43875 3.93015 5.30602 4.37647 5.34763 4.82326L5.34763 4.82326L5.34824 4.82886L5.65376 12.4563Z"
              fill="currentColor"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
          
          {/* Name Label */}
          <div
            className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap"
            style={{ backgroundColor: collaborator.color }}
          >
            {collaborator.name}
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
