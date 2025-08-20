import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/ApiService';
import { API_CONFIG, getAvatarUrl } from '../config/api';
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
      loadMoreMessages();
    }
  }, [loadMoreMessages, isLoadingMore, hasMore]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((messageData) => {
    
    // Check if this is a new message or an update to existing message
    const messageId = messageData.messageId || messageData.id;
    
    setMessages(prev => {
      // Check if message already exists
      const existingMessageIndex = prev.findIndex(msg => msg.id === messageId);
      
      if (existingMessageIndex !== -1) {
        // Update existing message (e.g., add translation)
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
      
      // Subscribe to conversation topic
      const subscription = webSocketService.subscribeToConversation(conversationId, handleWebSocketMessage);
      setWebSocketSubscription(subscription);
      
      return () => {
        if (subscription) {
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
      setTimeout(() => {
    scrollToBottom();
      }, 100);
    }
  }, [messages, isLoading, page]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      
      // Also try to scroll the container to bottom as backup
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    } else {
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

  // Function to format date separator (like Messenger)
  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Nếu là hôm nay
    if (date.toDateString() === now.toDateString()) {
      return 'Hôm nay';
    }
    
    // Nếu là hôm qua
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }
    
    // Nếu là trong tuần này
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffInDays < 7) {
      const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      return weekdays[date.getDay()];
    }
    
    // Nếu là lâu hơn, hiển thị ngày tháng đầy đủ
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Function to check if we need to show date separator
  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);
    
    return currentDate.toDateString() !== previousDate.toDateString();
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
        return getAvatarUrl(participant.avatarUrl, 'user');
      }
    }
    
    // Fallback to current user if it's their message
    if (senderId === currentUser?.id || senderId === currentUser?.userId) {
      return getAvatarUrl(currentUser.avatarUrl || currentUser.avatar, 'user');
    }
    
    // Try to get from userProfiles if available
    if (selectedConversation.userProfiles) {
      const userProfile = selectedConversation.userProfiles.find(p => 
        p.userId === senderId
      );
      if (userProfile?.avatarUrl) {
        return getAvatarUrl(userProfile.avatarUrl, 'user');
      }
    }
    
    return getAvatarUrl(null, 'user');
  };

  // Render attachment content based on type
  const renderAttachment = (attachment) => {
    if (!attachment) return null;
    
    switch (attachment.type) {
      case 'IMAGE':
        return (
          <div className="relative inline-block">
            <img
              src={attachment.url}
              alt="Image attachment"
              className="max-w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-200 dark:border-gray-600"
              onClick={() => setSelectedImage(attachment.url)}
              onError={(e) => {
                e.target.style.display = 'none';
                // Show fallback text
                const fallback = document.createElement('div');
                fallback.className = 'p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-center';
                fallback.innerHTML = `
                  <div class="text-gray-500 dark:text-gray-400 mb-2">
                    <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-300">Image failed to load</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to retry</p>
                `;
                fallback.onclick = () => {
                  e.target.style.display = 'block';
                  fallback.remove();
                  e.target.src = attachment.url;
                };
                e.target.parentNode.appendChild(fallback);
              }}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
            {/* Simple hover indicator */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full opacity-0 hover:opacity-100 transition-opacity">
              Click to view
            </div>
          </div>
        );
      
      case 'VIDEO':
        return (
          <div className="relative inline-block">
            <video
              controls
              className="max-w-full max-h-96 rounded-lg border border-gray-200 dark:border-gray-600"
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
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600"
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
            <div key={`message-${message.id || index}`}>
              {/* Date Separator - like Messenger */}
              {shouldShowDateSeparator(message, messages[index - 1]) && (
                <div className="flex justify-center my-6">
                  <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-3 py-1 rounded-full">
                    {formatDateSeparator(message.timestamp)}
                  </div>
                </div>
              )}
              
              <div
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                style={{ maxWidth: '100%' }}
              >
                <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`} style={{ maxWidth: '75%' }}>
                  {/* Avatar */}
                  {!isOwnMessage && (
                    <img
                      src={getSenderAvatar(message.senderId)}
                      alt={getSenderName(message.senderId)}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.src = getAvatarUrl(null, 'user');
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
                      className={`rounded-lg ${
                        isOwnMessage
                          ? message.attachment ? 'bg-transparent' : 'bg-blue-500 text-white px-4 py-2'
                          : message.attachment ? 'bg-transparent' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 px-4 py-2'
                      }`}
                      style={{ 
                        maxWidth: '100%',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                        overflow: 'hidden',
                        minWidth: '0' // Allow flex item to shrink below content size
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
            </div>
          );
        })}
      </div>
      
      {/* This div is used as a scroll target for the bottom */}
      <div ref={messagesEndRef} style={{ height: '1px' }} />
      
      {/* Image Modal - Messenger Style */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close button - top right */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-3 rounded-full hover:bg-white/20 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Image container - centered and responsive */}
          <div 
            className="flex items-center justify-center w-full h-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt=""
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{
                maxWidth: '95vw',
                maxHeight: '95vh',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                // Show error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'text-white text-center p-8';
                errorDiv.innerHTML = `
                  <div class="mb-4">
                    <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p class="text-lg font-medium mb-2">Failed to load image</p>
                  <p class="text-gray-400">The image could not be displayed</p>
                `;
                e.target.parentNode.appendChild(errorDiv);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessages; 