import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const newSocket = io(
      "import.meta.env.VITE_API_URL" || "http://localhost:5000",
      {
        transports: ["websocket"],
      },
    );
    setSocket(newSocket);

    newSocket.on("anime_updated", (data) => {
      setNotification(data.message);
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && user?._id) {
      socket.emit("join_user_room", user._id);
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={{ socket, notification }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
