'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  setConnected,
  setDisconnected,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorCursor,
  updateCollaboratorSelection,
  selectIsConnected,
  selectActiveCollaborators
} from '@/store/slices/collaborationSlice'
import { selectUser } from '@/store/slices/authSlice'

interface WSMessage {
  type: string
  payload: any
  room?: string
  sender_id?: string
  timestamp?: string
}

interface WebSocketContextValue {
  isConnected: boolean
  connectionId: string | null
  collaborators: any[]
  
  // Actions
  connect: (roomId: string) => void
  disconnect: () => void
  sendMessage: (message: Omit<WSMessage, 'sender_id' | 'timestamp'>) => void
  sendCursorPosition: (position: { x: number; y: number }) => void
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)
  const isConnected = useAppSelector(selectIsConnected)
  const collaborators = useAppSelector(selectActiveCollaborators)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  
  // Reconnection settings
  const maxReconnectAttempts = 5
  const reconnectDelay = 1000
  const reconnectAttemptsRef = useRef(0)
  
  // Connect to WebSocket server
  const connect = useCallback((roomId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Already connected, just join the room
      joinRoom(roomId)
      return
    }
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      console.warn('No auth token, cannot connect to WebSocket')
      return
    }
    
    try {
      wsRef.current = new WebSocket(`${wsUrl}/ws?token=${token}`)
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        reconnectAttemptsRef.current = 0
        
        // Join the room after connection
        if (roomId) {
          joinRoom(roomId)
        }
        
        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping', payload: {} }))
          }
        }, 30000)
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        dispatch(setDisconnected())
        setConnectionId(null)
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }
        
        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`)
            connect(currentRoom || roomId)
          }, delay)
        }
      }
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [dispatch, currentRoom])
  
  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected')
      wsRef.current = null
    }
    
    dispatch(setDisconnected())
    setConnectionId(null)
    setCurrentRoom(null)
  }, [dispatch])
  
  // Send message
  const sendMessage = useCallback((message: Omit<WSMessage, 'sender_id' | 'timestamp'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const fullMessage: WSMessage = {
        ...message,
        sender_id: user?.id,
        timestamp: new Date().toISOString()
      }
      wsRef.current.send(JSON.stringify(fullMessage))
    }
  }, [user?.id])
  
  // Send cursor position (throttled)
  const cursorThrottleRef = useRef<NodeJS.Timeout | null>(null)
  const sendCursorPosition = useCallback((position: { x: number; y: number }) => {
    if (cursorThrottleRef.current) return
    
    cursorThrottleRef.current = setTimeout(() => {
      sendMessage({
        type: 'cursor.moved',
        payload: position,
        room: currentRoom || undefined
      })
      cursorThrottleRef.current = null
    }, 50) // Throttle to 20fps
  }, [sendMessage, currentRoom])
  
  // Join room
  const joinRoom = useCallback((roomId: string) => {
    sendMessage({
      type: 'room.join',
      payload: { room_id: roomId }
    })
    setCurrentRoom(roomId)
  }, [sendMessage])
  
  // Leave room
  const leaveRoom = useCallback((roomId: string) => {
    sendMessage({
      type: 'room.leave',
      payload: { room_id: roomId }
    })
    if (currentRoom === roomId) {
      setCurrentRoom(null)
    }
  }, [sendMessage, currentRoom])
  
  // Handle incoming messages
  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'connect':
        setConnectionId(message.payload.connection_id)
        dispatch(setConnected({
          connectionId: message.payload.connection_id,
          roomId: currentRoom || ''
        }))
        break
        
      case 'pong':
        // Heartbeat response
        break
        
      case 'user.joined':
        dispatch(addCollaborator({
          id: message.payload.user_id,
          name: message.payload.name || 'Anonymous',
          email: message.payload.email || '',
          avatarUrl: message.payload.avatar_url
        }))
        break
        
      case 'user.left':
        dispatch(removeCollaborator(message.payload.user_id))
        break
        
      case 'cursor.moved':
        if (message.sender_id && message.sender_id !== user?.id) {
          dispatch(updateCollaboratorCursor({
            userId: message.sender_id,
            cursor: {
              x: message.payload.x,
              y: message.payload.y,
              timestamp: Date.now()
            }
          }))
        }
        break
        
      case 'element.selected':
        if (message.sender_id && message.sender_id !== user?.id) {
          dispatch(updateCollaboratorSelection({
            userId: message.sender_id,
            elementId: message.payload.id
          }))
        }
        break
        
      case 'element.added':
      case 'element.updated':
      case 'element.deleted':
      case 'element.moved':
      case 'element.resized':
        // These are handled by the editor context
        // Dispatch to a custom event for the editor to handle
        window.dispatchEvent(new CustomEvent('ws:editor', { detail: message }))
        break
        
      case 'notification':
        // Handle notifications
        window.dispatchEvent(new CustomEvent('ws:notification', { detail: message.payload }))
        break
        
      case 'error':
        console.error('WebSocket error:', message.payload)
        break
        
      default:
        console.log('Unknown message type:', message.type)
    }
  }, [dispatch, user?.id, currentRoom])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])
  
  const value: WebSocketContextValue = {
    isConnected,
    connectionId,
    collaborators,
    connect,
    disconnect,
    sendMessage,
    sendCursorPosition,
    joinRoom,
    leaveRoom
  }
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}