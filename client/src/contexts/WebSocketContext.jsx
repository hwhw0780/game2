import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [ws, setWs] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
        };

        setWs(socket);

        return () => {
            socket.close();
        };
    }, []);

    const sendMessage = (type, data) => {
        if (ws && isConnected) {
            ws.send(JSON.stringify({ type, ...data }));
        }
    };

    return (
        <WebSocketContext.Provider value={{ ws, isConnected, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext); 