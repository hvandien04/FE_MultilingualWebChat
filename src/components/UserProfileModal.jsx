import { X, Mail, Globe, Clock, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAvatarUrl } from '../config/api';

const UserProfileModal = ({ isOpen, onClose, user }) => {
  const { t } = useLanguage();

  if (!isOpen || !user) return null;

  const getLanguageName = (languageCode) => {
    const languageMap = {
      'en': t('english'),
      'vi': t('vietnamese'),
      'es': t('spanish')
    };
    return languageMap[languageCode] || languageCode;
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return t('online');
    
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('justNow');
    if (diffInMinutes < 60) return `${diffInMinutes} ${t('minutesAgo')}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ${t('hoursAgo')}`;
    return `${Math.floor(diffInMinutes / 1440)} ${t('daysAgo')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('userProfile')}
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
          {/* Avatar and Basic Info */}
          <div className="text-center mb-4">
            <div className="relative inline-block">
              <img
                src={getAvatarUrl(user.avatarUrl || user.avatar, 'user')}
                alt={user.fullName || user.name || user.username}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.src = getAvatarUrl(null, 'user');
                }}
              />
              <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${
                user.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {user.fullName || user.name || user.username || t('unknownUser')}
            </h3>
            <p className={`text-sm ${
              user.isOnline ? 'text-green-600' : 'text-gray-500'
            }`}>
              {user.isOnline ? t('online') : formatLastSeen(user.lastSeen)}
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            {user.email && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {t('email')}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {user.language && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {t('preferredLanguage')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {getLanguageName(user.language)}
                  </p>
                </div>
              </div>
            )}

            {user.lastSeen && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {t('lastSeen')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatLastSeen(user.lastSeen)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 space-y-2">
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
            <MessageCircle className="w-4 h-4" />
            <span>{t('sendMessage')}</span>
          </button>
          
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <Mail className="w-4 h-4" />
            <span>{t('sendEmail')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal; 