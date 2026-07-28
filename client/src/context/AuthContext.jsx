import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import {
  getStoredUser,
  getToken,
  removeStoredUser,
  removeToken,
  setStoredUser,
  setToken,
} from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setAuthToken] = useState(getToken());
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(!!getToken());

  const login = (nextToken, nextUser) => {
    setToken(nextToken);
    setAuthToken(nextToken);
    setStoredUser(nextUser);
    setUser(nextUser);
  };

  const logout = () => {
    removeToken();
    removeStoredUser();
    setAuthToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setLoading(false);
      return null;
    }

    try {
      const { data } = await api.get("/auth/me");
      setStoredUser(data.user);
      setUser(data.user);
      setAuthToken(currentToken);
      return data.user;
    } catch {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!token,
        role: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
