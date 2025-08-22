import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Configuración base de axios
const debateAPI = axios.create({
  baseURL: `${API_URL}/debates`,
  withCredentials: true
});

// Obtener todos los debates
export const getDebates = async () => {
  try {
    const response = await debateAPI.get('/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener un debate específico
export const getDebate = async (id) => {
  try {
    const response = await debateAPI.get(`/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear un nuevo debate
export const createDebate = async (debateData) => {
  try {
    const response = await debateAPI.post('/', debateData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Unirse a un debate
export const joinDebate = async (id) => {
  try {
    const response = await debateAPI.patch(`/${id}/join`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Salir de un debate
export const leaveDebate = async (id) => {
  try {
    const response = await debateAPI.patch(`/${id}/leave`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar un debate
export const updateDebate = async (id, debateData) => {
  try {
    const response = await debateAPI.patch(`/${id}`, debateData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Eliminar un debate
export const deleteDebate = async (id) => {
  try {
    const response = await debateAPI.delete(`/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
