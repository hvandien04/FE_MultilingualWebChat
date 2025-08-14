import { UserPlus, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import UserProfileModal from './UserProfileModal';

const ConversationInfo = ({ selectedConversation, onUserProfileClick }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const getConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name;
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
      return conversation.avatarUrl || '/default-group-avatar.svg';
    }
    
    // For direct messages, get the other participant's avatar
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherParticipant?.avatarUrl) {
        return otherParticipant.avatarUrl;
      }
    }
    
    // Fallback to userProfiles if available
    if (conversation.userProfiles && conversation.userProfiles.length > 0) {
      const otherUser = conversation.userProfiles.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherUser?.avatarUrl) {
        return otherUser.avatarUrl;
      }
    }
    
    return '/default-avatar.svg';
  };

  const getLanguageName = (languageCode) => {
    const languageMap = {
      'en': t('english'),
      'vi': t('vietnamese'),
      'es': t('spanish'),
      'fr': 'Français',
      'de': 'Deutsch',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文'
    };
    return languageMap[languageCode] || languageCode;
  };

  const getParticipants = (conversation) => {
    if (conversation.type === 'group') {
      // For group chats, use participants array
      return conversation.participants || [];
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
            isOnline: true, // Assume online for now
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
            isOnline: true, // Assume online for now
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
              onError={(e) => {
                e.target.src = selectedConversation.type === 'group' ? '/default-group-avatar.svg' : '/default-avatar.svg';
              }}
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {getConversationName(selectedConversation)}
            </h2>
            <p className="text-sm text-green-600 font-medium">
              {selectedConversation.type === 'group' ? t('groupChat') : t('directMessage')}
            </p>
          </div>
        </div>

        {/* Group Language (for group chats) */}
        {selectedConversation.type === 'group' && selectedConversation.language && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Globe className="w-4 h-4 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Group Language
              </p>
              <p className="text-sm text-gray-600">
                {getLanguageName(selectedConversation.language)}
              </p>
            </div>
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
            {selectedConversation.type === 'group' && (
              <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
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
                    src={user.avatarUrl || '/default-avatar.svg'}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = '/default-avatar.svg';
                    }}
                  />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {user.fullName}
                    </h4>
                    <span className={`text-xs font-medium ${
                      user.isOnline ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {user.isOnline ? t('online') : t('offline')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getLanguageName(user.language)}
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