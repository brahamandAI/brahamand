import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First check localStorage for login status as a quick check
        const localLoginStatus = localStorage.getItem("isLoggedIn") === "1";
        
        // If we have a local login status, set it immediately
        if (localLoginStatus) {
          setIsLoggedIn(true);
        }
        
        // Still fetch from API to verify and get user details
        const response = await fetch("/api/auth/me", { credentials: "include" });
        const data = await response.json();
        
        if (data.userId) {
          setUser(data);
          setIsLoggedIn(true);
          // Ensure localStorage is in sync
          localStorage.setItem("isLoggedIn", "1");
        } else {
          setIsLoggedIn(false);
          // Clear localStorage if server says not logged in
          localStorage.removeItem("isLoggedIn");
        }
      } catch (error) {
        console.error("Auth Error:", error);
        setIsLoggedIn(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
