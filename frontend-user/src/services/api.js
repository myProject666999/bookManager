import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const userApi = {
  login: (data) => api.post('/login', data),
  register: (data) => api.post('/register', data),
  getCurrentUser: () => api.get('/user/info'),
  updateUser: (data) => api.put('/user/info', data),
  changePassword: (data) => api.post('/user/password', data),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.post(`/admin/users/${id}/toggle-status`),
  getUser: (id) => api.get(`/admin/users/${id}`),
};

export const bookApi = {
  getHotBooks: (limit = 10) => api.get('/books/hot', { params: { limit } }),
  getRecommendBooks: (limit = 10) => api.get('/books/recommend', { params: { limit } }),
  getHotCategories: (limit = 10) => api.get('/categories/hot', { params: { limit } }),
  getAllCategories: () => api.get('/categories'),
  searchBooks: (params) => api.get('/books/search', { params }),
  getBookDetail: (id) => api.get(`/books/${id}`),
  getBookComments: (id, params) => api.get(`/books/${id}/comments`, { params }),
  
  getBooks: (params) => api.get('/admin/books', { params }),
  createBook: (data) => api.post('/admin/books', data),
  updateBook: (id, data) => api.put(`/admin/books/${id}`, data),
  deleteBook: (id) => api.delete(`/admin/books/${id}`),
  
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
};

export const borrowApi = {
  borrowBook: (bookId) => api.post('/borrow', { book_id: bookId }),
  renewBook: (id) => api.post(`/borrow/${id}/renew`),
  returnBook: (id) => api.post(`/borrow/${id}/return`),
  getMyBorrows: (params) => api.get('/borrow/my', { params }),
  
  getBorrows: (params) => api.get('/admin/borrows', { params }),
  adminReturnBook: (id) => api.post(`/admin/borrows/${id}/return`),
  auditBorrow: (id, data) => api.post(`/admin/borrows/${id}/audit`, data),
  updateOverdue: () => api.post('/admin/borrows/update-overdue'),
};

export const reserveApi = {
  reserveBook: (bookId) => api.post('/reserve', { book_id: bookId }),
  cancelReserve: (id) => api.post(`/reserve/${id}/cancel`),
  getMyReserves: (params) => api.get('/reserve/my', { params }),
  
  getReserves: (params) => api.get('/admin/reserves', { params }),
  adminCancelReserve: (id, data) => api.post(`/admin/reserves/${id}/cancel`, data),
  sendReserveNotify: (id) => api.post(`/admin/reserves/${id}/notify`),
};

export const commentApi = {
  addComment: (data) => api.post('/comment', data),
  getMyComments: (params) => api.get('/comment/my', { params }),
  likeComment: (id) => api.post(`/comment/${id}/like`),
  
  getComments: (params) => api.get('/admin/comments', { params }),
  deleteComment: (id) => api.delete(`/admin/comments/${id}`),
};

export const notificationApi = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const aiApi = {
  getSessions: () => api.get('/ai/sessions'),
  createSession: (data) => api.post('/ai/sessions', data),
  getSessionMessages: (sessionId) => api.get(`/ai/sessions/${sessionId}/messages`),
  deleteSession: (sessionId) => api.delete(`/ai/sessions/${sessionId}`),
  chat: (data) => api.post('/ai/chat', data),
};

export const statsApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getBorrowStats: (days = 30) => api.get('/admin/stats/borrow', { params: { days } }),
  getHotBooksRanking: (limit = 10) => api.get('/admin/stats/hot-books', { params: { limit } }),
  getUserBorrowRanking: (limit = 10) => api.get('/admin/stats/user-borrow', { params: { limit } }),
  getStockStats: () => api.get('/admin/stats/stock'),
  getOverdueStats: () => api.get('/admin/stats/overdue'),
  getCategoryStats: () => api.get('/admin/stats/category'),
};

export default api;
