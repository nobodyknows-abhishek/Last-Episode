import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import axios from "axios";

// Configure default axios base URL
const apiBaseURL = import.meta.env.VITE_API_URL || "";
axios.defaults.baseURL = apiBaseURL;

// Global axios interceptor for 401 Unauthorized errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized request detected. Clearing session...");
      localStorage.removeItem("userInfo");
      // Use window.location to force a reload if needed, or simply let the app redirect
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
