class CloudinaryService {
  constructor() {
    // Cloudinary configuration - you'll need to set these in your environment
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset';
    this.apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    this.apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
    
    this.baseUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}`;
  }

  // Upload file to Cloudinary
  async uploadFile(file) {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      
      // Optional: Add folder
      formData.append('folder', 'chat-attachments');
      
      // Add optimization parameters for faster upload and better quality
      if (file.type.startsWith('image/')) {
        // Image optimization
        formData.append('quality', 'auto'); // Auto quality optimization
        formData.append('fetch_format', 'auto'); // Auto format selection
        formData.append('flags', 'progressive'); // Progressive JPEG for faster loading
      } else if (file.type.startsWith('video/')) {
        // Video optimization
        formData.append('quality', 'auto');
        formData.append('fetch_format', 'auto');
      }
      
      // Upload to Cloudinary
      const response = await fetch(`${this.baseUrl}/auto/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Determine message type based on file type
      const messageType = this.getMessageType(file.type, result.format);
      
      return {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          type: messageType,
          size: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration, // for videos
          thumbnail: result.thumbnail_url || result.secure_url
        }
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Determine message type based on file type
  getMessageType(mimeType, format) {
    if (mimeType.startsWith('image/')) {
      return 'IMAGE';
    } else if (mimeType.startsWith('video/')) {
      return 'VIDEO';
    } else if (mimeType.startsWith('audio/')) {
      return 'AUDIO';
    } else if (mimeType.includes('pdf')) {
      return 'DOCUMENT';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'DOCUMENT';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return 'DOCUMENT';
    } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return 'DOCUMENT';
    } else {
      return 'FILE';
    }
  }

  // Get file size in human readable format
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate file before upload
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 10MB limit'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported'
      };
    }

    return {
      valid: true,
      error: null
    };
  }

  // Delete file from Cloudinary (if needed)
  async deleteFile(publicId) {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = this.generateSignature(publicId, timestamp);
      
      const response = await fetch(`${this.baseUrl}/delete_by_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: signature,
          public_id: publicId
        })
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate signature for delete operation
  generateSignature(publicId, timestamp) {
    // This would need to be implemented on your backend for security
    // Frontend shouldn't have access to API secret
    console.warn('Delete signature should be generated on backend');
    return '';
  }
}

export default new CloudinaryService();
