import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const newSocket = io(
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
    );
    setSocket(newSocket);

    newSocket.on("anime_updated", (data) => {
      setNotification(data.message);
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    });

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, notification }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
