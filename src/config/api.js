// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api/v1',
  ENDPOINTS: {
    // Authentication
    AUTH: '/identify/auth',
    USERS: '/identify/users',
    OAUTH2_GOOGLE: '/identify/oauth2/authorization/google',
    
    // Chat
    MESSAGES: '/chat/message',
    MESSAGE_LIST: '/chat/message/list',
    CONVERSATIONS: '/chat/conversations',
    
    // File Upload
    UPLOAD: '/upload',
  },
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MESSAGES_PER_PAGE: 20,
  
  // WebSocket
  WEBSOCKET_URL: 'ws://localhost:8000/ws',
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/*', 'video/*', 'audio/*'],
  
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
