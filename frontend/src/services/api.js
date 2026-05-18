import axios from 'axios'

const host = window.location.hostname
const port = window.location.port
// Si el frontend corre en el mismo puerto que el backend (producción), usar /api relativo
// Si corre en otro puerto (desarrollo con React dev server), apuntar a :5000
const isDev = port && port !== '5000' && port !== '80' && port !== '443'
const baseURL = isDev ? `http://${host}:5000/api` : '/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data)
}

export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getExpired: () => api.get('/clients/expired'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  remove: (id) => api.delete(`/clients/${id}`),
  registerPayment: (id, data) => api.post(`/clients/${id}/payment`, data)
}

export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  getMonthly: (month, year) => api.get(`/payments/monthly?month=${month}&year=${year}`),
  create: (data) => api.post('/payments', data)
}

export const classesAPI = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  enroll: (id, clientId) => api.post(`/classes/${id}/enroll`, { clientId }),
  unenroll: (id, clientId) => api.post(`/classes/${id}/unenroll`, { clientId })
}

export const attendanceAPI = {
  getAll: (date) => api.get(`/attendance?date=${date || ''}`),
  checkIn: (data) => api.post('/attendance/checkin', data),
  getByClient: (id) => api.get(`/attendance/client/${id}`)
}

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
}

export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  resolve: (id) => api.put(`/alerts/${id}/resolve`)
}

export const whatsappAPI = {
  getStatus: () => api.get('/whatsapp/status'),
  sendTest: (phone, message) => api.post('/whatsapp/test', { phone, message }),
  triggerCheck: () => api.post('/whatsapp/trigger-check'),
  restart: () => api.post('/whatsapp/restart'),
  logout: () => api.post('/whatsapp/logout'),
  connectPhone: (phoneNumber) => api.post('/whatsapp/connect-phone', { phoneNumber }),
  startQR: () => api.post('/whatsapp/start-qr')
}

export const portalAPI = {
  login: (name, lastName, code) => api.post('/portal/login', { name, lastName, code }),
  getProfile: () => api.get('/portal/profile'),
  getPayments: () => api.get('/portal/payments'),
  getAttendance: () => api.get('/portal/attendance'),
  getClasses: () => api.get('/portal/classes'),
  enroll: (classId) => api.post(`/portal/classes/${classId}/enroll`),
  unenroll: (classId) => api.post(`/portal/classes/${classId}/unenroll`)
}

export default api
