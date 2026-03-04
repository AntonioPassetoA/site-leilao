import api from './api'

export const submitInterest = async (data) => {
  const response = await api.post('/leads', data)
  return response.data
}

// Admin functions
export const getLeads = async (params = {}) => {
  const response = await api.get('/leads', { params })
  return response.data
}

export const getLeadById = async (id) => {
  const response = await api.get(`/leads/${id}`)
  return response.data
}

export const updateLeadStatus = async (id, status) => {
  const response = await api.patch(`/leads/${id}/status`, { status })
  return response.data
}

export const deleteLead = async (id) => {
  const response = await api.delete(`/leads/${id}`)
  return response.data
}

export const getLeadStats = async () => {
  const response = await api.get('/leads/stats')
  return response.data
}
