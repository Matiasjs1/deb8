import express from 'express'
import morgan from 'morgan'
import authRoutes from './routes/auth.routes.js'
import debateRoutes from './routes/debate.routes.js'
import cookieParser from 'cookie-parser'
import errorHandler from './middlewares/errorHandler.js'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
dotenv.config()

const app = express()

import connectdb from './config/db.js'
connectdb()

const isProd = process.env.NODE_ENV === 'production'
if (!isProd) {
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }))
}

// Configuración de seguridad mejorada con Helmet
// Compresión gzip/brotli
app.use(compression())

app.use(helmet({
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  } : false, // Deshabilitar CSP en desarrollo
  hsts: isProd ? {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  } : false, // Deshabilitar HSTS en desarrollo
  frameguard: {
    action: 'deny'
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/debates', debateRoutes)
app.use(errorHandler) //middleware para manejar errores
// Este middleware se ejecuta cuando no se encuentra la ruta, y se encarga de enviar un error 404 al cliente

import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
if (isProd) {
  const clientDist = path.resolve(__dirname, '../../client/dist')
  // Servir archivos estáticos con caché optimizado
  app.use(express.static(clientDist, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        // No cachear HTML para obtener actualizaciones
        res.setHeader('Cache-Control', 'no-cache')
      }
    }
  }))
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}
export default app

