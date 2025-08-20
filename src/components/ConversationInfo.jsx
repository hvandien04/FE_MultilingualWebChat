import { UserPlus, Globe, Edit2, Check, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import UserProfileModal from './UserProfileModal';

import AILanguageSelector from './AILanguageSelector';
import { getAvatarUrl } from '../config/api';
import ApiService from '../services/ApiService';

const ConversationInfo = ({ selectedConversation, onUserProfileClick, onAddMemberClick }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [groupLocale, setGroupLocale] = useState('EN');
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [updateStatus, setUpdateStatus] = useState({ type: '', message: '' });

  // Khởi tạo group locale và name từ conversation
  useEffect(() => {
    if (selectedConversation && (selectedConversation.type === 'group' || selectedConversation.isGroup)) {
      const locale = selectedConversation.groupLocale || 'EN';
      setGroupLocale(locale);
      
      const name = selectedConversation.name || selectedConversation.conversationName || '';
      setGroupName(name);
    }
  }, [selectedConversation]);

  // Update local state when selectedConversation changes (e.g., after name update)
  useEffect(() => {
    if (selectedConversation) {
      // Force re-render by updating local state
      setGroupName(selectedConversation.name || selectedConversation.conversationName || '');
      setGroupLocale(selectedConversation.groupLocale || 'EN');
    }
  }, [selectedConversation]);

  // Xử lý thay đổi group locale
  const handleGroupLocaleChange = async (newLocale) => {
    try {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      await ApiService.updateConversationLocale(conversationId, newLocale);
      setGroupLocale(newLocale);
      setUpdateStatus({ type: 'success', message: 'Group locale updated successfully!' });
      
      // Update conversation list
      if (window.updateConversationInfo) {
        window.updateConversationInfo(conversationId, {
          groupLocale: newLocale
        });
      }
      
      // Clear status after 3 seconds
      setTimeout(() => setUpdateStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      setUpdateStatus({ type: 'error', message: 'Failed to update group locale' });
      // Revert to previous value
      setGroupLocale(selectedConversation.groupLocale || 'EN');
      
      // Clear error after 3 seconds
      setTimeout(() => setUpdateStatus({ type: '', message: '' }), 3000);
    }
  };

  // Xử lý thay đổi group name
  const handleGroupNameChange = async () => {
    if (!groupName.trim()) return;
    
    try {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      await ApiService.updateConversationName(conversationId, groupName.trim());
      setUpdateStatus({ type: 'success', message: 'Group name updated successfully!' });
      setIsEditingName(false);
      
      // Update conversation list
      if (window.updateConversationInfo) {
        window.updateConversationInfo(conversationId, {
          name: groupName.trim(),
          conversationName: groupName.trim()
        });
      }
      
      // Update local selectedConversation to reflect the change immediately
      if (selectedConversation) {
        const updatedConversation = {
          ...selectedConversation,
          name: groupName.trim(),
          conversationName: groupName.trim()
        };
        // Force re-render by updating the parent component's state
        if (window.updateConversationInfo) {
          window.updateConversationInfo(conversationId, updatedConversation);
        }
      }
      
      // Clear status after 3 seconds
      setTimeout(() => setUpdateStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      setUpdateStatus({ type: 'error', message: 'Failed to update group name' });
      // Clear error after 3 seconds
      setTimeout(() => setUpdateStatus({ type: '', message: '' }), 3000);
    }
  };

  // Xử lý cancel edit name
  const handleCancelEditName = () => {
    setIsEditingName(false);
  };

  const getConversationName = (conversation) => {
    // For group chats, use conversationName or name
    if (conversation.type === 'group' || conversation.isGroup) {
      return conversation.conversationName || conversation.name || t('groupChat');
    }
    
    // For direct messages, get the other participant's name
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherParticipant) {
        return otherParticipant.fullName || otherParticipant.name || otherParticipant.username || t('unknownUser');
      }
    }
    
    // Fallback to userProfiles if available
    if (conversation.userProfiles && conversation.userProfiles.length > 0) {
      const otherUser = conversation.userProfiles.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherUser) {
        return otherUser.fullName || t('unknownUser');
      }
    }
    
    return t('unknownUser');
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group') {
      return getAvatarUrl(conversation.avatarUrl, 'group');
    }
    
    // For direct messages, get the other participant's avatar
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherParticipant?.avatarUrl) {
        return getAvatarUrl(otherParticipant.avatarUrl, 'user');
      }
    }
    
    // Fallback to userProfiles if available
    if (conversation.userProfiles && conversation.userProfiles.length > 0) {
      const otherUser = conversation.userProfiles.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherUser?.avatarUrl) {
        return getAvatarUrl(otherUser.avatarUrl, 'user');
      }
    }
    
    return getAvatarUrl(null, 'user');
  };

  const getLanguageName = (languageCode) => {
    const languageMap = {
      // Format cũ (lowercase)
      'en': t('english'),
      'vi': t('vietnamese'),
      'es': t('spanish'),
      'fr': 'Français',
      'de': 'Deutsch',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文',
      // Format mới (uppercase) từ AILanguageSelector
      'EN': 'English',
      'VI': 'Tiếng Việt',
      'ES': 'Español',
      'FR': 'Français',
      'DE': 'Deutsch',
      'JP': '日本語',
      'KR': '한국어',
      'CN': '中文'
    };
    return languageMap[languageCode] || languageCode;
  };

  const getParticipants = (conversation) => {
    if (conversation.type === 'group' || conversation.isGroup) {
      // For group chats, show all participants including current user
      const participants = conversation.participants || [];
      
      // Map participants to include "Tôi" for current user
      return participants.map(participant => ({
        userId: participant.userId,
        fullName: (participant.userId === currentUser?.id || participant.userId === currentUser?.userId) 
          ? t('you') || 'Tôi' 
          : participant.fullName || participant.name || participant.username,
        avatarUrl: participant.avatarUrl,
        locale: participant.locale,
        isCurrentUser: participant.userId === currentUser?.id || participant.userId === currentUser?.userId
      }));
    } else {
      // For direct messages, only show other participant (not current user)
      const participants = [];
      
              // Add other participant (not current user)
        if (conversation.participants && conversation.participants.length > 0) {
          const otherParticipant = conversation.participants.find(p => 
            p.userId !== currentUser?.id && p.userId !== currentUser?.userId
          );
          if (otherParticipant) {
            participants.push({
              userId: otherParticipant.userId,
              fullName: otherParticipant.fullName || otherParticipant.name || otherParticipant.username,
              avatarUrl: otherParticipant.avatarUrl,
              isOnline: true, // Luôn online
              isCurrentUser: false,
              language: otherParticipant.locale || 'en'
            });
          }
        } else if (conversation.userProfiles && conversation.userProfiles.length > 0) {
          const otherUser = conversation.userProfiles.find(p => 
            p.userId !== currentUser?.id && p.userId !== currentUser?.userId
          );
          if (otherUser) {
            participants.push({
              userId: otherUser.userId,
              fullName: otherUser.fullName,
              avatarUrl: otherUser.avatarUrl,
              isOnline: true, // Luôn online
              isCurrentUser: false,
              language: otherUser.locale || 'en'
            });
          }
        }
      
      return participants;
    }
  };

  if (!selectedConversation) {
    return (
      <div className="w-full h-full flex flex-col bg-white border-l border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('conversationInfo')}
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-center text-sm">
            {t('selectConversation')}
          </p>
        </div>
      </div>
    );
  }

  const participants = getParticipants(selectedConversation);

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <img
              src={getConversationAvatar(selectedConversation)}
              alt={getConversationName(selectedConversation)}
              className="w-12 h-12 rounded-full object-cover"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.src = (selectedConversation.type === 'group' || selectedConversation.isGroup) ? '/default-group-avatar.svg' : '/default-avatar.svg';
              }}
            />
            {/* Only show online status for direct messages */}
            {(selectedConversation.type !== 'group' && !selectedConversation.isGroup) && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {(selectedConversation.type === 'group' || selectedConversation.isGroup) && isEditingName ? (
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleGroupNameChange();
                      } else if (e.key === 'Escape') {
                        handleCancelEditName();
                      }
                    }}
                    className="w-full text-lg font-semibold text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter group name..."
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {getConversationName(selectedConversation)}
                </h2>
                {(selectedConversation.type === 'group' || selectedConversation.isGroup) && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <p className="text-sm text-green-600 font-medium">
              {(selectedConversation.type === 'group' || selectedConversation.isGroup) ? t('groupChat') : t('directMessage')}
            </p>
          </div>
        </div>

        {/* Group Language (for group chats) */}
        {(selectedConversation.type === 'group' || selectedConversation.isGroup) && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Globe className="w-4 h-4 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Group Locale
              </p>
              <p className="text-sm text-gray-600">
                {groupLocale || 'Not set'}
              </p>
            </div>
            <div className="w-32">
              <AILanguageSelector
                selectedLanguage={groupLocale}
                onLanguageChange={handleGroupLocaleChange}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
        {updateStatus.message && (
          <div className={`p-3 rounded-lg text-sm ${
            updateStatus.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {updateStatus.message}
          </div>
        )}
      </div>

      {/* Members */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              {t('members')} ({participants.length})
            </h3>
            {(selectedConversation.type === 'group' || selectedConversation.isGroup) && (
              <button 
                onClick={() => onAddMemberClick && onAddMemberClick()}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('addMembers')}</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {participants.map((user) => (
              <div
                key={user.userId}
                onClick={() => {
                  setSelectedUser(user);
                  setIsProfileModalOpen(true);
                }}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="relative">
                  <img
                    src={getAvatarUrl(user.avatarUrl, 'user')}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.src = getAvatarUrl(null, 'user');
                    }}
                  />
                  {/* Online status - luôn hiển thị xanh */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {user.fullName}
                    </h4>
                    <span className="text-xs font-medium text-green-600">
                      {t('online')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {user.locale || user.language || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedUser(null);
        }}
      />


    </div>
  );
};

export default ConversationInfo; 