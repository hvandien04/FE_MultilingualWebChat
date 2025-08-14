import { useState } from 'react';
import { Search, X, UserPlus, Users } from 'lucide-react';
import { mockUsers } from '../data/mockData';
import { useLanguage } from '../contexts/LanguageContext';
import AILanguageSelector from './AILanguageSelector';

const NewConversationModal = ({ isOpen, onClose, onCreateConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [conversationType, setConversationType] = useState('direct'); // 'direct' or 'group'
  const [groupLanguage, setGroupLanguage] = useState('en');
  const [groupName, setGroupName] = useState('');
  const { t } = useLanguage();

  const filteredUsers = mockUsers.filter(user => 
    user.id !== 1 && // Exclude current user
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (user) => {
    if (conversationType === 'direct') {
      // For direct conversation, select only one user
      setSelectedUsers([user]);
    } else {
      // For group conversation, toggle user selection
      const isSelected = selectedUsers.find(u => u.id === user.id);
      if (isSelected) {
        setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const handleCreateConversation = () => {
    if (selectedUsers.length === 0) return;

    const newConversation = {
      id: Date.now(), // Generate temporary ID
      type: conversationType,
      participants: [1, ...selectedUsers.map(u => u.id)], // Include current user (ID 1)
      name: conversationType === 'group' 
        ? (groupName || `${t('newGroup')} ${selectedUsers.map(u => u.name).join(', ')}`)
        : null,
      language: conversationType === 'group' ? groupLanguage : null,
      lastMessage: {
        originalText: t('conversationStarted'),
        timestamp: new Date().toISOString()
      },
      unreadCount: 0
    };

    onCreateConversation(newConversation);
    onClose();
    setSelectedUsers([]);
    setSearchTerm('');
    setGroupName('');
    setGroupLanguage('en');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('searchUsers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900"
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
                      src={user.avatar}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover"
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
            {filteredUsers.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                {t('noUsersFound')}
              </div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = selectedUsers.find(u => u.id === user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {user.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {user.language}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                );
              })
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
            disabled={selectedUsers.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal; 