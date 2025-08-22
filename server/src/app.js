import express from 'express'
import morgan from 'morgan'
import authRoutes from './routes/auth.routes.js'
import debateRoutes from './routes/debate.routes.js'
import cookieParser from 'cookie-parser'
import errorHandler from './middlewares/errorHandler.js'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
dotenv.config()

const app = express()

import connectdb from './config/db.js'
connectdb()

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/debates', debateRoutes)
app.use(errorHandler) //middleware para manejar errores
// Este middleware se ejecuta cuando no se encuentra la ruta, y se encarga de enviar un error 404 al cliente

export default app

