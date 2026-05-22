import { io } from 'socket.io-client';
import utils from '../helpers/utils';

const socket = io(utils.BASE_URL, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
});

export default socket;
