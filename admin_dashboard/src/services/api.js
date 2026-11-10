import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

// Attach JWT token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('attendance_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const studentService = {
  getStudentById: async (studentId) => {
    const response = await api.get(`/api/students/${encodeURIComponent(studentId)}`);
    return response.data;
  },
  getStudentsByClass: async () => {
    const response = await api.get('/api/students/by-class');
    return response.data;
  },
  getAllStudents: async (params = {}) => {
    const response = await api.get('/api/students', { params });
    return response.data;
  },
  createStudent: async (formData) => {
    const response = await api.post('/api/students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  updateStudent: async (id, formData) => {
    const response = await api.put(`/api/students/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  deleteStudent: async (id) => {
    const response = await api.delete(`/api/students/${id}`);
    return response.data;
  }
};

export const attendanceService = {
  submitAttendance: async (formData) => {
    const response = await api.post('/api/attendance', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  getTodayAttendance: async () => {
    const response = await api.get('/api/attendance/today');
    return response.data;
  },
  getStudentHistory: async (studentId) => {
    const response = await api.get(`/api/attendance/student/${encodeURIComponent(studentId)}`);
    return response.data;
  },
  getAllAttendance: async (params = {}) => {
    const response = await api.get('/api/attendance', { params });
    return response.data;
  },
  resetAttendance: async () => {
    const response = await api.delete('/api/attendance/reset');
    return response.data;
  },
  exportCSVUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE_URL}/api/attendance/export/csv${query ? `?${query}` : ''}`;
  }
};

export const classService = {
  getAllClasses: async () => {
    const response = await api.get('/api/classes');
    return response.data;
  },
  getClassAttendance: async (className, params = {}) => {
    const response = await api.get(`/api/classes/${encodeURIComponent(className)}/attendance`, { params });
    return response.data;
  },
  createClass: async (data) => {
    const response = await api.post('/api/classes', data);
    return response.data;
  },
  updateClass: async (id, data) => {
    const response = await api.put(`/api/classes/${id}`, data);
    return response.data;
  },
  deleteClass: async (id) => {
    const response = await api.delete(`/api/classes/${id}`);
    return response.data;
  }
};

export const adminService = {
  login: async (credentials) => {
    const response = await api.post('/api/admin/login', credentials);
    if (response.data.token) {
      localStorage.setItem('attendance_admin_token', response.data.token);
      localStorage.setItem('attendance_admin_user', JSON.stringify(response.data.admin));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('attendance_admin_token');
    localStorage.removeItem('attendance_admin_user');
  },
  getStats: async (params = {}) => {
    const response = await api.get('/api/admin/stats', { params });
    return response.data;
  },
  verify: async () => {
    const response = await api.get('/api/admin/verify');
    return response.data;
  }
};

export const healthService = {
  checkHealth: async () => {
    const response = await api.get('/api/health');
    return response.data;
  }
};

export const getFullPhotoUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;

