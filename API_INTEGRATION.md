# API Integration Guide

## Authentication API Endpoints

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication Endpoint
```
{{Api Gateway}}/identify/auth
```

## API Endpoints

### 1. Login
**POST** `/identify/auth`

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "code": 200,
  "result": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "authenticated": true
  }
}
```

### 2. Register
**POST** `/identify/auth/register`

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string"
}
```

**Response:**
```json
{
  "code": 200,
  "result": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "authenticated": true
  }
}
```

### 3. Get Current User
**GET** `/identify/auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "code": 200,
  "result": {
    "userId": "USE453E",
    "googleId": "optional_google_id",
    "username": "hieuht65",
    "locale": "VN",
    "avatarUrl": "https://example.com/avatar.jpg",
    "fullName": "Hoàng Văn Diện",
    "createdAt": "2025-08-05T23:06:47Z",
    "updatedAt": "2025-08-06T10:55:19Z",
    "role": "USER"
  }
}
```

**Available Fields:**
- `userId`: Unique user identifier
- `googleId`: Google account ID (if authenticated via Google)
- `username`: Username for login
- `locale`: User's locale/language preference
- `avatarUrl`: URL to user's avatar image
- `fullName`: User's full name
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp
- `role`: User role (USER, ADMIN, etc.)

### 4. Google OAuth2 Login
**GET** `/identify/oauth2/authorization/google`

**Description:** Redirects user to Google OAuth2 authorization page

**Response:** Redirects to Google OAuth2 flow

### 5. OAuth2 Success Callback
**GET** `/identify/auth/oauth2/success`

**Description:** Callback endpoint after successful Google OAuth2 authentication

**Response:** Redirects to frontend with token in cookie

**Backend Behavior:**
- Sets cookie with JWT token
- Redirects to: `http://localhost:5173/chat`
- Frontend automatically processes the token and logs user in

## Implementation Details

### Frontend Changes

1. **AuthContext.jsx**: Updated to use real API calls instead of mock data
2. **AuthPage.jsx**: Modified form fields for registration (username, email, password, fullName)
3. **App.jsx**: Added AuthInitializer to check authentication status on app start

### Features

- **Login**: Uses username and password, then automatically fetches full user details
- **Google OAuth2**: One-click login with Google account, automatic redirect to chat
- **Registration**: Collects username, email, password, and fullName
- **Token Management**: Automatically stores and uses JWT tokens
- **Auto-authentication**: Checks existing tokens on app startup and fetches user details
- **User Object**: Rich user object with all available fields from `/me` endpoint
- **Error Handling**: Proper error messages from API responses with fallback handling
- **OAuth2 Flow**: Backend redirects to frontend with secure HTTP-only cookies

### Security

- JWT tokens are stored in localStorage
- Authorization headers are automatically set for authenticated requests
- Tokens are cleared on logout

## Testing

To test the integration:

1. Start your backend API server on `http://localhost:8000`
2. Ensure the `/identify/auth` endpoint is available
3. Test login and registration flows
4. Verify token persistence and auto-authentication

## Error Handling

The frontend handles various error scenarios:
- Network errors
- API validation errors
- Authentication failures
- Server errors

All errors are displayed to the user with appropriate messages.

## Chat API Endpoints

### 6. Get Conversation List
**GET** `/chat/message/list`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
page: int (default: 0) - Page number for pagination
size: int (default: 50) - Number of items per page
```

**Response:**
```json
{
  "code": 200,
  "result": [
    {
      "userId": "USECDD6",
      "conversationId": "C_9475A",
      "messageText": "Hello friend, my name is Diện",
      "messageTextTranslate": "Xin chào bạn, tên tôi là Diện.",
      "sentDatetime": "2025-08-11T13:37:51Z",
      "userProfiles": [
        {
          "userId": "USECDD6",
          "fullName": "Hoàng Văn Diện",
          "avatarUrl": null,
          "locale": "US"
        }
      ]
    }
  ]
}
```

**Available Fields:**
- `userId`: User ID who sent the message
- `conversationId`: Unique conversation identifier
- `messageText`: Original message text
- `messageTextTranslate`: AI-translated message text
- `sentDatetime`: Message timestamp
- `userProfiles`: Array of user profile information
  - `userId`: User identifier
  - `fullName`: User's full name
  - `avatarUrl`: URL to user's avatar (can be null)
  - `locale`: User's locale/language preference

## Implementation Details

### Frontend Changes

1. **AuthContext.jsx**: Updated to use real API calls instead of mock data
2. **AuthPage.jsx**: Modified form fields for registration (username, email, password, fullName)
3. **App.jsx**: Added AuthInitializer to check authentication status on app start
4. **ConversationList.jsx**: Updated to use real API with lazy loading and pagination

### Features

- **Login**: Uses username and password, then automatically fetches full user details
- **Google OAuth2**: One-click login with Google account, automatic redirect to chat
- **Registration**: Collects username, email, password, and fullName
- **Token Management**: Automatically stores and uses JWT tokens
- **Auto-authentication**: Checks existing tokens on app startup and fetches user details
- **User Object**: Rich user object with all available fields from `/me` endpoint
- **Error Handling**: Proper error messages from API responses with fallback handling
- **OAuth2 Flow**: Backend redirects to frontend with secure HTTP-only cookies
- **Lazy Loading**: Infinite scroll pagination for conversation list
- **Real-time Data**: Fetches conversations from actual API instead of mock data

### Security

- JWT tokens are stored in localStorage
- Authorization headers are automatically set for authenticated requests
- Tokens are cleared on logout

## Testing

To test the integration:

1. Start your backend API server on `http://localhost:8000`
2. Ensure the `/identify/auth` endpoint is available
3. Test login and registration flows
4. Verify token persistence and auto-authentication
5. Test conversation list loading with pagination

## Error Handling

The frontend handles various error scenarios:
- Network errors
- API validation errors
- Authentication failures
- Server errors
- Pagination errors

All errors are displayed to the user with appropriate messages.

## Notes

- The server response format uses `code` and `result` structure
- User details are not returned in login response, so frontend calls `/me` endpoint to get full user info
- Token is stored in `result.token` path
- Authentication status is checked via `result.authenticated` boolean in login response
- User object is created from `/me` endpoint response with all available fields
- Frontend automatically calls `/me` after successful login to populate user details
- Conversation list supports pagination with `page` and `size` parameters
- Frontend implements infinite scroll for better user experience
- Page size is set to 20 for optimal performance and UX

### 7. Get Messages for Conversation
**GET** `/chat/message/{conversationId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
```
conversationId: string - The ID of the conversation
```

**Query Parameters:**
```
page: int (default: 0) - Page number for pagination
size: int (default: 50) - Number of items per page
```

**Response:**
```json
{
  "code": 200,
  "result": [
    {
      "messageId": "35",
      "userId": "USECDD6",
      "conversationId": "C_9475A",
      "messageText": "Hello friend, my name is Diện",
      "messageTextTranslate": "Xin chào bạn, tên tôi là Diện.",
      "sentDatetime": "2025-08-11T13:37:51Z",
      "type": "TEXT"
    },
    {
      "messageId": "34",
      "userId": "USE453E",
      "conversationId": "C_9475A",
      "messageText": "Chào bạn nhé",
      "messageTextTranslate": "Hello friend.\n\n\n\n",
      "sentDatetime": "2025-08-11T13:37:19Z",
      "type": "TEXT"
    }
  ]
}
```

**Available Fields:**
- `messageId`: Unique message identifier
- `userId`: User ID who sent the message
- `conversationId`: Conversation ID this message belongs to
- `messageText`: Original message text
- `messageTextTranslate`: AI-translated message text
- `sentDatetime`: Message timestamp
- `type`: Message type (TEXT, IMAGE, etc.)

## Implementation Details

### Frontend Changes

1. **AuthContext.jsx**: Updated to use real API calls instead of mock data
2. **AuthPage.jsx**: Modified form fields for registration (username, email, password, fullName)
3. **App.jsx**: Added AuthInitializer to check authentication status on app start
4. **ConversationList.jsx**: Updated to use real API with lazy loading and pagination
5. **ChatMessages.jsx**: Updated to use real API with lazy loading for message history

### Features

- **Login**: Uses username and password, then automatically fetches full user details
- **Google OAuth2**: One-click login with Google account, automatic redirect to chat
- **Registration**: Collects username, email, password, and fullName
- **Token Management**: Automatically stores and uses JWT tokens
- **Auto-authentication**: Checks existing tokens on app startup and fetches user details
- **User Object**: Rich user object with all available fields from `/me` endpoint
- **Error Handling**: Proper error messages from API responses with fallback handling
- **OAuth2 Flow**: Backend redirects to frontend with secure HTTP-only cookies
- **Lazy Loading**: Infinite scroll pagination for conversation list
- **Real-time Data**: Fetches conversations from actual API instead of mock data
- **Message History**: Loads conversation messages with pagination support
- **Infinite Scroll**: Loads older messages when scrolling to top

### Security

- JWT tokens are stored in localStorage
- Authorization headers are automatically set for authenticated requests
- Tokens are cleared on logout

## Testing

To test the integration:

1. Start your backend API server on `http://localhost:8000`
2. Ensure the `/identify/auth` endpoint is available
3. Test login and registration flows
4. Verify token persistence and auto-authentication
5. Test conversation list loading with pagination
6. Test message loading for specific conversations

## Error Handling

The frontend handles various error scenarios:
- Network errors
- API validation errors
- Authentication failures
- Server errors
- Pagination errors
- Message loading errors

All errors are displayed to the user with appropriate messages.

## Notes

- The server response format uses `code` and `result` structure
- User details are not returned in login response, so frontend calls `/me` endpoint to get full user info
- Token is stored in `result.token` path
- Authentication status is checked via `result.authenticated` boolean in login response
- User object is created from `/me` endpoint response with all available fields
- Frontend automatically calls `/me` after successful login to populate user details
- Conversation list supports pagination with `page` and `size` parameters
- Frontend implements infinite scroll for better user experience
- Page size is set to 20 for optimal performance and UX
- Messages are loaded with pagination, older messages appear at the top
- Frontend automatically scrolls to bottom for new messages
- User avatars and names are resolved from conversation participants or current user

## WebSocket Integration

### WebSocket Endpoint
**WS** `ws://localhost:8000/ws`

**STOMP Configuration:**
- **Message Broker**: `/topic` (for conversation broadcasts), `/queue` (for personal messages)
- **Application Prefix**: `/app` (for sending messages)
- **User Destination Prefix**: `/user` (for personal queues)

**Note**: Using native WebSocket instead of SockJS for better browser compatibility

### WebSocket Topics

#### 1. Conversation Topic
**Subscribe**: `/topic/{conversationId}`
**Description**: Subscribe to receive all messages in a specific conversation

#### 2. Personal Queue
**Subscribe**: `/user/{userId}/queue/messages`
**Description**: Subscribe to receive personal messages and notifications

#### 3. Send Message
**Send to**: `/app/chat/{conversationId}`
**Description**: Send a message to a specific conversation

### WebSocket Message Format
```json
{
  "messageId": "35",
  "userId": "USECDD6",
  "conversationId": "C_9475A",
  "messageText": "Hello friend, my name is Diện",
  "messageTextTranslate": "Xin chào bạn, tên tôi là Diện.",
  "sentDatetime": "2025-08-11T13:37:51Z",
  "type": "TEXT"
}
```

### Frontend WebSocket Features
- **Auto-connection**: Connects automatically after successful login
- **Auto-reconnection**: Attempts to reconnect on connection loss
- **Conversation subscription**: Automatically subscribes to selected conversation
- **Real-time messages**: Receives new messages instantly via WebSocket
- **Message handling**: Processes incoming messages and updates UI
- **Cleanup**: Unsubscribes from conversations when switching 