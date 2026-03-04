import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

let socket = null

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
  }
  return socket
}

export const getSocket = () => socket

export const joinAuction = (propertyId) => {
  if (socket) {
    socket.emit('joinAuction', propertyId)
  }
}

export const leaveAuction = (propertyId) => {
  if (socket) {
    socket.emit('leaveAuction', propertyId)
  }
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
