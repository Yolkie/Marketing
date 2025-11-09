// Copy of frontend-api-config.js for easier imports
// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}\n\n${errorText}`);
      }
      
      // Show detailed error message
      const errorMessage = errorData.message || errorData.error || 'Login failed';
      throw new Error(errorMessage);
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

  // Fetch files from Google Drive (via backend to avoid CORS)
  async fetchDriveFiles(folderId, apiKey) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/drive/fetch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folderId, apiKey }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch files from Google Drive');
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


