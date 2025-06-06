import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Listen for vote updates
  onVoteUpdate(callback) {
    if (this.socket) {
      this.socket.on('voteUpdate', callback);
    }
  }

  // Listen for candidate updates
  onCandidateUpdate(callback) {
    if (this.socket) {
      this.socket.on('candidateUpdate', callback);
    }
  }

  // Remove listeners
  removeVoteListener() {
    if (this.socket) {
      this.socket.off('voteUpdate');
    }
  }

  removeCandidateListener() {
    if (this.socket) {
      this.socket.off('candidateUpdate');
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
