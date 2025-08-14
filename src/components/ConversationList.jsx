import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/ApiService';
import { API_CONFIG } from '../config/api';

const ConversationList = ({ selectedConversation, onSelectConversation, onNewConversation }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef();
  const lastConversationRef = useRef();

  // Use API configuration
  const PAGE_SIZE = API_CONFIG.DEFAULT_PAGE_SIZE;

  // Transform API message data to conversation format
  const transformMessageToConversation = (message) => {
    const userProfile = message.userProfiles?.[0];
    
    return {
      id: message.conversationId || `conv_${message.userId}`,
      type: 'direct', // Assuming all are direct messages for now
      name: null,
      participants: message.userProfiles || [],
      lastMessage: {
        senderId: message.userId,
        originalText: message.messageText || '',
        translatedText: message.messageTextTranslate || null,
        timestamp: new Date(message.sentDatetime || Date.now())
      },
      unreadCount: 0, // API doesn't provide this yet
      avatarUrl: userProfile?.avatarUrl || null,
      isGroup: false,
      // Additional fields from API
      userId: message.userId,
      conversationId: message.conversationId,
      sentDatetime: message.sentDatetime
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
      console.error('Error fetching conversations:', error);
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
    console.log('🔄 Updating conversation list with new message:', messageData);
    
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.conversationId === conversationId || conv.id === conversationId) {
          // Determine message text based on type
          let messageText = '';
          if (messageData.type === 'IMAGE' || messageData.type === 'VIDEO') {
            messageText = `[${messageData.type === 'IMAGE' ? 'Ảnh' : 'Video'}]`;
          } else {
            messageText = messageData.messageText || messageData.MessageText || '';
          }

          // Update last message
          const updatedConversation = {
            ...conv,
            lastMessage: {
              senderId: messageData.userId || messageData.senderId || 'currentUser',
              originalText: messageText,
              translatedText: messageData.messageTextTranslate || messageData.translatedText || null,
              timestamp: new Date(messageData.sentDatetime || messageData.timestamp || Date.now())
            }
          };

          console.log('✅ Updated conversation:', updatedConversation);
          return updatedConversation;
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
          updateWithNewMessage: updateConversationWithNewMessage
        };
        
        onSelectConversation(enhancedConversation);
      };
      
      // Replace the original function
      onSelectConversation = enhancedOnSelectConversation;
    }
  }, [onSelectConversation, updateConversationWithNewMessage]);

  // Add a method to manually update conversation (for testing)
  const manualUpdateConversation = useCallback((conversationId, messageData) => {
    updateConversationWithNewMessage(conversationId, messageData);
  }, [updateConversationWithNewMessage]);

  // Expose manual update method
  useEffect(() => {
    // Add to window for testing
    window.updateConversation = manualUpdateConversation;
  }, [manualUpdateConversation]);

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
    if (conversation.type === 'group' || conversation.isGroup) {
      return conversation.name || t('groupChat');
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
      return otherParticipant?.avatarUrl || '/default-avatar.svg';
    }
    
    return '/default-avatar.svg';
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
            <p className="text-sm">{t('noConversations')}</p>
            <button
              onClick={onNewConversation}
              className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {t('startConversation')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation, index) => {
              const hasUnread = conversation.unreadCount > 0;
              const isSelected = selectedConversation?.id === conversation.id;
              const isLastConversation = index === conversations.length - 1;
              
              return (
                <div
                  key={conversation.id}
                  ref={isLastConversation ? lastConversationElementRef : null}
                  onClick={() => onSelectConversation(conversation)}
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
                        onError={(e) => {
                          e.target.src = conversation.type === 'group' ? '/default-group-avatar.svg' : '/default-avatar.svg';
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm truncate ${
                            hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                          }`}>
                            {getConversationName(conversation)}
                          </h3>
                          
                          <div className="mt-1">
                            <p className={`text-sm truncate ${
                              hasUnread ? 'font-semibold text-gray-900' : 'text-gray-600'
                            }`}>
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
                                  hasUnread ? 'font-medium text-gray-700' : 'text-gray-500'
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
                            hasUnread ? 'text-blue-600 font-medium' : 'text-gray-500'
                          }`}>
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                          
                          {/* Unread count - positioned at top right */}
                          {hasUnread && (
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