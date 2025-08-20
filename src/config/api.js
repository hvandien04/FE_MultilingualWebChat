// API Configuration
export const API_CONFIG = {
  // BASE_URL: 'http://192.168.1.5:8000/api/v1',
  BASE_URL: 'http://localhost:8000/api/v1',

  ENDPOINTS: {
    // Authentication
    AUTH: '/identify/auth',
    USERS: '/identify/users',
    UPDATE_USER: '/identify/users',
    FIND_USER: '/identify/users/find-user',
    UPDATE_PASSWORD: '/identify/users/update-password',
    OAUTH2_GOOGLE: '/identify/oauth2/authorization/google',
    
    // Chat
    MESSAGES: '/chat/message',
    MESSAGE_LIST: '/chat/message/list',
    CONVERSATIONS: '/chat/conversation',
    CREATE_GROUP: '/chat/conversation/group',
    UPDATE_CONVERSATION_NAME: '/chat/{conversationId}/name',
    UPDATE_CONVERSATION_LOCALE: '/chat/{conversationId}/locale',
    ADD_MEMBER_TO_CONVERSATION: '/chat/{conversationId}/group/member',
    
    // File Upload
    UPLOAD: '/upload',
    UPDATE_AVATAR: '/identify/users/avatar',
  },
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MESSAGES_PER_PAGE: 20,
  
  // WebSocket
  WEBSOCKET_URL: 'ws://localhost:8000/ws',
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/*', 'video/*', 'audio/*'],
  
  // Avatar fallback configuration
  AVATAR: {
    FALLBACK_AVATAR: '/default-avatar.svg',
    FALLBACK_GROUP_AVATAR: '/default-group-avatar.svg',
    GOOGLE_AVATAR_FALLBACK: '/google-avatar-fallback.svg',
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    RETRY_ATTEMPTS: 3
  },
  
  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  UPLOAD_TIMEOUT: 60000, // 60 seconds
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint, params = {}) => {
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to handle API responses
export const handleApiResponse = (response) => {
  if (response.data.code === 200) {
    return { success: true, data: response.data.result };
  } else {
    throw new Error(response.data.message || 'API request failed');
  }
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    throw new Error(error.response.data.message || `Server error: ${error.response.status}`);
  } else if (error.request) {
    // Request was made but no response received
    throw new Error('No response from server. Please check if the server is running.');
  } else {
    // Something else happened
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

// Avatar helper functions to fix 429 Too Many Requests
export const getAvatarUrl = (avatarUrl, fallbackType = 'user') => {
  if (!avatarUrl) {
    return fallbackType === 'group' 
      ? API_CONFIG.AVATAR.FALLBACK_GROUP_AVATAR 
      : API_CONFIG.AVATAR.FALLBACK_AVATAR;
  }

  // Check if it's a Google avatar URL
  if (avatarUrl.includes('googleusercontent.com')) {
    // Try to get from cache first
    const cached = localStorage.getItem(`avatar_${avatarUrl}`);
    if (cached) {
      try {
        const { url, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < API_CONFIG.AVATAR.CACHE_DURATION) {
          return url;
        }
      } catch (e) {
        // Invalid cache, remove it
        localStorage.removeItem(`avatar_${avatarUrl}`);
      }
    }
    
    // Return Google avatar with fallback
    return avatarUrl;
  }

  return avatarUrl;
};

export const setAvatarFallback = (avatarUrl, fallbackUrl) => {
  if (avatarUrl && avatarUrl.includes('googleusercontent.com')) {
    localStorage.setItem(`avatar_${avatarUrl}`, JSON.stringify({
      url: fallbackUrl,
      timestamp: Date.now()
    }));
  }
};

export const clearAvatarCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('avatar_')) {
      localStorage.removeItem(key);
    }
  });
};
