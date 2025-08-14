import { useState, useRef } from 'react';
import { Paperclip, Smile, Send, X, File, Image, Video, Music, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import cloudinaryService from '../services/CloudinaryService';
import ApiService from '../services/ApiService';
import { API_CONFIG } from '../config/api';
import EmojiPicker from './EmojiPicker';

const MessageInput = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled && !isUploading) {
      // If there are attachments, wait for upload to complete
      if (attachments.length > 0) {
        setIsUploading(true);
        try {
          console.log('🚀 Starting file uploads...');
          
          const uploadedAttachments = await Promise.all(
            attachments.map(async (attachment, index) => {
              if (attachment.uploaded) {
                return attachment;
              } else {
                console.log(`📤 Uploading ${attachment.name} (${index + 1}/${attachments.length})...`);
                const result = await cloudinaryService.uploadFile(attachment.file);
                if (result.success) {
                  console.log(`✅ Uploaded ${attachment.name} successfully`);
                  return {
                    ...attachment,
                    uploaded: true,
                    cloudinaryData: result.data
                  };
                } else {
                  throw new Error(`Failed to upload ${attachment.file.name}: ${result.error}`);
                }
              }
            })
          );

          console.log('🎉 All files uploaded successfully!');

          // Send message with attachments
          onSendMessage(message.trim(), uploadedAttachments);
          setMessage('');
          setAttachments([]);
        } catch (error) {
          console.error('Upload error:', error);
          alert(`Upload failed: ${error.message}`);
        } finally {
          setIsUploading(false);
        }
      } else {
        // Send text message only
        onSendMessage(message.trim());
        setMessage('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Check file size limit
    const oversizedFiles = files.filter(file => file.size > API_CONFIG.MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      alert(`File ${oversizedFiles[0].name} quá lớn! Kích thước tối đa: ${API_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }
    
    // Only allow allowed file types
    const validFiles = files.filter(file => 
      API_CONFIG.ALLOWED_FILE_TYPES.some(type => file.type.match(type))
    );
    
    if (validFiles.length !== files.length) {
      alert('Chỉ cho phép gửi ảnh, video và audio!');
      return;
    }
    
    const newAttachments = validFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = ''; // Reset input
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    return cloudinaryService.formatFileSize(bytes);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {attachments.length} file(s) selected
            </span>
            <button
              type="button"
              onClick={() => setAttachments([])}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Clear all
            </button>
          </div>
          
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-700 rounded border">
                {/* File Icon or Preview */}
                <div className="flex-shrink-0">
                  {attachment.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(attachment.file)}
                      alt={attachment.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : attachment.type.startsWith('video/') ? (
                    <video
                      src={URL.createObjectURL(attachment.file)}
                      className="w-12 h-12 object-cover rounded"
                      muted
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {cloudinaryService.formatFileSize(attachment.size)}
                  </p>
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        {/* Attach Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title={t('attachments.attach')}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*"
            className="hidden"
          />
        </div>

        {/* Message Input */}
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('typeMessage')}
            disabled={disabled || isUploading}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            rows="1"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>

        {/* Emoji Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title={t('attachments.emoji')}
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <EmojiPicker
            isOpen={isEmojiPickerOpen}
            onClose={() => setIsEmojiPickerOpen(false)}
            onEmojiSelect={handleEmojiSelect}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!message.trim() && attachments.length === 0) || disabled || isUploading}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={isUploading ? t('attachments.uploading') : t('attachments.send')}
        >
          {isUploading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-xs">Uploading...</span>
            </div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput; 