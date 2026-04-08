import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import AnimeDetails from "./pages/AnimeDetails";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/SearchPage";
import WatchParty from "./pages/WatchParty";
import PageTransition from "./components/PageTransition";
import SmoothScrolling from "./components/SmoothScrolling";
import NotificationToast from "./components/NotificationToast";

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          }
        />
        <Route
          path="/anime/:id"
          element={
            <PageTransition>
              <AnimeDetails />
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <AuthPage />
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PageTransition>
              <Dashboard />
            </PageTransition>
          }
        />
        <Route
          path="/search"
          element={
            <PageTransition>
              <SearchPage />
            </PageTransition>
          }
        />
        <Route
          path="/watch/:roomId"
          element={
            <PageTransition>
              <WatchParty />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <SmoothScrolling>
            <Router>
              <div className="min-h-screen bg-transparent text-gray-100 selection:bg-cyber-teal selection:text-white transition-colors duration-500">
                <Navbar />
                <main className="">
                  <AnimatedRoutes />
                </main>
                <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm backdrop-blur-md">
                  <p>
                    © {new Date().getFullYear()} LastEpisode. All rights
                    reserved.
                  </p>
                  <p className="mt-2 font-bold text-cyber-teal">
                    Made by Abhishek Verma
                  </p>
                </footer>
              </div>
            </Router>
            <NotificationToast />
          </SmoothScrolling>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
