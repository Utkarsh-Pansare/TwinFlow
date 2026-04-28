import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useStore } from '../store/shipmentStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useSocket() {
  const { addAgentLog } = useStore()
  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'] })
    socket.on('connect', () => console.log('[Socket] Connected'))
    socket.on('twin:update', (data: unknown) => {
      console.log('[Socket] Twin update:', data)
    })
    socket.on('alert:new', (data: { message?: string }) => {
      addAgentLog({ time: new Date().toLocaleTimeString('en-IN'), agent: 'DisruptionAgent', level: 'danger', message: data.message ?? 'New alert received' })
    })
    return () => { socket.disconnect() }
  }, [addAgentLog])
}
