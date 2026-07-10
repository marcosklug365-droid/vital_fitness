import api from './Api.js'

export const getClasesService = async () => {
    const response = await api.get('/clases')
    return response.data
}

export const getClaseByIdService = async (id) => {
    const response = await api.get(`/clases/${id}`)
    return response.data
}

export const createClaseService = async (datos) => {
    const response = await api.post('/clases', datos)
    return response.data
}

export const updateClaseService = async (id, datos) => {
    const response = await api.put(`/clases/${id}`, datos)
    return response.data
}

export const deleteClaseService = async (id) => {
    const response = await api.delete(`/clases/${id}`)
    return response.data
}

export const getInstructoresService = async () => {
    const response = await api.get('/clases/instructores')
    return response.data
}