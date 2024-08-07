export class Socket {
    constructor(url) {
        this.url = url;
        this.socket = new WebSocket(url);
    }

    connect(url) {
        if (!this.socket || this.socket.readyState!== 1) {
            this.socket = new WebSocket(url);
        }
    }

    open(cb) {
        this.socket.addEventListener('open', () => {
            console.log('-----------------socket opened-----------------');
            cb();
        });
    }

    close() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    send(message) {
        this.socket.send(JSON.stringify(message));
    }

    on(callback) {
        this.socket.addEventListener('message', callback);
    }
}

// actions.js
export const wsAction = {
    OPEN_WEBSOCKET: 'OPEN_WEBSOCKET',
    RECEIVE_WEBSOCKET_MESSAGE: 'RECEIVE_WEBSOCKET_MESSAGE',
    WEBSOCKET_OPENED: 'WEBSOCKET_OPENED',
    STORE_MSG: 'STORE_MSG',
    WEBSOCKET_CLOSED: 'WEBSOCKET_CLOSED',
    WEBSOCKET_SEND: 'WEBSOCKET_SEND',
}


const initialState = {
    instance: null,
    msg: {},
};

const websocketReducer = (state = initialState, action) => {
    switch (action.type) {
        case wsAction.OPEN_WEBSOCKET:
            return { ...state, ...action.payload };
        case wsAction.WEBSOCKET_OPENED:
            return { ...state, status: 'opened' };
        case wsAction.RECEIVE_WEBSOCKET_MESSAGE:
            return { ...state, lastMessage: action.data };
        case wsAction.STORE_MSG:
            // console.log('-----state.msg-id.list.length---', state.msg[Object.keys(state.msg)[0]]?.list?.length);
            return { ...state, ...action.payload };
        case wsAction.WEBSOCKET_CLOSED:
            if (state.ws) {
                state.ws.close();
            }
            return {...state, instance: null };
        default:
            return state;
    }
};

export default websocketReducer;
