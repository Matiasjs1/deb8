import app from './app.js'
import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT || 4000

// Create HTTP server and attach Socket.IO
import http from 'http'
import { setupSockets } from './socket.js'

const server = http.createServer(app)

// Initialize WebSocket layer
setupSockets(server)

server.listen(PORT, () => {
    console.log(`HTTP + WS server running on port ${PORT}`)
})
