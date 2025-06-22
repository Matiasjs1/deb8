import axios from 'axios'

const API = "http://localhost:4000"
export const registerRequest = (user) => axios.post("http://localhost:4000/api/register",user)
export const loginRequest = (user) => axios.post("http://localhost:4000/api/login",user)