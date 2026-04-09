import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { notificationService } from "../services/notificationService";

const NotificationMenu = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  // Real-time notifications listener
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [socket]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user || !user.token) return;
    try {
      const data = await notificationService.getNotifications(user.token);
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Keep interval as backup, but real-time is primary now
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id) => {
    if (!user?.token) return;
    try {
      await notificationService.markAsRead(id, user.token);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.token) return;
    try {
      await notificationService.markAllAsRead(user.token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-cyber-amber transition-colors rounded-full hover:bg-white/5 cursor-pointer"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 h-2.5 w-2.5 bg-cyber-amber rounded-full shadow-[0_0_8px_rgba(255,170,0,0.8)]"
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute -right-12 sm:right-0 top-full mt-3 w-85 sm:w-96 rounded-2xl bg-cyber-black/95 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden z-50 origin-top"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-linear-to-r from-white/5 to-transparent">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Bell size={16} className="text-cyber-amber" />
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-cyber-amber/20 text-cyber-amber text-xs px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-cyber-teal hover:text-white transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 size={14} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell
                    size={32}
                    className="mx-auto mb-3 opacity-20 text-white"
                  />
                  <p>You're all caught up!</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notification) => (
                    <motion.div
                      layout
                      key={notification._id}
                      className={`p-4 border-b border-white/5 last:border-0 transition-colors ${
                        notification.isRead ? "opacity-70" : "bg-white/5"
                      }`}
                    >
                      <div className="flex gap-3">
                        {notification.anime?.imageUrl && (
                          <div className="shrink-0 w-12 h-16 rounded overflow-hidden shadow">
                            <img
                              src={notification.anime.imageUrl}
                              alt={notification.anime.title || "Anime"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              notification.isRead
                                ? "text-gray-300"
                                : "text-white font-medium"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(
                              notification.createdAt,
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="shrink-0 self-center p-2 text-gray-500 hover:text-cyber-teal hover:bg-white/10 rounded-full transition-colors"
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationMenu;
