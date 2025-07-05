import axios from 'axios'
import Cookies from 'js-cookie'

const API = "http://localhost:4000"

// Configurar axios para enviar cookies automáticamente
const axiosInstance = axios.create({
  baseURL: API,
  withCredentials: true, // Esto es crucial para enviar cookies
  headers: {
    'Content-Type': 'application/json',
  }
})

export const registerRequest = (user) => axiosInstance.post("/api/register", user)
export const loginRequest = (user) => axiosInstance.post("/api/login", user)
export const userRequest = () => axiosInstance.get("/api/profile")

// Funciones para manejar cookies del lado del cliente
export const setToken = (token) => {
  Cookies.set('token', token, { expires: 7 }) // Expira en 7 días
}

export const getToken = () => {
  return Cookies.get('token')
}

export const removeToken = () => {
  Cookies.remove('token')
}

// Función para verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return !!getToken()
}