import axios from 'axios'

const http = axios.create({
  baseURL: 'http://localhost:18081',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      window.location.hash = '#/login'
    }
    return Promise.reject(err)
  }
)

export default http
