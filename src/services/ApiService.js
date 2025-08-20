import axios from 'axios';
import { API_CONFIG, buildApiUrl, getAuthHeaders, handleApiResponse, handleApiError } from '../config/api';

// Configure axios defaults
axios.defaults.timeout = API_CONFIG.REQUEST_TIMEOUT;

// Add request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

class ApiService {
  // Authentication methods
  static async login(username, password) {
    try {
      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH), {
        username,
        password
      });
      
      const result = handleApiResponse(response);
      
      if (result.data.authenticated && result.data.token) {
        localStorage.setItem('authToken', result.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${result.data.token}`;
      }
      
      return result;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async register(username, email, password, fullName) {
    try {
      const response = await axios.post(buildApiUrl(`${API_CONFIG.ENDPOINTS.AUTH}/register`), {
        username,
        email,
        password,
        fullName
      });
      
      const result = handleApiResponse(response);
      
      if (result.data.token) {
        localStorage.setItem('authToken', result.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${result.data.token}`;
      }
      
      return result;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getCurrentUser() {
    try {
      const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.USERS));
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update password
  static async updatePassword(password, newPassword) {
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_PASSWORD);
      const payload = { password, newPassword };
      const response = await axios.put(url, payload, { headers: getAuthHeaders() });
      const message = response?.data?.message || '';
      const success = /success/i.test(message);
      const data = response?.data?.result;
      return { success, message, data };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update user profile (fullName + locale)
  static async updateUser(fullName, locale) {
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_USER);
      const payload = { fullName, locale };
      const response = await axios.put(url, payload, { headers: getAuthHeaders() });
      const result = handleApiResponse(response);
      return result;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update avatar URL (send raw string body, text/plain)
  static async updateAvatar(avatarUrl) {
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_AVATAR);
      const response = await axios.put(url, avatarUrl, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'text/plain'
        }
      });
      const success = response?.data?.code === 200;
      const message = response?.data?.message || '';
      return { success, message };
    } catch (error) {
      throw handleApiError(error);
    }
  }
  // Chat methods
  static async getMessages(conversationId, page = 0, size = API_CONFIG.MESSAGES_PER_PAGE) {
    try {
      const response = await axios.get(buildApiUrl(`${API_CONFIG.ENDPOINTS.MESSAGES}/${conversationId}`, {
        page,
        size
      }));
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Create a direct (1-1) conversation
  static async createDirectConversation(toUserId) {
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.CONVERSATIONS);
      const response = await axios.post(url, { toUserId }, {
        headers: getAuthHeaders()
      });
      const result = handleApiResponse(response);
      return result;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Create a group conversation
  static async createGroupConversation(userIds, conversationName, locale) {
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.CREATE_GROUP);
      const payload = {
        userIds,
        conversationName,
        locale
      };
      const response = await axios.post(url, payload, {
        headers: getAuthHeaders()
      });
      const result = handleApiResponse(response);
      return result;
    } catch (error) {
      throw handleApiError(error);
    }
  }

    static async findUser(request) {
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.FIND_USER);
      const response = await axios.post(url, null, {
        params: { request },
        headers: getAuthHeaders()
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Group management methods
  static async updateConversationName(conversationId, name) {
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_CONVERSATION_NAME.replace('{conversationId}', conversationId));
      const response = await axios.put(url, name, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'text/plain'
        }
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateConversationLocale(conversationId, locale) {
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_CONVERSATION_LOCALE.replace('{conversationId}', conversationId));
      const response = await axios.put(url, locale, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'text/plain'
        }
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async addMemberToGroup(conversationId, userIds) {
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.ADD_MEMBER_TO_CONVERSATION.replace('{conversationId}', conversationId));
      const response = await axios.post(url, { userIds }, {
        headers: getAuthHeaders()
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getConversations(page = 0, size = API_CONFIG.DEFAULT_PAGE_SIZE) {
    try {
      const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.MESSAGE_LIST, {
        page,
        size
      }));
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async sendMessage(conversationId, messageText, messageType = 'TEXT') {
    try {
      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.MESSAGES), {
        conversationId,
        messageText,
        type: messageType
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // File upload methods
  static async uploadFile(file, onProgress) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.UPLOAD), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: API_CONFIG.UPLOAD_TIMEOUT,
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        } : undefined,
      });
      
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Utility methods
  static getAuthToken() {
    return localStorage.getItem('authToken');
  }

  static isAuthenticated() {
    return !!this.getAuthToken();
  }

  static logout() {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
  }

  static setAuthToken(token) {
    localStorage.setItem('authToken', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

export default ApiService;
