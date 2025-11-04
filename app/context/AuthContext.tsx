"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";


type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType:"farmer" | "individual" | "business";
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    twoFactorCode?: string
  ) => Promise<{ success: boolean; requires2FA?: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}


const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  logout: () => {},
  checkAuth: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    try {
      
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        return false;
      }

      const response = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (!response.ok) {
        
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        return false;
      }

      const userData = await response.json();
      setToken(storedToken);
      setUser(userData.user);
      return true;
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    }
  };

  
  const login = async (
    email: string,
    password: string,
    twoFactorCode?: string
  ): Promise<{ success: boolean; requires2FA?: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/login/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, twoFactorCode }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        
        router.push("/dashboard");
        return { success: true };
      } else if (response.status === 401 && data.requires2FA) {
        
        return { success: false, requires2FA: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/registration-type");
  };

  
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);
