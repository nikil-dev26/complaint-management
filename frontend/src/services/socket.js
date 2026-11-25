import { io } from 'socket.io-client';

const rawUrl =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const SOCKET_URL = rawUrl.replace(/\/+$/, '');

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
});

export default socket;