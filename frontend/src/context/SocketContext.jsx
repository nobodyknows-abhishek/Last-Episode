import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState(null);
  // Live-received notifications (real-time, not fetched from API)
  const [liveNotifications, setLiveNotifications] = useState([]);
  // The currently-shown toast notification object (or null)
  const [toastNotif, setToastNotif] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    const newSocket = io(
      import.meta.env.VITE_API_URL || "http://localhost:5000",
      {
        transports: ["websocket"],
      },
    );
    setSocket(newSocket);

    // Legacy: generic anime_updated events (from full sync)
    newSocket.on("anime_updated", (data) => {
      setNotification(data.message);
      setTimeout(() => setNotification(null), 5000);
    });

    // Real-time per-user episode notification
    newSocket.on("new_notification", (notif) => {
      // Prepend to live list
      setLiveNotifications((prev) => [notif, ...prev].slice(0, 50));

      // Show toast (replace any existing one)
      setToastNotif(notif);

      // Auto-dismiss after 6 seconds
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToastNotif(null);
      }, 6000);
    });

    return () => {
      newSocket.close();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (socket && user?._id) {
      socket.emit("join_user_room", user._id);
    }
  }, [socket, user]);

  const clearToast = () => {
    setToastNotif(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  };

  return (
    <SocketContext.Provider
      value={{ socket, notification, liveNotifications, toastNotif, clearToast }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

