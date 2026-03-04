import api from './api'

export const getProperties = async (params = {}) => {
  const response = await api.get('/properties', { params })
  return response.data
}

export const getPropertyById = async (id) => {
  const response = await api.get(`/properties/${id}`)
  return response.data
}

export const getFeaturedProperties = async () => {
  const response = await api.get('/properties/featured')
  return response.data
}

export const getEndingSoon = async () => {
  const response = await api.get('/properties/ending-soon')
  return response.data
}

export const getStates = async () => {
  const response = await api.get('/properties/states')
  return response.data
}

export const getCities = async (state) => {
  const response = await api.get('/properties/cities', { params: { state } })
  return response.data
}

export const placeBid = async (propertyId, amount) => {
  const response = await api.post('/bids', { propertyId, amount })
  return response.data
}

export const getBidsByProperty = async (propertyId, params = {}) => {
  const response = await api.get(`/bids/property/${propertyId}`, { params })
  return response.data
}

export const getUserBids = async (params = {}) => {
  const response = await api.get('/bids/my-bids', { params })
  return response.data
}

export const addFavorite = async (propertyId) => {
  const response = await api.post('/favorites', { propertyId })
  return response.data
}

export const removeFavorite = async (propertyId) => {
  const response = await api.delete(`/favorites/${propertyId}`)
  return response.data
}

export const getUserFavorites = async (params = {}) => {
  const response = await api.get('/favorites', { params })
  return response.data
}

export const checkFavorite = async (propertyId) => {
  const response = await api.get(`/favorites/check/${propertyId}`)
  return response.data
}
