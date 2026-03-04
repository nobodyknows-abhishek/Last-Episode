import axios from "axios";

export const notificationService = {
  getNotifications: async (token) => {
    const response = await axios.get("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  markAsRead: async (id, token) => {
    const response = await axios.put(
      `/api/notifications/${id}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  },

  markAllAsRead: async (token) => {
    const response = await axios.put(
      "/api/notifications/read-all",
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  },
};
