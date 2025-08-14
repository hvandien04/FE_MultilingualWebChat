# 🌐 Multilingual Chat Application

A professional, responsive multilingual chat application built with ReactJS and Vite, featuring real-time translation capabilities and a modern Messenger-style interface.

## ✨ Features

### 🔐 Authentication
- **Login/Register System**: Simple form-based authentication with mock data
- **Google OAuth UI**: Styled Google login button (UI only)
- **Protected Routes**: Automatic redirection based on authentication status

### 💬 Chat Interface
- **3-Column Layout**: 
  - Left: Conversation list with search functionality
  - Middle: Chat messages with translation display
  - Right: Conversation info and member details
- **Message Translation**: Each message shows original text and AI-translated version
- **Responsive Design**: Mobile-friendly with collapsible sidebars
- **Real-time Feel**: Mock data that simulates live conversations

### 🌍 Multilingual Support
- **3 Languages**: English, Vietnamese, Spanish
- **Dynamic UI**: All interface text updates based on selected language
- **Language Selector**: Dropdown with flags and language names
- **Translation Context**: Messages display in original and translated formats

### 👥 User Management
- **Mock Users**: 5 pre-configured users with different languages
- **Profile Settings**: Avatar, name, and language preferences
- **Online Status**: Visual indicators for user availability
- **Group Conversations**: Support for both 1-on-1 and group chats

### 🎨 Design & UX
- **Modern UI**: Clean, flat design inspired by Facebook Messenger
- **TailwindCSS**: Utility-first styling for consistent design
- **Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Hover effects and transitions throughout

## 🚀 Tech Stack

- **Frontend**: ReactJS 18 with Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **State Management**: React Context API
- **Language**: JavaScript (no TypeScript)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FeJSMultingualWebChat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Project Structure

```
src/
├── components/           # React components
│   ├── AuthPage.js      # Login/Register page
│   ├── ChatPage.js      # Main chat interface
│   ├── ChatMessages.js  # Message display component
│   ├── ConversationInfo.js # Right sidebar info
│   ├── ConversationList.js # Left sidebar conversations
│   ├── LanguageSelector.js # Language dropdown
│   ├── MessageInput.js  # Message input component
│   └── SettingsPage.js  # User settings page
├── contexts/            # React contexts
│   ├── AuthContext.js   # Authentication state
│   └── LanguageContext.js # Language management
├── data/               # Mock data
│   ├── mockData.js     # Users, conversations, messages
│   └── translations.js # Language translations
├── App.js              # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## 🎯 Key Features Explained

### Authentication Flow
- Users can register with email/password or login with existing accounts
- Mock authentication validates against predefined user list
- Protected routes ensure only authenticated users access chat features

### Multilingual System
- Context-based language management
- Dynamic translation of all UI elements
- Language preferences stored per user
- Easy addition of new languages

### Chat Interface
- **Conversation List**: Shows recent conversations with last message and timestamp
- **Message Display**: Original text with AI-translated version below
- **Input System**: Text area with emoji and attachment buttons
- **Member Info**: Shows participants with their language preferences

### Mock Data Structure
- **Users**: 5 mock users with avatars, names, and language preferences
- **Conversations**: 3 conversations (2 direct, 1 group) with realistic messages
- **Messages**: Each message includes original text, translation, and timestamp
- **Translations**: Pre-defined translation pairs for demonstration

## 🎨 Design System

### Colors
- **Primary**: Blue (#3B82F6)
- **Secondary**: Gray scale for backgrounds and text
- **Success**: Green for online status
- **Error**: Red for error states

### Typography
- **Font**: System fonts (San Francisco, Segoe UI, etc.)
- **Sizes**: Responsive text sizing with TailwindCSS
- **Weights**: Medium for headings, normal for body text

### Layout
- **Grid**: Flexbox-based responsive layout
- **Spacing**: Consistent 4px grid system
- **Borders**: Subtle gray borders for separation
- **Shadows**: Light shadows for depth

## 📱 Responsive Design

### Desktop (1024px+)
- Full 3-column layout
- All sidebars visible
- Hover effects and detailed interactions

### Tablet (768px - 1023px)
- Collapsible right sidebar
- Maintained conversation list
- Touch-friendly interactions

### Mobile (< 768px)
- Single column layout
- Collapsible sidebars
- Mobile-optimized touch targets
- Swipe gestures for navigation

## 🔮 Future Enhancements

- **Real Backend**: Replace mock data with actual API calls
- **WebSocket**: Real-time message updates
- **File Upload**: Image and document sharing
- **Voice Messages**: Audio recording and playback
- **Video Calls**: WebRTC integration
- **Push Notifications**: Browser notifications
- **Message Reactions**: Emoji reactions to messages
- **Message Search**: Search through conversation history
- **Dark Mode**: Theme switching capability
- **More Languages**: Additional language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Unsplash**: For beautiful user avatars
- **Lucide**: For the excellent icon library
- **TailwindCSS**: For the utility-first CSS framework
- **React Community**: For the amazing ecosystem

---

**Built with ❤️ using ReactJS and Vite**
