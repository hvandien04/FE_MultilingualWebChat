import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import AuthPage from './components/AuthPage.jsx';
import ChatPage from './components/ChatPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';

// Auth Initializer Component
const AuthInitializer = ({ children }) => {
  const { checkAuthStatus } = useAuth();
  
  const initializeAuth = useCallback(async () => {
    await checkAuthStatus();
  }, [checkAuthStatus]);
  
  useEffect(() => {
    // Only run once when component mounts
    initializeAuth();
  }, []); // Empty dependency array to run only once
  
  return children;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Public Route Component (redirects to chat if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/chat" replace />;
};

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AuthInitializer>
            <div className="App">
              <Routes>
                <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />

                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              </Routes>
            </div>
          </AuthInitializer>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App; 