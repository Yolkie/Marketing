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
  // Settings are loaded from database automatically
  async fetchDriveFiles() {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/drive/fetch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // No body needed - backend loads settings from database
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch files from Google Drive');
    }
    return response.json();
  },

  async syncContent(contentItems) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/content/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contentItems }),
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

  async recaption(contentItemId) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/content/${contentItemId}/recaption`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to trigger re-caption');
    }
    return response.json();
  },

  // Settings (Admin only)
  async getSettings() {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/settings`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch settings');
    }
    return response.json();
  },

  async updateSettings(settings) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update settings');
    }
    return response.json();
  },

  // User Management (Admin only)
  async getUsers() {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }
    return response.json();
  },

  async createUser(userData) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  },

  async updateUser(userId, userData) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
    return response.json();
  },

  async deleteUser(userId) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
    return response.json();
  },

  // Facebook Metrics
  async getFacebookMetrics(contentItemId) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/facebook/metrics/${contentItemId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Facebook metrics');
    }
    return response.json();
  },

  async getAllFacebookMetrics() {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/facebook/metrics`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Facebook metrics');
    }
    return response.json();
  },

  async syncFacebookMetrics(contentItemId, postId) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/facebook/sync/${contentItemId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to sync Facebook metrics');
    }
    return response.json();
  },

  async testFacebookConnection() {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/facebook/test-connection`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to test Facebook connection');
    }
    return response.json();
  },
};


