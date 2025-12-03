import axios from 'axios';

// In production, use relative URL (same origin). In development, use localhost
const API_URL = process.env.REACT_APP_API_URL || 
    (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api');

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
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

// Handle responses and errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getCurrentUser: () => api.get('/auth/me'),
    requestPasswordReset: (email) => api.post('/auth/request-password-reset', { email }),
    resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
    searchUsers: (query) => api.get('/auth/search-users', { params: { query } })
};

// Pages API
export const pagesAPI = {
    getPages: () => api.get('/pages'),
    getPage: (id) => api.get(`/pages/${id}`),
    createPage: (data) => api.post('/pages', data),
    updatePage: (id, data) => api.put(`/pages/${id}`, data),
    deletePage: (id) => api.delete(`/pages/${id}`),
    updateDefaults: (id, data) => api.put(`/pages/${id}/defaults`, data),
    getGroups: () => api.get('/pages/groups/list'),
    createGroup: (data) => api.post('/pages/groups', data),
    inviteUser: (pageId, data) => api.post(`/pages/${pageId}/invite`, data),
    getPendingInvitations: () => api.get('/pages/invitations/pending'),
    respondToInvitation: (id, action) => api.post(`/pages/invitations/${id}/respond`, { action })
};

// Cards API
export const cardsAPI = {
    getCards: (pageId) => api.get(`/cards/page/${pageId}`),
    createCard: (pageId, data) => api.post(`/cards/page/${pageId}`, data),
    updateCard: (cardId, data) => api.put(`/cards/${cardId}`, data),
    deleteCard: (cardId) => api.delete(`/cards/${cardId}`),
    assignUser: (cardId, userId) => api.post(`/cards/${cardId}/assign`, { user_id: userId }),
    unassignUser: (cardId, userId) => api.delete(`/cards/${cardId}/assign/${userId}`),
    createLink: (pageId, data) => api.post(`/cards/page/${pageId}/links`, data),
    updateLink: (linkId, data) => api.put(`/cards/links/${linkId}`, data),
    deleteLink: (linkId) => api.delete(`/cards/links/${linkId}`)
};

// Upload API
export const uploadAPI = {
    uploadImage: (file) => {
        const formData = new FormData();
        formData.append('image', file);
        return api.post('/uploads', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    deleteImage: (filename) => api.delete(`/uploads/${filename}`)
};

export default api;
