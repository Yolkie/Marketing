// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// API helper functions
export const api = {
  // Authentication
  async register(email, password, name) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    return response.json();
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  async getCurrentUser() {
    const token = getAuthToken();
    if (!token) return null;
    
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return response.json();
  },

  // Content
  async getContent(status, fileType) {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (fileType) params.append('fileType', fileType);
    
    const response = await fetch(`${API_BASE_URL}/content?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch content');
    }
    return response.json();
  },

  async getContentItem(id) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/content/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch content item');
    }
    return response.json();
  },

  async syncContent(folderId, apiKey, contentItems) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/content/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folderId, apiKey, contentItems }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync content');
    }
    return response.json();
  },

  // Captions
  async createCaptions(contentItemId, captions) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/content/${contentItemId}/captions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ captions }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create captions');
    }
    return response.json();
  },

  async updateCaption(captionId, content) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/captions/${captionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update caption');
    }
    return response.json();
  },

  async approveCaption(captionId) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/captions/${captionId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve caption');
    }
    return response.json();
  },
};



