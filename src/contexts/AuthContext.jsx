import { createContext, useContext, useState } from 'react';
import webSocketService from '../services/WebSocketService';
import ApiService from '../services/ApiService';
import { API_CONFIG } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const result = await ApiService.login(username, password);
      
      try {
        const userResult = await ApiService.getCurrentUser();
        
        if (userResult.data) {
          const userData = userResult.data;
          const user = {
            id: userData.userId || userData.username,
            username: userData.username,
            email: userData.email,
            fullName: userData.fullName,
            locale: userData.locale,
            avatarUrl: userData.avatarUrl,
            role: userData.role,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
            googleId: userData.googleId
          };
          
          setCurrentUser(user);
          setIsAuthenticated(true);
          
          // Connect to WebSocket after successful login
          try {
            webSocketService.connect(result.data.token, 
              () => console.log('WebSocket connected after login'),
              (error) => console.error('WebSocket connection error:', error)
            );
          } catch (wsError) {
            console.warn('Failed to connect WebSocket:', wsError);
          }
          
          return { success: true, user };
        } else {
          const user = {
            id: username,
            username: username,
            email: '',
            fullName: username
          };
          setCurrentUser(user);
          setIsAuthenticated(true);
          return { success: true, user };
        }
      } catch (userError) {
        console.warn('Failed to get user details, using basic user object:', userError);
        const user = {
          id: username,
          username: username,
          email: '',
          fullName: username
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, email, password, fullName) => {
    setIsLoading(true);
    try {
      const result = await ApiService.register(username, email, password, fullName);
      
      const user = {
        id: username,
        username: username,
        email: email,
        fullName: fullName
      };
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      return { success: true, user };
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Disconnect WebSocket
    try {
      webSocketService.disconnect();
    } catch (wsError) {
      console.warn('Failed to disconnect WebSocket:', wsError);
    }
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    ApiService.logout();
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      console.log('Redirecting to Google OAuth2...');
      
      // Redirect to Google OAuth2 authorization URL
      window.location.href = `${API_CONFIG.BASE_URL}/identify/oauth2/authorization/google`;
      
      // Note: This function won't return immediately due to redirect
      // The actual authentication will happen after user returns from Google
    } catch (error) {
      console.error('Google OAuth2 error:', error);
      setIsLoading(false);
      throw new Error('Google login failed');
    }
  };

  const handleOAuth2Success = async (token) => {
    try {
      // Store token using ApiService
      ApiService.setAuthToken(token);
      
      // Get user details
      const userResult = await ApiService.getCurrentUser();
      
      if (userResult.data) {
        const userData = userResult.data;
        const user = {
          id: userData.userId || userData.username,
          username: userData.username,
          email: userData.email,
          fullName: userData.fullName,
          locale: userData.locale,
          avatarUrl: userData.avatarUrl,
          role: userData.role,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          googleId: userData.googleId
        };
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      } else {
        console.error('Invalid user response format:', userResult);
        throw new Error('Failed to get user details after OAuth2');
      }
    } catch (error) {
      console.error('OAuth2 success handling error:', error);
      throw error;
    }
  };



  // Helper function to get token from cookie
  const getTokenFromCookie = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        return value;
      }
    }
    return null;
  };

  // Helper function to get token from URL parameters
  const getTokenFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  };

    // Check if user is already authenticated on app start
  const checkAuthStatus = async () => {
    // First check localStorage, then cookie, then URL params
    let token = ApiService.getAuthToken();
    
    if (!token) {
      // If no token in localStorage, check cookie
      token = getTokenFromCookie();
      if (token) {
        // Store token using ApiService
        ApiService.setAuthToken(token);
        // Clear the cookie after reading it
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    }
    
    if (!token) {
      // If still no token, check URL parameters (for OAuth2 redirect)
      token = getTokenFromURL();
      if (token) {
        // Store token using ApiService
        ApiService.setAuthToken(token);
        // Clean up URL by removing token parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    
    if (token) {
      try {
        const userResult = await ApiService.getCurrentUser();
        
        if (userResult.data) {
          const userData = userResult.data;
          const user = {
            id: userData.userId || userData.username,
            username: userData.username,
            email: userData.email, 
            fullName: userData.fullName,
            locale: userData.locale,
            avatarUrl: userData.avatarUrl,
            role: userData.role,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
            googleId: userData.googleId
          };
          
          setCurrentUser(user);
          setIsAuthenticated(true);
          
          // Connect to WebSocket after restoring session
          try {
            webSocketService.connect(token, 
              () => console.log('✅ WebSocket connected after session restore'),
              (error) => console.error('❌ WebSocket connection error after session restore:', error)
            );
          } catch (wsError) {
            console.warn('⚠️ Failed to connect WebSocket after session restore:', wsError);
          }
        } else {
          logout();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        logout();
      }
    }
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuthStatus,
    loginWithGoogle,
    handleOAuth2Success
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 