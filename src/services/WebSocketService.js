// WebSocketService.js
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.subscriptions = new Map();    // conversationId -> subscription
    this.messageHandlers = new Map();  // conversationId -> handler (buffer trước khi connect)
    this.personalSub = null;
    this.personalHandler = null;
    this.token = null;

    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
  }

  get connected() {
    return !!this.stompClient?.connected;
  }

  connect(token, onConnect, onError) {
    // Nếu đã kết nối thì bỏ qua
    if (this.connected) {
      console.log('✅ WS already connected');
      onConnect?.();
      return;
    }
    
    this.token = token;
    console.log('🚀 Starting WebSocket connection...');
    console.log('📡 Target endpoint: http://localhost:8081/chat/ws');
    console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'No token');

    this.stompClient = new Client({
      // SockJS dùng http/https, KHÔNG dùng ws/wss
      webSocketFactory: () => {
        console.log('Creating SockJS connection to: http://localhost:8081/chat/ws');
        return new SockJS('http://localhost:8081/chat/ws');
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => console.log('[STOMP]', str),
      // Auto reconnect
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('✅ WebSocket connected successfully:', frame);
      this.reconnectAttempts = 0;

      // resubscribe tất cả phòng đã lưu handler
      this._resubscribeAllInternal();

      // subscribe kênh cá nhân nếu đã đăng ký trước
      if (this.personalHandler) {
        this._subscribePersonalInternal(this.personalHandler);
      }

      onConnect?.(frame);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame);
      onError?.(frame);
    };

    this.stompClient.onWebSocketError = (err) => {
      console.error('❌ WebSocket connection error:', err);
      console.error('Error details:', {
        message: err.message,
        type: err.type,
        target: err.target?.url
      });
      onError?.(err);
    };

    this.stompClient.onWebSocketClose = () => {
      console.warn('WS closed');
      // @stomp/stompjs sẽ tự reconnect dựa trên reconnectDelay
      // Bạn có thể tăng backoff nếu muốn:
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        this.stompClient.reconnectDelay =
          this.reconnectDelay * this.reconnectAttempts;
      }
    };

    this.stompClient.activate();
  }

  // --- Conversation topic ---
  subscribeToConversation(conversationId, messageHandler) {
    const topic = `/topic/${conversationId}`;

    // LƯU handler trước để có thể resubscribe sau khi connect
    this.messageHandlers.set(conversationId, messageHandler);

    if (!this.connected) {
      console.warn('WS not connected, will subscribe after connect');
      return null;
    }

    // Hủy sub cũ nếu có
    this.unsubscribeFromConversation(conversationId);

    try {
      const sub = this.stompClient.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log('Received message from conversation:', conversationId, data);
          messageHandler?.(data);
        } catch (e) {
          console.error('Parse message error:', e);
        }
      });

      this.subscriptions.set(conversationId, sub);
      console.log(`Successfully subscribed to conversation: ${conversationId}`);
      return sub;
    } catch (error) {
      console.error('Error subscribing to conversation:', error);
      return null;
    }
  }

  unsubscribeFromConversation(conversationId) {
    const sub = this.subscriptions.get(conversationId);
    if (sub) sub.unsubscribe();
    this.subscriptions.delete(conversationId);
    // Giữ messageHandler hay xoá? → tuỳ bạn.
    // Nếu muốn khi mở lại tab tự nhận tiếp, giữ lại handler:
    // this.messageHandlers.delete(conversationId);
  }

  _resubscribeAllInternal() {
    for (const [conversationId, handler] of this.messageHandlers) {
      // tạo lại subscription
      const topic = `/topic/${conversationId}`;
      // hủy sub cũ nếu tồn tại (an toàn)
      this.subscriptions.get(conversationId)?.unsubscribe();

      const sub = this.stompClient.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body);
          handler?.(data);
        } catch (e) {
          console.error('Parse message error:', e);
        }
      });

      this.subscriptions.set(conversationId, sub);
    }
  }

  // --- Personal queue ---
  subscribeToPersonalQueue(messageHandler) {
    // KHÔNG kèm userId, vì server map theo Principal với prefix /user
    this.personalHandler = messageHandler;

    if (!this.connected) {
      console.warn('WS not connected, will subscribe personal after connect');
      return null;
    }
    return this._subscribePersonalInternal(messageHandler);
  }

  _subscribePersonalInternal(handler) {
    const dest = '/user/queue/messages';
    if (this.personalSub) this.personalSub.unsubscribe();
    this.personalSub = this.stompClient.subscribe(dest, (message) => {
      try {
        const data = JSON.parse(message.body);
        handler?.(data);
      } catch (e) {
        console.error('Parse personal message error:', e);
      }
    });
    return this.personalSub;
  }

  // --- Send ---
  sendMessage(conversationId, messageText, messageType = 'TEXT') {
    if (!this.connected) {
      console.warn('WS not connected, cannot send message');
      return false;
    }
    
    // Khớp với MessageRequest format của backend
    const payload = {
      messageText: messageText,
      conversationId: conversationId,
      type: messageType.toUpperCase() // TEXT, IMAGE, FILE, VIDEO
    };
    
    console.log('📤 Sending message via WebSocket:', payload);
    
    // Khớp @MessageMapping("/chat") trên BE (không có {conversationId})
    this.stompClient.publish({
      destination: `/app/chat`,
      headers: { Authorization: `Bearer ${this.token}` },
      body: JSON.stringify(payload),
    });
    
    return true;
  }

  // --- Disconnect ---
  disconnect() {
    // huỷ sub phòng
    for (const sub of this.subscriptions.values()) {
      sub.unsubscribe();
    }
    this.subscriptions.clear();

    // huỷ sub personal
    this.personalSub?.unsubscribe?.();
    this.personalSub = null;

    this.stompClient?.deactivate();
    this.stompClient = null;
    console.log('WS disconnected');
  }

  getConnectionStatus() {
    const status = {
      connected: this.connected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      stompClient: !!this.stompClient,
      subscriptions: this.subscriptions.size,
      messageHandlers: this.messageHandlers.size
    };
    
    console.log('🔍 WebSocket Status:', status);
    return status;
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
