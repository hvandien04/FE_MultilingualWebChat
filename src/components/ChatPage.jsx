  import { useState, Suspense, lazy, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import webSocketService from '../services/WebSocketService';

  // Lazy load components
  const ConversationList = lazy(() => import('./ConversationList'));
  const ChatMessages = lazy(() => import('./ChatMessages'));
  const MessageInput = lazy(() => import('./MessageInput'));
  const ConversationInfo = lazy(() => import('./ConversationInfo'));
  const LanguageSelector = lazy(() => import('./LanguageSelector'));
  const NewConversationModal = lazy(() => import('./NewConversationModal'));
  const UserProfileModal = lazy(() => import('./UserProfileModal'));

  const ChatPage = () => {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);
    const [showUserProfileModal, setShowUserProfileModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();



    const handleSendMessage = (messageText, attachments = []) => {
      if (!selectedConversation) {
        console.warn('No conversation selected');
        return;
      }

      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      console.log('📤 Sending message to conversation:', conversationId, messageText, attachments);

      // Send message via WebSocket
      try {
        if (attachments && attachments.length > 0) {
          // Send each attachment as a separate message
          attachments.forEach(attachment => {
            const messageType = attachment.cloudinaryData?.type || 'FILE';
            
            // Send only the required fields to WebSocket
            const success = webSocketService.sendMessage(
              conversationId,
              attachment.cloudinaryData?.url || '', // messageText = URL
              messageType
            );
            
            if (success) {
              console.log(`✅ ${messageType} message sent via WebSocket`);
              
              // Update conversation list with new message
              if (selectedConversation.updateWithNewMessage) {
                console.log('🔄 Updating conversation list with attachment message');
                selectedConversation.updateWithNewMessage(conversationId, {
                  type: messageType,
                  messageText: attachment.cloudinaryData?.url || '',
                  userId: currentUser?.id || currentUser?.userId,
                  timestamp: Date.now(),
                  // Attachments don't need translation
                  isTranslating: false
                });
              } else {
                console.warn('⚠️ updateWithNewMessage function not found');
                // Try to use window method as fallback
                if (window.updateConversation) {
                  window.updateConversation(conversationId, {
                    type: messageType,
                    messageText: attachment.cloudinaryData?.url || '',
                    userId: currentUser?.id || currentUser?.userId,
                    timestamp: Date.now(),
                    // Attachments don't need translation
                    isTranslating: false
                  });
                }
              }
            } else {
              console.error(`❌ Failed to send ${messageType} message via WebSocket`);
            }
          });
        } else {
          // Send text message
          const success = webSocketService.sendMessage(
            conversationId,
            messageText, // messageText = user input text
            'TEXT'
          );
          
          if (success) {
            console.log('✅ Text message sent via WebSocket');
            
                          // Update conversation list with new message
              if (selectedConversation.updateWithNewMessage) {
                console.log('🔄 Updating conversation list with text message');
                selectedConversation.updateWithNewMessage(conversationId, {
                  type: 'TEXT',
                  messageText: messageText,
                  userId: currentUser?.id || currentUser?.userId,
                  timestamp: Date.now(),
                  // Mark as pending translation for new text messages
                  isTranslating: true
                });
              } else {
                console.warn('⚠️ updateWithNewMessage function not found');
                // Try to use window method as fallback
                if (window.updateConversation) {
                  window.updateConversation(conversationId, {
                    type: 'TEXT',
                    messageText: messageText,
                    userId: currentUser?.id || currentUser?.userId,
                    timestamp: Date.now(),
                    // Mark as pending translation for new text messages
                    isTranslating: true
                  });
                }
              }
          } else {
            console.error('❌ Failed to send text message via WebSocket');
          }
        }
      } catch (error) {
        console.error('❌ Error sending message:', error);
      }
    };

    const handleSelectConversation = (conversation) => {
      console.log('ChatPage: Selected conversation:', conversation);
      setSelectedConversation(conversation);
      // On mobile, hide sidebar when conversation is selected
      setShowSidebar(false);
    };

    const handleNewConversation = (newConversation) => {
      // In a real app, you would create the conversation in the backend
      console.log('Creating new conversation:', newConversation);
      setSelectedConversation(newConversation);
      // On mobile, hide sidebar when conversation is selected
      setShowSidebar(false);
    };

    const handleUserProfileClick = (user) => {
      setSelectedUser(user);
      setShowUserProfileModal(true);
    };

    const toggleSidebar = () => {
      setShowSidebar(!showSidebar);
    };

    const toggleInfoPanel = () => {
      setShowInfoPanel(!showInfoPanel);
    };

    return (
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* User info */}
             <div className="flex items-center space-x-3">
                <div className="relative">
                  {currentUser ? (
                    <img
                      src={
                        (currentUser.avatarUrl ?? currentUser.avatar ?? '').trim() 
                          || '/default-avatar.svg'
                      }
                      alt={currentUser.fullName || currentUser.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover bg-gray-200"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {currentUser?.fullName || currentUser?.name || currentUser?.username || 'User'}
                  </p>
                  <p className="text-xs text-green-600 font-medium">{t('online')}</p>
                </div>
              </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center space-x-2">
            <Suspense fallback={<div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse"></div>}>
              <LanguageSelector />
            </Suspense>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              title={t('settings')}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar - Conversations with slide animation */}
          <div className={`lg:flex lg:w-80 xl:w-96 flex-shrink-0 absolute lg:relative inset-0 z-30 bg-white lg:bg-transparent transform transition-transform duration-300 ease-in-out ${
            showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}>
            <Suspense fallback={<div className="w-full h-full bg-gray-200 animate-pulse"></div>}>
              <ConversationList
                selectedConversation={selectedConversation}
                onSelectConversation={handleSelectConversation}
                onNewConversation={() => setShowNewConversationModal(true)}
              />
            </Suspense>
          </div>

          {/* Middle Panel - Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            {selectedConversation ? (
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={selectedConversation.avatarUrl || '/default-avatar.svg'}
                      alt={selectedConversation.type === 'group' ? selectedConversation.name : 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/default-avatar.svg';
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {selectedConversation.type === 'group' 
                        ? selectedConversation.name 
                        : (selectedConversation.participants?.[0]?.fullName || 'Direct Message')
                      }
                    </h2>
                    <p className="text-xs text-green-600 font-medium">{t('online')}</p>
                  </div>
                </div>
                
                {/* Mobile info panel toggle */}
                <button
                  onClick={toggleInfoPanel}
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="bg-white border-b border-gray-200 px-4 py-6 flex items-center justify-center">
                <p className="text-gray-500 text-sm">{t('selectConversationToStart')}</p>
              </div>
            )}

            {/* Messages */}
            <Suspense fallback={<div className="flex-1 bg-gray-200 animate-pulse"></div>}>
              <ChatMessages selectedConversation={selectedConversation} />
            </Suspense>

            {/* Message Input */}
            <Suspense fallback={<div className="h-16 bg-gray-200 animate-pulse"></div>}>
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!selectedConversation}
              />
            </Suspense>
          </div>

          {/* Right Sidebar - Conversation Info with slide animation */}
          <div className={`lg:flex lg:w-80 flex-shrink-0 absolute lg:relative inset-0 z-30 bg-white lg:bg-transparent transform transition-transform duration-300 ease-in-out ${
            showInfoPanel ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}>
            <Suspense fallback={<div className="w-full h-full bg-gray-200 animate-pulse"></div>}>
              <ConversationInfo 
                selectedConversation={selectedConversation}
                onUserProfileClick={handleUserProfileClick}
              />
            </Suspense>
          </div>
        </div>

        {/* Mobile overlay for sidebar */}
        {showSidebar && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-20 transition-opacity duration-300"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Mobile overlay for info panel */}
        {showInfoPanel && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-20 transition-opacity duration-300"
            onClick={() => setShowInfoPanel(false)}
          />
        )}

        {/* Modals */}
        <Suspense fallback={null}>
          <NewConversationModal
            isOpen={showNewConversationModal}
            onClose={() => setShowNewConversationModal(false)}
            onCreateConversation={handleNewConversation}
          />

          <UserProfileModal
            isOpen={showUserProfileModal}
            onClose={() => setShowUserProfileModal(false)}
            user={selectedUser}
          />
        </Suspense>
      </div>
    );
  };

  export default ChatPage; 