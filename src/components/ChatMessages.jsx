import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/ApiService';
import { API_CONFIG } from '../config/api';
import webSocketService from '../services/WebSocketService';
import cloudinaryService from '../services/CloudinaryService';
import { FileText } from 'lucide-react';

const ChatMessages = ({ selectedConversation }) => {
  const messagesEndRef = useRef(null);
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [webSocketSubscription, setWebSocketSubscription] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // For image modal
  const chatContainerRef = useRef(null);

  // Use API configuration
  const MESSAGES_PER_PAGE = API_CONFIG.MESSAGES_PER_PAGE;

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId, pageNum = 0, append = false) => {
    if (!conversationId) return;
    
    setIsLoadingMore(true);
    try {
      const result = await ApiService.getMessages(conversationId, pageNum, MESSAGES_PER_PAGE);
      const newMessages = result.data || [];
      console.log(`📥 Fetched ${newMessages.length} messages for page ${pageNum}:`, newMessages);
      
      // Process messages to create attachment objects from MessageText URLs
      const processedMessages = newMessages.map(message => {
        let messageContent = message.messageText || message.MessageText || message.originalText || '';
        let attachment = null;
        let messageType = message.type || message.Type || 'TEXT';
        
        // Check if this is an attachment message
        if (messageType === 'IMAGE' || messageType === 'VIDEO' || messageType === 'AUDIO' || messageType === 'FILE') {
          // messageText contains the URL directly
          if (messageContent && messageContent.startsWith('http')) {
            // Create attachment object
            attachment = {
              url: messageContent,
              type: messageType,
              name: '', // No filename display
              format: messageType === 'IMAGE' ? 'jpg' : messageType === 'VIDEO' ? 'mp4' : 'file'
            };
            
            // For attachments, don't show any text content
            messageContent = '';
          }
        }
        
                  return {
            id: message.messageId || message.id,
            senderId: message.userId || message.senderId,
            originalText: messageContent,
            translatedText: message.messageTextTranslate || message.translatedText || null,
            timestamp: new Date(message.sentDatetime || message.timestamp || Date.now()),
            type: messageType,
            attachment: attachment,
            // Mark as pending translation if it's a text message without translation
            isTranslating: messageType === 'TEXT' && messageContent && !message.messageTextTranslate && !message.translatedText
          };
      });
      
      if (append) {
        const reversedNewMessages = processedMessages.reverse();
        const chatContainer = chatContainerRef.current;
        const currentScrollTop = chatContainer?.scrollTop || 0;
        const currentScrollHeight = chatContainer?.scrollHeight || 0;

        setMessages(prev => {
          const allMessages = [...reversedNewMessages, ...prev];
          return allMessages.sort((a, b) => a.timestamp - b.timestamp);
        });

        setTimeout(() => {
          if (chatContainer) {
            const newScrollHeight = chatContainer.scrollHeight;
            const heightDifference = newScrollHeight - currentScrollHeight;
            chatContainer.scrollTop = currentScrollTop + heightDifference;
          }
        }, 100);
      } else {
        const reversedNewMessages = processedMessages.reverse();
        setMessages(reversedNewMessages);
        // NO auto-scroll on initial load - let user scroll naturally
      }
      
      setHasMore(newMessages.length === MESSAGES_PER_PAGE);
      setPage(pageNum);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setError('Error fetching messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, []); // Remove token from dependencies since we get it inside the function

  // Load more messages (lazy loading)
  const loadMoreMessages = useCallback(() => {
    if (!isLoadingMore && hasMore && selectedConversation) {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      fetchMessages(conversationId, page + 1, true);
    }
  }, [page, hasMore, isLoadingMore, selectedConversation, fetchMessages]);

  // Handle scroll to load more messages (like HTML demo)
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current || isLoadingMore || !hasMore) return;

    const { scrollTop } = chatContainerRef.current;
    
    // When scroll reaches top, load more messages
    if (scrollTop === 0) {
      console.log('🔄 Scrolled to top, loading more messages...');
      loadMoreMessages();
    }
  }, [loadMoreMessages, isLoadingMore, hasMore]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((messageData) => {
    console.log('ChatMessages: Received WebSocket message:', messageData);
    
    // Check if this is a new message or an update to existing message
    const messageId = messageData.messageId || messageData.id;
    
    setMessages(prev => {
      // Check if message already exists
      const existingMessageIndex = prev.findIndex(msg => msg.id === messageId);
      
      if (existingMessageIndex !== -1) {
        // Update existing message (e.g., add translation)
        console.log('🔄 Updating existing message with translation:', messageData);
        const updatedMessages = [...prev];
        updatedMessages[existingMessageIndex] = {
          ...updatedMessages[existingMessageIndex],
          translatedText: messageData.messageTextTranslate || messageData.translatedText || null,
          // Update translating status
          isTranslating: false
        };
        return updatedMessages;
      } else {
        // Add new message
        console.log('➕ Adding new message:', messageData);
        
        // Parse message content for attachments
        let messageContent = messageData.messageText || messageData.MessageText || messageData.originalText || '';
        let attachment = null;
        let messageType = messageData.type || messageData.Type || 'TEXT';
        
        // Check if this is an attachment message
        if (messageType === 'IMAGE' || messageType === 'VIDEO' || messageType === 'AUDIO' || messageType === 'FILE') {
          // messageText contains the URL directly
          if (messageContent && messageContent.startsWith('http')) {
            // Create attachment object
            attachment = {
              url: messageContent,
              type: messageType,
              name: '', // No filename display
              format: messageType === 'IMAGE' ? 'jpg' : messageType === 'VIDEO' ? 'mp4' : 'file'
            };
            
            // For attachments, don't show any text content
            messageContent = '';
          }
        }
        
        const newMessage = {
          id: messageId,
          senderId: messageData.userId || messageData.senderId,
          originalText: messageContent,
          translatedText: messageData.messageTextTranslate || messageData.translatedText || null,
          timestamp: new Date(messageData.sentDatetime || messageData.timestamp || Date.now()),
          type: messageType,
          attachment: attachment,
          // Mark as pending translation if it's a text message without translation
          isTranslating: messageType === 'TEXT' && messageContent && !messageData.messageTextTranslate && !messageData.translatedText
        };
        
        // Add new message at the end (bottom)
        return [...prev, newMessage];
      }
    });
    
    // Auto-scroll to bottom ONLY for new messages from WebSocket
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      console.log('🔄 Conversation changed, fetching messages for:', conversationId);
      
      // Reset state
      setMessages([]);
      setPage(0);
      setHasMore(true);
      setError(null);
      
      // Fetch initial messages
      fetchMessages(conversationId, 0, false);
    }
  }, [selectedConversation, fetchMessages]);

  // Subscribe to WebSocket when conversation changes
  useEffect(() => {
    if (selectedConversation && webSocketService.connected) {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      console.log('🔌 Subscribing to WebSocket for conversation:', conversationId);
      
      // Subscribe to conversation topic
      const subscription = webSocketService.subscribeToConversation(conversationId, handleWebSocketMessage);
      setWebSocketSubscription(subscription);
      
      return () => {
        if (subscription) {
          console.log('🔌 Unsubscribing from WebSocket for conversation:', conversationId);
          subscription.unsubscribe();
        }
      };
    }
  }, [selectedConversation, webSocketService.connected, handleWebSocketMessage]);

  // Scroll to bottom after initial messages load (FIRST TIME ONLY)
  useEffect(() => {
    if (messages.length > 0 && !isLoading && page === 0) {
      // Wait for DOM to update, then scroll to bottom
      // This only happens on initial load, not when loading more messages
      console.log('🚀 Initial load complete, messages count:', messages.length, 'page:', page);
      setTimeout(() => {
        console.log('🚀 Initial load complete, scrolling to bottom...');
    scrollToBottom();
      }, 100);
    }
  }, [messages, isLoading, page]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      console.log('📱 Attempting to scroll to bottom...');
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      console.log('📱 Scrolled to bottom');
      
      // Also try to scroll the container to bottom as backup
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        console.log('📱 Container scrolled to bottom as backup');
      }
    } else {
      console.log('❌ messagesEndRef.current is null');
    }
  };

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('selectConversation')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('selectConversationToStart')}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">{t('loadingMessages')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-4">
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <button
            onClick={() => {
              const conversationId = selectedConversation.conversationId || selectedConversation.id;
              fetchMessages(conversationId, 0, false);
            }}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    // Nếu là hôm nay, chỉ hiển thị giờ
    if (diffInHours < 24 && date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Nếu là hôm qua
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hôm qua ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Nếu là trong tuần này
    if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Nếu là lâu hơn, hiển thị ngày tháng
    return date.toLocaleDateString([], { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderName = (senderId) => {
    // Try to get from conversation participants first
    if (selectedConversation.participants) {
      const participant = selectedConversation.participants.find(p => 
        p.userId === senderId || p.id === senderId
      );
      if (participant) {
        return participant.fullName || participant.name || participant.username || t('unknownUser');
      }
    }
    
    // Fallback to current user if it's their message
    if (senderId === currentUser?.id || senderId === currentUser?.userId) {
      return currentUser.fullName || currentUser.name || currentUser.username || t('you');
    }
    
    // Try to get from userProfiles if available
    if (selectedConversation.userProfiles) {
      const userProfile = selectedConversation.userProfiles.find(p => 
        p.userId === senderId
      );
      if (userProfile) {
        return userProfile.fullName || t('unknownUser');
      }
    }
    
    return t('unknownUser');
  };

  const getSenderAvatar = (senderId) => {
    // Try to get from conversation participants first
    if (selectedConversation.participants) {
      const participant = selectedConversation.participants.find(p => 
        p.userId === senderId || p.id === senderId
      );
      if (participant?.avatarUrl) {
        return participant.avatarUrl;
      }
    }
    
    // Fallback to current user if it's their message
    if (senderId === currentUser?.id || senderId === currentUser?.userId) {
      return currentUser.avatarUrl || currentUser.avatar || '/default-avatar.svg';
    }
    
    // Try to get from userProfiles if available
    if (selectedConversation.userProfiles) {
      const userProfile = selectedConversation.userProfiles.find(p => 
        p.userId === senderId
      );
      if (userProfile?.avatarUrl) {
        return userProfile.avatarUrl;
      }
    }
    
    return '/default-avatar.svg';
  };

  // Render attachment content based on type
  const renderAttachment = (attachment) => {
    if (!attachment) return null;

    switch (attachment.type) {
      case 'IMAGE':
        return (
          <div className="relative group">
            <img
              src={attachment.url}
              alt=""
              className="max-w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
              onClick={() => setSelectedImage(attachment.url)}
              onError={(e) => {
                e.target.src = '/default-image.svg';
              }}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
            {/* Hover overlay with zoom icon */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-80 rounded-full p-2">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>
        );
      
      case 'VIDEO':
        return (
          <div className="relative">
            <video
              controls
              className="max-w-full max-h-96 rounded-lg shadow-sm"
              poster={attachment.thumbnail}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block'
              }}
            >
              <source src={attachment.url} type={`video/${attachment.format}`} />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'AUDIO':
        return (
          <div className="w-full max-w-md">
            <audio 
              controls 
              className="w-full rounded-lg shadow-sm"
              style={{
                maxWidth: '100%',
                height: 'auto'
              }}
            >
              <source src={attachment.url} type={`audio/${attachment.format}`} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      
      case 'DOCUMENT':
      case 'FILE':
        return (
          <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FileText className="w-6 h-6 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {attachment.name || 'File'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {attachment.size ? cloudinaryService.formatFileSize(attachment.size) : 'Unknown size'}
                </p>
              </div>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-blue-500 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                {t('attachments.download') || 'Download'}
              </a>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4" 
      style={{ 
        direction: 'ltr',
        maxWidth: '100%',
        overflowX: 'hidden'
      }}
      onScroll={handleScroll}
    >
      {/* Loading more indicator - at the TOP for older messages */}
      {isLoadingMore && (
        <div className="text-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-xs text-gray-500 mt-1">{t('loadingMore')}</p>
        </div>
      )}

      {/* End of messages indicator - at the TOP */}
      {!hasMore && messages.length > 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-gray-400">{t('endOfMessages')}</p>
        </div>
      )}

      <div className="space-y-4" style={{ maxWidth: '100%' }}>
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUser?.id || 
                              message.senderId === currentUser?.userId ||
                              message.senderId === currentUser?.username;
          
          return (
            <div
              key={message.id || index}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              style={{ maxWidth: '100%' }}
            >
              <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`} style={{ maxWidth: '100%' }}>
                {/* Avatar */}
                {!isOwnMessage && (
                  <img
                    src={getSenderAvatar(message.senderId)}
                    alt={getSenderName(message.senderId)}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.target.src = '/default-avatar.svg';
                    }}
                  />
                )}

                {/* Message Content */}
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`} style={{ maxWidth: '100%' }}>
                  {/* Sender Name */}
                  {!isOwnMessage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {getSenderName(message.senderId)}
                    </span>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-lg max-w-full ${
                      isOwnMessage
                        ? message.attachment ? 'bg-transparent' : 'bg-blue-500 text-white px-4 py-2'
                        : message.attachment ? 'bg-transparent' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 px-4 py-2'
                    }`}
                    style={{ 
                      maxWidth: '100%',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Original Text - Only show for TEXT type messages */}
                    {message.type === 'TEXT' && message.originalText && (
                      <p className="text-sm break-words whitespace-pre-wrap overflow-hidden" style={{ wordBreak: 'break-word' }}>
                        {message.originalText}
                      </p>
                    )}
                    
                    {/* Attachment */}
                    {message.attachment && (
                      <div className="mt-2">
                        {renderAttachment(message.attachment)}
                      </div>
                    )}
                    
                    {/* Translation Section - Only show for text messages */}
                    {message.type === 'TEXT' && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-1 mb-1">
                          <Bot className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {t('translation') || 'Translation'}
                          </span>
                        </div>
                        
                        {/* Show "Đang dịch..." when translatedText is undefined/null */}
                        {!message.translatedText ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              {message.isTranslating ? (t('translating') || 'Translating...') : (t('noTranslation') || 'No translation')}
                            </p>
                          </div>
                        ) : (
                          /* Show actual translation when available */
                          <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded break-words">
                            {message.translatedText}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* This div is used as a scroll target for the bottom */}
      <div ref={messagesEndRef} style={{ height: '1px' }} />
      
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-[95vw] max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Image Preview</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/20"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Image */}
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={selectedImage}
                alt=""
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
            
            {/* Footer with zoom controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 z-10">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessages; 