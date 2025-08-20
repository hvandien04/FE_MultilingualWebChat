import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/ApiService';
import { API_CONFIG, getAvatarUrl } from '../config/api';

const ConversationList = ({ selectedConversation, onSelectConversation, onNewConversation }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [subscribedConversations, setSubscribedConversations] = useState(new Set());
  const observerRef = useRef();
  const lastConversationRef = useRef();

  // Use API configuration
  const PAGE_SIZE = API_CONFIG.DEFAULT_PAGE_SIZE;

  // Transform API message data to conversation format
  const transformMessageToConversation = (message) => {
    // Check if this is a group chat (has conversationName and multiple participants)
    const isGroup = message.conversationName && message.userProfiles && message.userProfiles.length > 1;
    
    // For group chat, use conversationName; for direct chat, use other participant's name
    let conversationName = null;
    let avatarUrl = null;
    
    if (isGroup) {
      conversationName = message.conversationName;
      // Use avatarGroupUrl if available, otherwise use default group avatar
      avatarUrl = getAvatarUrl(message.avatarGroupUrl, 'group');
    } else {
      // Direct message - find the other participant (not current user)
      const otherParticipant = message.userProfiles?.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      conversationName = otherParticipant?.fullName || otherParticipant?.username || 'Unknown User';
      avatarUrl = getAvatarUrl(otherParticipant?.avatarUrl, 'user');
    }
    
    return {
      id: message.conversationId || `conv_${message.userId}`,
      type: isGroup ? 'group' : 'direct',
      name: conversationName,
      participants: message.userProfiles || [],
      lastMessage: {
        senderId: message.userId,
        originalText: message.messageText || '',
        translatedText: message.messageTextTranslate || null,
        timestamp: new Date(message.sentDatetime || Date.now())
      },
      unreadCount: 0, // Will be managed by frontend
      avatarUrl: avatarUrl,
      isGroup: isGroup,
      // Additional fields from API
      userId: message.userId,
      conversationId: message.conversationId,
      sentDatetime: message.sentDatetime,
      conversationName: message.conversationName, // Store original name for group chats
      avatarGroupUrl: message.avatarGroupUrl, // Store group avatar URL
      groupLocale: message.groupLocale // Store group locale
    };
  };

  // Fetch conversations from API with pagination
  const fetchConversations = async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const result = await ApiService.getConversations(pageNum, PAGE_SIZE);
      
      // Handle empty result gracefully
      if (!result || !result.data || !Array.isArray(result.data)) {
        if (append) {
          // Keep existing conversations if appending
          setHasMore(false);
        } else {
          setConversations([]);
          setHasMore(false);
        }
        return;
      }
      
      const newConversations = result.data.map(transformMessageToConversation);
      
      if (append) {
        setConversations(prev => [...prev, ...newConversations]);
      } else {
        setConversations(newConversations);
      }
      
      // Check if there are more conversations
      setHasMore(newConversations.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (error) {
      setError(error.message || 'Failed to load conversations');
      
      if (!append) {
        // Only clear conversations if it's not an append operation
        setConversations([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load more conversations (lazy loading)
  const loadMoreConversations = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchConversations(page + 1, true);
    }
  }, [page, hasMore, isLoadingMore]);

  // Intersection Observer for infinite scroll
  const lastConversationElementRef = useCallback(node => {
    if (isLoadingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreConversations();
      }
    });
    
    if (node) observerRef.current.observe(node);
    lastConversationRef.current = node;
  }, [isLoadingMore, hasMore, loadMoreConversations]);

  // Fetch conversations on component mount
  useEffect(() => {
    if (currentUser) {
      fetchConversations(0, false);
    }
  }, [currentUser]);

  // Refresh conversations
  const handleRefresh = () => {
    setPage(0);
    setHasMore(true);
    fetchConversations(0, false);
  };

  // Update conversation with new message (called from parent component)
  const updateConversationWithNewMessage = useCallback((conversationId, messageData) => {
    setConversations(prev => {
      const updatedConversations = prev.map(conv => {
        if (conv.conversationId === conversationId || conv.id === conversationId) {
          // Determine message text based on type
          let messageText = '';
          if (messageData.type === 'IMAGE' || messageData.type === 'VIDEO') {
            messageText = `[${messageData.type === 'IMAGE' ? 'Ảnh' : 'Video'}]`;
          } else {
            messageText = messageData.messageText || messageData.MessageText || '';
          }

          // Update last message and mark as unread if not from current user
          const isFromCurrentUser = messageData.userId === currentUser?.id || 
                                   messageData.userId === currentUser?.userId ||
                                   messageData.senderId === currentUser?.id ||
                                   messageData.senderId === currentUser?.userId;
          
          // Chỉ set unread = true/false, không đếm số
          const hasUnreadMessages = isFromCurrentUser ? false : true;
          
          const updatedConversation = {
            ...conv,
            lastMessage: {
              senderId: messageData.userId || messageData.senderId || 'currentUser',
              originalText: messageText,
              translatedText: messageData.messageTextTranslate || messageData.translatedText || null,
              timestamp: new Date(messageData.sentDatetime || messageData.timestamp || Date.now())
            },
            // Chỉ set true/false, không đếm số
            hasUnread: hasUnreadMessages
          };

          return updatedConversation;
        }
        return conv;
      });
      
      return updatedConversations;
    });
  }, [currentUser]);

  // Update conversation info (name, locale, etc.)
  const updateConversationInfo = useCallback((conversationId, updates) => {
    setConversations(prev => {
      const updatedConversations = prev.map(conv => {
        if (conv.conversationId === conversationId || conv.id === conversationId) {
          return {
            ...conv,
            ...updates
          };
        }
        return conv;
      });
      return updatedConversations;
    });
  }, []);

  // Move conversation to top and mark as unread
  const moveConversationToTop = useCallback((conversationId) => {
    setConversations(prev => {
      const conversationIndex = prev.findIndex(conv => 
        conv.conversationId === conversationId || conv.id === conversationId
      );
      
      if (conversationIndex === -1) {
        return prev;
      }
      
      // Create a copy of the conversation to avoid mutation
      const conversation = { ...prev[conversationIndex] };
      
      // Mark as unread if not from current user
      if (conversation.lastMessage && 
          (conversation.lastMessage.senderId !== currentUser?.id && 
           conversation.lastMessage.senderId !== currentUser?.userId)) {
        const oldUnreadCount = conversation.unreadCount || 0;
        conversation.unreadCount = oldUnreadCount + 1;
      }
      
      // Create new array with conversation moved to top
      const newConversations = [
        conversation,
        ...prev.slice(0, conversationIndex),
        ...prev.slice(conversationIndex + 1)
      ];
      
      return newConversations;
    });
  }, [currentUser]);

  // Mark conversation as read (when user clicks on it)
  const markConversationAsRead = useCallback((conversationId) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.conversationId === conversationId || conv.id === conversationId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      });
    });
  }, []);

  // Expose the update function to parent component
  useEffect(() => {
    if (onSelectConversation) {
      // Create a wrapper function that includes the update capability
      const enhancedOnSelectConversation = (conversation) => {
        // Add update function to conversation object
        const enhancedConversation = {
          ...conversation,
          updateWithNewMessage: updateConversationWithNewMessage,
          updateConversationInfo: updateConversationInfo,
          moveToTop: moveConversationToTop
        };
        
        onSelectConversation(enhancedConversation);
      };
      
      // Store the enhanced function in a ref to avoid infinite loop
      window.enhancedOnSelectConversation = enhancedOnSelectConversation;
      
      // Also expose updateConversationInfo globally
      window.updateConversationInfo = updateConversationInfo;
    }
  }, [onSelectConversation, updateConversationWithNewMessage, updateConversationInfo, moveConversationToTop]);

  // Subscribe to recent conversations for notifications
  useEffect(() => {
    if (conversations.length > 0) {
      const recentConversations = conversations.slice(0, 20);
      
      // Subscribe to WebSocket if available
      if (window.webSocketService && window.webSocketService.connected) {
        recentConversations.forEach(conversation => {
          const conversationId = conversation.conversationId || conversation.id;
          if (conversationId && !subscribedConversations.has(conversationId)) {
            // Subscribe to conversation topic for notifications
            window.webSocketService.subscribeToConversation(conversationId, (message) => {
              // Update conversation and move to top
              updateConversationWithNewMessage(conversationId, message);
              moveConversationToTop(conversationId);
            });
            
            // Mark as subscribed
            setSubscribedConversations(prev => new Set([...prev, conversationId]));
          }
        });
      }
    }
  }, [conversations, updateConversationWithNewMessage, moveConversationToTop]);

  // Thêm useEffect để đợi WebSocket connect xong rồi subscribe (chỉ 1 lần)
  useEffect(() => {
    // Chỉ subscribe 1 lần khi WebSocket connect và có conversations
    if (window.webSocketService && window.webSocketService.connected && conversations.length > 0) {
      const recentConversations = conversations.slice(0, 20);
      recentConversations.forEach(conversation => {
        const conversationId = conversation.conversationId || conversation.id;
        if (conversationId && !subscribedConversations.has(conversationId)) {
          window.webSocketService.subscribeToConversation(conversationId, (message) => {
            // Update conversation and move to top
            updateConversationWithNewMessage(conversationId, message);
            moveConversationToTop(conversationId);
          });
          
          // Mark as subscribed
          setSubscribedConversations(prev => new Set([...prev, conversationId]));
        }
      });
    }
  }, [conversations, updateConversationWithNewMessage, moveConversationToTop, subscribedConversations]);



  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffInHours < 48) {
      return t('yesterday');
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getConversationName = (conversation) => {
    // For group chats, use the conversation name
    if (conversation.type === 'group' || conversation.isGroup) {
      return conversation.conversationName || conversation.name || t('groupChat');
    }
    
    // For direct messages, show the other person's name
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      return otherParticipant?.fullName || otherParticipant?.username || t('unknownUser');
    }
    
    return t('unknownUser');
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group' || conversation.isGroup) {
      return conversation.avatarUrl || '/default-group-avatar.svg';
    }
    
    // For direct messages, show the other person's avatar
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      return getAvatarUrl(otherParticipant?.avatarUrl, 'user');
    }
    
    return getAvatarUrl(null, 'user');
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {t('directMessage')}
          </h2>
          <button
            onClick={onNewConversation}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title={t('newConversation')}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">{t('loadingConversations')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {t('directMessage')}
          </h2>
          <button
            onClick={onNewConversation}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title={t('newConversation')}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {t('directMessage')}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title={t('refresh')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={onNewConversation}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title={t('newConversation')}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-2">{t('noConversations') || 'No conversations yet'}</p>
            <p className="text-xs text-gray-400 mb-4">Start a new conversation to begin messaging</p>
            <button
              onClick={onNewConversation}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t('startConversation') || 'Start Conversation'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation, index) => {
              const hasUnread = conversation.unreadCount > 0;
              // Simple selection check - just compare the main ID
              const isSelected = selectedConversation && selectedConversation.id === conversation.id;
              const isLastConversation = index === conversations.length - 1;
              
              return (
                <div
                  key={conversation.id}
                  ref={isLastConversation ? lastConversationElementRef : null}
                  onClick={() => {
                    
                    // Mark as read when clicked
                    if (conversation.unreadCount > 0) {
                      markConversationAsRead(conversation.id);
                    }
                    
                    // Use the enhanced function if available, otherwise use the original
                    if (window.enhancedOnSelectConversation) {
                      window.enhancedOnSelectConversation(conversation);
                    } else {
                      onSelectConversation(conversation);
                    }
                  }}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={getConversationAvatar(conversation)}
                        alt={getConversationName(conversation)}
                        className="w-12 h-12 rounded-full object-cover"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.target.src = getAvatarUrl(null, conversation.type === 'group' ? 'group' : 'user');
                        }}
                      />
                      {/* Online status - only show for direct messages */}
                      {conversation.type !== 'group' && !conversation.isGroup && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm truncate ${
                            conversation.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                          }`}>
                            {getConversationName(conversation)}
                            {/* Show group indicator for group chats */}
                            {conversation.type === 'group' || conversation.isGroup ? (
                              <span className="ml-1 text-xs text-blue-600 font-medium">(Group)</span>
                            ) : null}
                          </h3>
                          
                          <div className="mt-1">
                            <p className={`text-sm truncate ${
                              conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                            }`}>
                              {/* Show sender name for group chats */}
                              {(conversation.type === 'group' || conversation.isGroup) && conversation.lastMessage.senderId ? (
                                <span className="text-xs text-gray-500 mr-1">
                                  {(() => {
                                    // Tìm người gửi trong participants
                                    const sender = conversation.participants?.find(p => 
                                      p.userId === conversation.lastMessage.senderId ||
                                      p.id === conversation.lastMessage.senderId
                                    );
                                    
                                    if (sender) {
                                      return (sender.fullName || sender.name || 'Unknown') + ': ';
                                    }
                                    
                                    // Nếu không tìm thấy trong participants, kiểm tra xem có phải current user không
                                    if (conversation.lastMessage.senderId === currentUser?.id || 
                                        conversation.lastMessage.senderId === currentUser?.userId) {
                                      return 'Tôi: ';
                                    }
                                    
                                    // Nếu vẫn không tìm thấy, hiển thị ID
                                    return `User ${conversation.lastMessage.senderId}: `;
                                  })()}
                                </span>
                              ) : null}
                              {conversation.lastMessage.originalText || t('noMessages')}
                            </p>
                            
                            {/* Translation */}
                            {conversation.lastMessage.translatedText && (
                              <div className="mt-1">
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-gray-400">{t('translation')}</span>
                                  <span className="text-xs">🤖</span>
                                </div>
                                <p className={`text-xs truncate ${
                                  conversation.unreadCount > 0 ? 'font-medium text-gray-700' : 'text-gray-500'
                                }`}>
                                  {conversation.lastMessage.translatedText}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Time and unread count */}
                        <div className="flex flex-col items-end space-y-1 ml-2">
                          <span className={`text-xs flex-shrink-0 ${
                            conversation.unreadCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'
                          }`}>
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                          
                          {/* Unread count - positioned at top right */}
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-blue-500 text-white rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="px-4 py-3 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-xs text-gray-500 mt-2">{t('loadingMore')}</p>
              </div>
            )}
            
            {/* End of conversations indicator */}
            {!hasMore && conversations.length > 0 && (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-gray-400">{t('endOfConversations')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList; 