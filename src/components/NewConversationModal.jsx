import { useState } from 'react';
import { X, UserPlus, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import AILanguageSelector from './AILanguageSelector';
import UserSearch from './UserSearch';
import { getAvatarUrl } from '../config/api';
import ApiService from '../services/ApiService';

const NewConversationModal = ({ isOpen, onClose, onCreateConversation }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [conversationType, setConversationType] = useState('direct'); // 'direct' or 'group'
  const [groupLanguage, setGroupLanguage] = useState('EN');
  const [groupName, setGroupName] = useState('');
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const handleUserSelect = (user) => {
    // Convert API user format to internal format
    const internalUser = {
      id: user.userId,
      name: user.fullName,
      email: user.email,
      avatar: user.avatarUrl,
      locale: user.locale
    };

    if (conversationType === 'direct') {
      // For direct conversation, select only one user
      setSelectedUsers([internalUser]);
    } else {
      // For group conversation, toggle user selection
      const isSelected = selectedUsers.find(u => u.id === internalUser.id);
      if (isSelected) {
        setSelectedUsers(selectedUsers.filter(u => u.id !== internalUser.id));
      } else {
        setSelectedUsers([...selectedUsers, internalUser]);
      }
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0 || isCreating) return;

    try {
      setIsCreating(true);

      if (conversationType === 'direct') {
        const toUser = selectedUsers[0];
        const apiResult = await ApiService.createDirectConversation(toUser.id);
        const conversationId = apiResult.data?.conversationId;
        if (!conversationId) throw new Error('No conversationId returned');

        const newConversation = {
          id: conversationId,
          conversationId,
          type: 'direct',
          participants: [
            {
              userId: toUser.id,
              fullName: toUser.name,
              email: toUser.email,
              avatarUrl: toUser.avatar,
              locale: toUser.locale
            }
          ]
        };

        onCreateConversation(newConversation);
      } else {
        // Group
        const selectedUserIds = selectedUsers.map(u => u.id);
        const selfUserId = currentUser?.userId || currentUser?.id;
        const allUserIds = Array.from(new Set([...(selectedUserIds || []), selfUserId].filter(Boolean)));
        const selectedLocale = (groupLanguage || 'EN').toUpperCase();
        const locale = selectedLocale;
        const name = groupName && groupName.trim().length > 0
          ? groupName.trim()
          : `${t('newGroup')} ${selectedUsers.map(u => u.name).join(', ')}`;

        const apiResult = await ApiService.createGroupConversation(allUserIds, name, locale);
        const conversationId = apiResult.data?.conversationId;
        if (!conversationId) throw new Error('No conversationId returned');

        const newConversation = {
          id: conversationId,
          conversationId,
          type: 'group',
          name,
          language: locale,
          participants: [
            // Include selected users
            ...selectedUsers.map(u => ({
              userId: u.id,
              fullName: u.name,
              email: u.email,
              avatarUrl: u.avatar,
              locale: u.locale
            })),
            // Include current user
            ...(selfUserId ? [{
              userId: selfUserId,
              fullName: currentUser?.fullName || currentUser?.name || 'Me',
              email: currentUser?.email || '',
              avatarUrl: currentUser?.avatarUrl || currentUser?.avatar || null,
              locale: currentUser?.locale || 'EN'
            }] : [])
          ]
        };

        onCreateConversation(newConversation);
      }

      onClose();
      setSelectedUsers([]);
      setGroupName('');
      setGroupLanguage('EN');
    } catch (error) {
       
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('newConversation')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Conversation Type Toggle */}
          <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setConversationType('direct')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                conversationType === 'direct'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('directMessage')}</span>
            </button>
            <button
              onClick={() => setConversationType('group')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                conversationType === 'group'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t('groupChat')}</span>
            </button>
          </div>

          {/* Group Settings */}
          {conversationType === 'group' && (
            <div className="mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900"
                />
              </div>
              <div>
                <label className=" block text-sm font-medium text-gray-700 mb-2">
                  Group Language
                </label>
                <AILanguageSelector
                  selectedLanguage={groupLanguage}
                  onLanguageChange={setGroupLanguage}
                />
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <UserSearch
              onUserSelect={handleUserSelect}
              placeholder="Search by User ID or Email..."
              className="w-full"
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {t('selectedUsers')} ({selectedUsers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <img
                      src={getAvatarUrl(user.avatar, 'user')}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = getAvatarUrl(null, 'user');
                      }}
                    />
                    <span>{user.name}</span>
                    <button
                      onClick={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="max-h-48 overflow-y-auto">
            {selectedUsers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Search and select users to start a conversation</p>
              </div>
            ) : (
              selectedUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
                >
                  <img
                    src={getAvatarUrl(user.avatar, 'user')}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = getAvatarUrl(null, 'user');
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {user.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      ID: {user.id}
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {user.locale}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0 || isCreating}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? 'Creating…' : t('create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal; 