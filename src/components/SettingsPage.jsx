import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, LogOut, Save, X, Bell, Shield, Palette, Globe, User, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AILanguageSelector from './AILanguageSelector';

const SettingsPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    language: 'en',
    aiLanguage: 'en',
    notifications: {
      messages: true,
      mentions: true,
      groupUpdates: false
    },
    privacy: {
      showOnlineStatus: true,
      showLastSeen: true,
      allowGroupInvites: true
    }
  });
  
  const { currentUser, logout } = useAuth();
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSave = () => {
    // In a real app, you would save the changes to the backend
    console.log('Saving settings:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: currentUser?.fullName || currentUser?.name || '',
      username: currentUser?.username || '',
      language: currentLanguage,
      aiLanguage: 'en',
      notifications: {
        messages: true,
        mentions: true,
        groupUpdates: false
      },
      privacy: {
        showOnlineStatus: true,
        showLastSeen: true,
        allowGroupInvites: true
      }
    });
    setIsEditing(false);
  };

  const handleLanguageChange = (language) => {
    setFormData({ ...formData, language });
    changeLanguage(language);
  };

  const handleNotificationChange = (key) => {
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications,
        [key]: !formData.notifications[key]
      }
    });
  };

  const handlePrivacyChange = (key) => {
    setFormData({
      ...formData,
      privacy: {
        ...formData.privacy,
        [key]: !formData.privacy[key]
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {t('settings')}
            </h1>
          </div>
          
          {isEditing && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancel}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm">{t('save')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
              {t('profile')}
            </h2>
            </div>
            {!isEditing && (
              <button
                onClick={() => {
                  setFormData({
                    ...formData,
                    name: currentUser?.fullName || currentUser?.name || '',
                    username: currentUser?.username || '',
                    language: currentLanguage
                  });
                  setIsEditing(true);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {t('edit')}
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={currentUser?.avatarUrl || currentUser?.avatar || '/default-avatar.svg'}
                  alt={currentUser?.fullName || currentUser?.name || 'User'}
                  className="w-20 h-20 rounded-full object-cover bg-gray-200"
                  onError={(e) => {
                    e.target.src = '/default-avatar.svg';
                  }}
                />
                <button className="absolute bottom-0 right-0 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                     {t('fullName')}
                   </label>
                  <input
                    type="text"
                    value={isEditing ? formData.name : (currentUser?.fullName || currentUser?.name || '')}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                   {t('email')}
                 </label>
                <input
                  type="email"
                  value={currentUser?.email || 'Not provided'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                   {t('userID')}
                 </label>
                <input
                  type="text"
                  value={currentUser?.id || 'N/A'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                   {t('role')}
                 </label>
                <input
                  type="text"
                  value={currentUser?.role || 'N/A'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                   {t('locale')}
                 </label>
                <input
                  type="text"
                  value={currentUser?.locale || 'N/A'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
            
            {/* Account Creation Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                   {t('createdAt')}
                 </label>
                <input
                  type="text"
                  value={currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              
              <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                   {t('lastUpdated')}
                 </label>
                <input
                  type="text"
                  value={currentUser?.updatedAt ? new Date(currentUser.updatedAt).toLocaleDateString() : 'N/A'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Language & AI Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t('languageAndAI')}
            </h2>
          </div>

          <div className="space-y-6">
            {/* UI Language */}
            <div>
                             <label className="block text-sm font-medium text-gray-700 mb-3">
                 {t('interfaceLanguage')}
               </label>
              <div className="space-y-2">
                {[
                  { code: 'en', name: 'English' },
                  { code: 'vi', name: 'Tiếng Việt' },
                  { code: 'es', name: 'Español' }
                ].map((language) => (
                  <label key={language.code} className="flex items-center">
                    <input
                      type="radio"
                      name="language"
                      value={language.code}
                      checked={currentLanguage === language.code}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      {language.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* AI Translation Language */}
            <div className="relative">
                             <label className="block text-sm font-medium text-gray-700 mb-2">
                 {t('aiTranslationLanguage')}
               </label>
              <div className="relative">
                <AILanguageSelector
                  selectedLanguage={formData.aiLanguage}
                  onLanguageChange={(lang) => setFormData({ ...formData, aiLanguage: lang })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t('notifications')}
            </h2>
          </div>

          <div className="space-y-4">
            {[
                             { key: 'messages', label: t('newMessages'), description: t('newMessagesDesc') },
               { key: 'mentions', label: t('mentions'), description: t('mentionsDesc') },
               { key: 'groupUpdates', label: t('groupUpdates'), description: t('groupUpdatesDesc') }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{item.label}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <button
                  onClick={() => handleNotificationChange(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.notifications[item.key] ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t('privacy')}
            </h2>
          </div>

          <div className="space-y-4">
            {[
                             { key: 'showOnlineStatus', label: t('showOnlineStatus'), description: t('showOnlineStatusDesc') },
               { key: 'showLastSeen', label: t('showLastSeen'), description: t('showLastSeenDesc') },
               { key: 'allowGroupInvites', label: t('allowGroupInvites'), description: t('allowGroupInvitesDesc') }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{item.label}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <button
                  onClick={() => handlePrivacyChange(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.privacy[item.key] ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.privacy[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('accountActions')}
          </h2>

          <div className="space-y-3">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Shield className="w-5 h-5" />
              <span>{t('changePassword')}</span>
            </button>
            
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Mail className="w-5 h-5" />
              <span>{t('changeEmail')}</span>
            </button>
            
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Smartphone className="w-5 h-5" />
              <span>{t('twoFactorAuth')}</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
               <h3 className="text-lg font-semibold text-gray-900">{t('changePassword')}</h3>
               <p className="text-sm text-gray-600 mt-1">{t('enterCurrentPasswordAndNew')}</p>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                   {t('currentPassword')}
                 </label>
                <input
                  type="password"
                  placeholder={t('enterCurrentPassword')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                   {t('newPassword')}
                 </label>
                <input
                  type="password"
                  placeholder={t('enterNewPassword')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                   {t('confirmNewPassword')}
                 </label>
                <input
                  type="password"
                  placeholder={t('confirmNewPasswordPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                                 {t('cancel')}
              </button>
              <button
                onClick={() => {
                  // TODO: Implement password change logic
                  console.log('Change password');
                  setShowPasswordModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                                 {t('changePassword')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage; 