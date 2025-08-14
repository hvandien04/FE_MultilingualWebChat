// Mock users data
export const mockUsers = [
  {
    id: 1,
    name: "John Smith",
    email: "john@example.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    language: "en",
    isOnline: true,
    lastSeen: new Date()
  },
  {
    id: 2,
    name: "Maria Garcia",
    email: "maria@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    language: "es",
    isOnline: false,
    lastSeen: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  },
  {
    id: 3,
    name: "Nguyen Van An",
    email: "an@example.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    language: "vi",
    isOnline: true,
    lastSeen: new Date()
  },
  {
    id: 4,
    name: "Emma Wilson",
    email: "emma@example.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    language: "en",
    isOnline: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: 5,
    name: "Carlos Rodriguez",
    email: "carlos@example.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    language: "es",
    isOnline: true,
    lastSeen: new Date()
  }
];

// Mock conversations data
export const mockConversations = [
  {
    id: 1,
    type: "direct",
    participants: [1, 2],
    lastMessage: {
      senderId: 2,
      originalText: "¡Hola! ¿Cómo estás?",
      translatedText: "Hello! How are you?",
      timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    },
    unreadCount: 2
  },
  {
    id: 2,
    type: "group",
    name: "Project Team",
    participants: [1, 3, 4, 5],
    lastMessage: {
      senderId: 3,
      originalText: "Tôi sẽ gửi báo cáo vào ngày mai",
      translatedText: "I will send the report tomorrow",
      timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    },
    unreadCount: 0
  },
  {
    id: 3,
    type: "direct",
    participants: [1, 4],
    lastMessage: {
      senderId: 1,
      originalText: "Great! Let's meet tomorrow",
      translatedText: "Tuyệt! Hãy gặp nhau vào ngày mai",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    },
    unreadCount: 0
  },
  {
    id: 4,
    type: "direct",
    participants: [1, 3],
    lastMessage: {
      senderId: 3,
      originalText: "Bạn có rảnh để họp không?",
      translatedText: "Are you free for a meeting?",
      timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    unreadCount: 1
  },
  {
    id: 5,
    type: "direct",
    participants: [1, 5],
    lastMessage: {
      senderId: 5,
      originalText: "¿Necesitas ayuda con el proyecto?",
      translatedText: "Do you need help with the project?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    unreadCount: 3
  }
];

// Mock messages data
export const mockMessages = {
  1: [ // Conversation 1 messages
    {
      id: 1,
      senderId: 2,
      originalText: "¡Hola! ¿Cómo estás?",
      translatedText: "Hello! How are you?",
      timestamp: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 2,
      senderId: 1,
      originalText: "I'm doing great, thanks! How about you?",
      translatedText: "¡Estoy muy bien, gracias! ¿Y tú?",
      timestamp: new Date(Date.now() - 25 * 60 * 1000)
    },
    {
      id: 3,
      senderId: 2,
      originalText: "Muy bien también. ¿Tienes planes para el fin de semana?",
      translatedText: "Very well too. Do you have plans for the weekend?",
      timestamp: new Date(Date.now() - 20 * 60 * 1000)
    },
    {
      id: 4,
      senderId: 1,
      originalText: "Yes, I'm going to the beach with some friends",
      translatedText: "Sí, voy a la playa con algunos amigos",
      timestamp: new Date(Date.now() - 10 * 60 * 1000)
    },
    {
      id: 5,
      senderId: 2,
      originalText: "¡Qué divertido! ¡Disfruta!",
      translatedText: "How fun! Enjoy!",
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    }
  ],
  
  2: [ // Conversation 2 messages
    {
      id: 6,
      senderId: 1,
      originalText: "Hi everyone! How's the project going?",
      translatedText: "Chào mọi người! Dự án thế nào rồi?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 7,
      senderId: 3,
      originalText: "Dự án đang tiến triển tốt. Tôi đã hoàn thành phần backend",
      translatedText: "The project is progressing well. I've completed the backend part",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000)
    },
    {
      id: 8,
      senderId: 4,
      originalText: "That's great! I'm working on the frontend design",
      translatedText: "Thật tuyệt! Tôi đang làm thiết kế frontend",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 9,
      senderId: 5,
      originalText: "Perfecto, yo me encargo de la base de datos",
      translatedText: "Perfect, I'll take care of the database",
      timestamp: new Date(Date.now() - 45 * 60 * 1000)
    },
    {
      id: 10,
      senderId: 3,
      originalText: "Tôi sẽ gửi báo cáo vào ngày mai",
      translatedText: "I will send the report tomorrow",
      timestamp: new Date(Date.now() - 15 * 60 * 1000)
    }
  ],
  
  3: [ // Conversation 3 messages
    {
      id: 11,
      senderId: 4,
      originalText: "Hey! Are you free for a coffee tomorrow?",
      translatedText: "Này! Bạn có rảnh để uống cà phê ngày mai không?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 12,
      senderId: 1,
      originalText: "Sure! What time works for you?",
      translatedText: "Chắc chắn! Mấy giờ thì phù hợp với bạn?",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000)
    },
    {
      id: 13,
      senderId: 4,
      originalText: "How about 3 PM at the usual place?",
      translatedText: "3 giờ chiều tại chỗ quen thuộc thì sao?",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 14,
      senderId: 1,
      originalText: "Great! Let's meet tomorrow",
      translatedText: "Tuyệt! Hãy gặp nhau vào ngày mai",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
    }
  ]
};

// Mock translation pairs for AI translation simulation
export const mockTranslations = {
  "Hello! How are you?": {
    vi: "Xin chào! Bạn khỏe không?",
    es: "¡Hola! ¿Cómo estás?"
  },
  "I'm doing great, thanks! How about you?": {
    vi: "Tôi rất khỏe, cảm ơn! Còn bạn thì sao?",
    es: "¡Estoy muy bien, gracias! ¿Y tú?"
  },
  "Very well too. Do you have plans for the weekend?": {
    vi: "Cũng rất khỏe. Bạn có kế hoạch gì cho cuối tuần không?",
    es: "Muy bien también. ¿Tienes planes para el fin de semana?"
  },
  "Yes, I'm going to the beach with some friends": {
    vi: "Có, tôi sẽ đi biển với một số người bạn",
    es: "Sí, voy a la playa con algunos amigos"
  },
  "How fun! Enjoy!": {
    vi: "Thật vui! Hãy tận hưởng nhé!",
    es: "¡Qué divertido! ¡Disfruta!"
  }
}; 