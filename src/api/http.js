import axios from 'axios'

const http = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor
http.interceptors.response.use(
  (res) => {
    // 如果业务返回 success=false，转为 reject 方便调用方 catch
    if (res.data && res.data.success === false) {
      return Promise.reject(new Error(res.data.error || '操作失败'))
    }
    return res.data
  },
  (err) => {
    if (err.response?.status === 401) {
      window.location.hash = '#/login'
    }
    return Promise.reject(err)
  }
)

export default http