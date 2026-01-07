/**
 * Collaboration State Slice
 * Manages real-time collaboration state including cursors, presence, and comments
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Types
interface Cursor {
  x: number
  y: number
  timestamp: number
}

interface Collaborator {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  color: string
  cursor: Cursor | null
  selectedElementId: string | null
  isActive: boolean
  lastSeen: string
}

interface Comment {
  id: string
  elementId: string | null
  pageId: string
  userId: string
  userName: string
  userAvatar: string | null
  content: string
  resolved: boolean
  replies: CommentReply[]
  createdAt: string
  updatedAt: string
}

interface CommentReply {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  content: string
  createdAt: string
}

interface CollaborationState {
  // Connection
  isConnected: boolean
  connectionId: string | null
  roomId: string | null
  
  // Collaborators
  collaborators: Record<string, Collaborator>
  
  // Comments
  comments: Comment[]
  activeCommentId: string | null
  isAddingComment: boolean
  commentPosition: { x: number; y: number } | null
  
  // Activity
  recentActivity: Array<{
    id: string
    type: 'join' | 'leave' | 'edit' | 'comment' | 'publish'
    userId: string
    userName: string
    message: string
    timestamp: string
  }>
  
  // Typing indicators
  typingUsers: Record<string, string> // elementId -> userId
  
  // Locks
  lockedElements: Record<string, string> // elementId -> userId
}

// Predefined colors for collaborators
const COLLABORATOR_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
]

const initialState: CollaborationState = {
  isConnected: false,
  connectionId: null,
  roomId: null,
  
  collaborators: {},
  
  comments: [],
  activeCommentId: null,
  isAddingComment: false,
  commentPosition: null,
  
  recentActivity: [],
  
  typingUsers: {},
  lockedElements: {}
}

// Helper to get a consistent color for a user
const getCollaboratorColor = (userId: string): string => {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return COLLABORATOR_COLORS[hash % COLLABORATOR_COLORS.length]
}

// Slice
const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    // Connection
    setConnected: (state, action: PayloadAction<{ connectionId: string; roomId: string }>) => {
      state.isConnected = true
      state.connectionId = action.payload.connectionId
      state.roomId = action.payload.roomId
    },
    
    setDisconnected: (state) => {
      state.isConnected = false
      state.connectionId = null
      state.roomId = null
      state.collaborators = {}
    },
    
    // Collaborators
    addCollaborator: (state, action: PayloadAction<{
      id: string
      name: string
      email: string
      avatarUrl: string | null
    }>) => {
      const { id, name, email, avatarUrl } = action.payload
      
      state.collaborators[id] = {
        id,
        name,
        email,
        avatarUrl,
        color: getCollaboratorColor(id),
        cursor: null,
        selectedElementId: null,
        isActive: true,
        lastSeen: new Date().toISOString()
      }
      
      // Add activity
      state.recentActivity.unshift({
        id: `activity-${Date.now()}`,
        type: 'join',
        userId: id,
        userName: name,
        message: `${name} joined`,
        timestamp: new Date().toISOString()
      })
      
      // Limit activity history
      if (state.recentActivity.length > 50) {
        state.recentActivity.pop()
      }
    },
    
    removeCollaborator: (state, action: PayloadAction<string>) => {
      const collaborator = state.collaborators[action.payload]
      
      if (collaborator) {
        // Add activity
        state.recentActivity.unshift({
          id: `activity-${Date.now()}`,
          type: 'leave',
          userId: collaborator.id,
          userName: collaborator.name,
          message: `${collaborator.name} left`,
          timestamp: new Date().toISOString()
        })
        
        delete state.collaborators[action.payload]
        
        // Remove any locks held by this user
        Object.keys(state.lockedElements).forEach(elementId => {
          if (state.lockedElements[elementId] === action.payload) {
            delete state.lockedElements[elementId]
          }
        })
        
        // Remove typing indicator
        Object.keys(state.typingUsers).forEach(elementId => {
          if (state.typingUsers[elementId] === action.payload) {
            delete state.typingUsers[elementId]
          }
        })
      }
    },
    
    updateCollaboratorCursor: (state, action: PayloadAction<{
      userId: string
      cursor: Cursor
    }>) => {
      const collaborator = state.collaborators[action.payload.userId]
      if (collaborator) {
        collaborator.cursor = action.payload.cursor
        collaborator.lastSeen = new Date().toISOString()
        collaborator.isActive = true
      }
    },
    
    updateCollaboratorSelection: (state, action: PayloadAction<{
      userId: string
      elementId: string | null
    }>) => {
      const collaborator = state.collaborators[action.payload.userId]
      if (collaborator) {
        collaborator.selectedElementId = action.payload.elementId
        collaborator.lastSeen = new Date().toISOString()
      }
    },
    
    setCollaboratorInactive: (state, action: PayloadAction<string>) => {
      const collaborator = state.collaborators[action.payload]
      if (collaborator) {
        collaborator.isActive = false
        collaborator.cursor = null
      }
    },
    
    // Comments
    setComments: (state, action: PayloadAction<Comment[]>) => {
      state.comments = action.payload
    },
    
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.push(action.payload)
      state.isAddingComment = false
      state.commentPosition = null
      
      // Add activity
      state.recentActivity.unshift({
        id: `activity-${Date.now()}`,
        type: 'comment',
        userId: action.payload.userId,
        userName: action.payload.userName,
        message: `${action.payload.userName} added a comment`,
        timestamp: new Date().toISOString()
      })
    },
    
    updateComment: (state, action: PayloadAction<{ id: string; updates: Partial<Comment> }>) => {
      const comment = state.comments.find(c => c.id === action.payload.id)
      if (comment) {
        Object.assign(comment, action.payload.updates)
      }
    },
    
    deleteComment: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter(c => c.id !== action.payload)
      if (state.activeCommentId === action.payload) {
        state.activeCommentId = null
      }
    },
    
    resolveComment: (state, action: PayloadAction<string>) => {
      const comment = state.comments.find(c => c.id === action.payload)
      if (comment) {
        comment.resolved = true
      }
    },
    
    addCommentReply: (state, action: PayloadAction<{ commentId: string; reply: CommentReply }>) => {
      const comment = state.comments.find(c => c.id === action.payload.commentId)
      if (comment) {
        comment.replies.push(action.payload.reply)
      }
    },
    
    setActiveComment: (state, action: PayloadAction<string | null>) => {
      state.activeCommentId = action.payload
    },
    
    startAddingComment: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.isAddingComment = true
      state.commentPosition = action.payload
    },
    
    cancelAddingComment: (state) => {
      state.isAddingComment = false
      state.commentPosition = null
    },
    
    // Typing indicators
    setTyping: (state, action: PayloadAction<{ elementId: string; userId: string }>) => {
      state.typingUsers[action.payload.elementId] = action.payload.userId
    },
    
    clearTyping: (state, action: PayloadAction<string>) => {
      delete state.typingUsers[action.payload]
    },
    
    // Element locks
    lockElement: (state, action: PayloadAction<{ elementId: string; userId: string }>) => {
      state.lockedElements[action.payload.elementId] = action.payload.userId
    },
    
    unlockElement: (state, action: PayloadAction<string>) => {
      delete state.lockedElements[action.payload]
    },
    
    // Activity
    addActivity: (state, action: PayloadAction<{
      type: 'join' | 'leave' | 'edit' | 'comment' | 'publish'
      userId: string
      userName: string
      message: string
    }>) => {
      state.recentActivity.unshift({
        id: `activity-${Date.now()}`,
        ...action.payload,
        timestamp: new Date().toISOString()
      })
      
      if (state.recentActivity.length > 50) {
        state.recentActivity.pop()
      }
    },
    
    clearActivity: (state) => {
      state.recentActivity = []
    },
    
    // Reset
    resetCollaboration: () => initialState
  }
})

export const {
  setConnected,
  setDisconnected,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorCursor,
  updateCollaboratorSelection,
  setCollaboratorInactive,
  setComments,
  addComment,
  updateComment,
  deleteComment,
  resolveComment,
  addCommentReply,
  setActiveComment,
  startAddingComment,
  cancelAddingComment,
  setTyping,
  clearTyping,
  lockElement,
  unlockElement,
  addActivity,
  clearActivity,
  resetCollaboration
} = collaborationSlice.actions

export default collaborationSlice.reducer

// Selectors
export const selectIsConnected = (state: { collaboration: CollaborationState }) => 
  state.collaboration.isConnected

export const selectCollaborators = (state: { collaboration: CollaborationState }) => 
  Object.values(state.collaboration.collaborators)

export const selectActiveCollaborators = (state: { collaboration: CollaborationState }) => 
  Object.values(state.collaboration.collaborators).filter(c => c.isActive)

export const selectComments = (state: { collaboration: CollaborationState }) => 
  state.collaboration.comments

export const selectUnresolvedComments = (state: { collaboration: CollaborationState }) => 
  state.collaboration.comments.filter(c => !c.resolved)

export const selectCommentsForElement = (elementId: string) => 
  (state: { collaboration: CollaborationState }) => 
    state.collaboration.comments.filter(c => c.elementId === elementId)

export const selectRecentActivity = (state: { collaboration: CollaborationState }) => 
  state.collaboration.recentActivity

export const selectLockedElements = (state: { collaboration: CollaborationState }) => 
  state.collaboration.lockedElements

export const selectIsElementLocked = (elementId: string, currentUserId: string) => 
  (state: { collaboration: CollaborationState }) => {
    const lockOwner = state.collaboration.lockedElements[elementId]
    return lockOwner && lockOwner !== currentUserId
  }