import { useState, useEffect, useRef } from 'react';
import { Search, X, History, Trash2, User, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../services/ApiService';
import { getAvatarUrl } from '../config/api';

const UserSearch = ({ onUserSelect, className = '', placeholder = "Search by User ID or Email..." }) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchResultsHistory, setSearchResultsHistory] = useState([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const searchRef = useRef(null);

  // Load search history and results from localStorage
  useEffect(() => {
    // Load search queries history
    const history = localStorage.getItem('userSearchHistory');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        localStorage.removeItem('userSearchHistory');
      }
    }

    // Load search results history
    const resultsHistory = localStorage.getItem('userSearchResultsHistory');
    if (resultsHistory) {
      try {
        setSearchResultsHistory(JSON.parse(resultsHistory));
      } catch (e) {
        localStorage.removeItem('userSearchResultsHistory');
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (query) => {
    if (!query.trim()) return;
    
    const newHistory = [
      query,
      ...searchHistory.filter(item => item !== query)
    ].slice(0, 10); // Keep only last 10 searches
    
    setSearchHistory(newHistory);
    localStorage.setItem('userSearchHistory', JSON.stringify(newHistory));
  };

  // Save search results to localStorage
  const saveSearchResults = (results) => {
    if (!results || results.length === 0) return;
    
    const searchResultsHistory = JSON.parse(localStorage.getItem('userSearchResultsHistory') || '[]');
    const newResultsHistory = [
      ...results.map(result => ({
        ...result,
        searchTime: Date.now()
      })),
      ...searchResultsHistory.filter(item => 
        !results.some(result => result.userId === item.userId)
      )
    ].slice(0, 20); // Keep only last 20 results
    
    localStorage.setItem('userSearchResultsHistory', JSON.stringify(newResultsHistory));
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('userSearchHistory');
  };

  // Clear search results history
  const clearSearchResultsHistory = () => {
    setSearchResultsHistory([]);
    localStorage.removeItem('userSearchResultsHistory');
  };

  // Search user by userId or email
  const searchUser = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');
    setHasSearched(true); // Mark that search has been performed

    try {
      const response = await ApiService.findUser(query);
      
      if (response.success && response.data) {
        setSearchResults([response.data]);
        saveSearchHistory(query);
        saveSearchResults([response.data]);
      } else {
        setSearchResults([]);
        setError('User not found');
      }
    } catch (error) {
      setError(error.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input - only update state, don't call API
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear results when input is empty
    if (!query.trim()) {
      setSearchResults([]);
      setError('');
      setHasSearched(false); // Reset search state when input is cleared
    }
  };

  // Handle search on Enter key
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      searchUser(searchQuery.trim());
    }
  };

  // Handle search from history
  const handleHistoryClick = (query) => {
    setSearchQuery(query);
    searchUser(query);
    setShowHistory(false);
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    onUserSelect(user);
    setSearchQuery('');
    setSearchResults([]);
    setError('');
  };



  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <div className="relative flex">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchInput}
            onKeyDown={handleSearchKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-r-none"
          />

          <button
            onClick={() => searchQuery.trim() && searchUser(searchQuery.trim())}
            disabled={!searchQuery.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

            {/* Current Search Results - Show first when searching */}
      {searchResults.length > 0 && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search Results
            </span>
          </div>
          <div className="py-1">
            {searchResults.map((user) => (
              <button
                key={user.userId}
                onClick={() => handleUserSelect(user)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
              >
                <img
                  src={getAvatarUrl(user.avatarUrl, 'user')}
                  alt={user.fullName}
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = getAvatarUrl(null, 'user');
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.fullName}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {user.userId}
                    </span>
                    <span className="flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {user.email}
                    </span>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {user.locale}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}



      {/* Recent Search Results - Show only when NOT searching and NOT after search */}
      {searchResultsHistory.length > 0 && !searchQuery && searchResults.length === 0 && !hasSearched && (
        <div className="mt-3 bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Recent Search Results
              </span>
              <button
                onClick={clearSearchResultsHistory}
                className="text-xs text-red-500 hover:text-red-700 flex items-center"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </button>
            </div>
          </div>
          <div className="py-1">
            {searchResultsHistory.map((user, index) => (
              <button
                key={`${user.userId}-${index}`}
                onClick={() => handleUserSelect(user)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
              >
                <img
                  src={getAvatarUrl(user.avatarUrl, 'user')}
                  alt={user.fullName}
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = getAvatarUrl(null, 'user');
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.fullName}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {user.userId}
                    </span>
                    <span className="flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {user.email}
                    </span>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {user.locale}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message - Show when there's an actual error */}
      {error && error !== 'User not found' && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* User not found message - Show only after search has been performed and no results */}
      {hasSearched && searchResults.length === 0 && searchQuery && !isLoading && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-sm text-red-600">User not found</p>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg p-2">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">Searching...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
