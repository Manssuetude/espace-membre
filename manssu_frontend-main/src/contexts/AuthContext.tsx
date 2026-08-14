import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "../services/api/auth";
import { usersApi } from "../services/api/users";
import { User } from "../types/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  sendOTP: (email: string) => Promise<void>;
  sendOTPForInvite: (code: string) => Promise<void>;
  registerGuest: (code: string, firstName: string, lastName: string, otp: string) => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider, splitting would ripple across many import sites
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user profile on mount if token exists
    const fetchUserProfile = async () => {
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        try {
          // Fetch fresh user profile from API to validate token and get latest data
          const response = await usersApi.getCurrentUserProfile();

          if (response.success && response.data) {
            const userData = response.data;

            // Compute name from firstName and lastName if not provided
            const userWithName = {
              ...userData,
              name: userData.name || `${userData.firstName} ${userData.lastName}`.trim(),
            };

            // Update localStorage with fresh data
            localStorage.setItem("user", JSON.stringify(userWithName));
            setUser(userWithName);
          } else {
            // Invalid response, clear auth data
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setUser(null);
          }
        } catch (error) {
          // Token invalid or expired, clear auth data
          console.error("Failed to fetch user profile:", error);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    fetchUserProfile();
  }, []);

  const sendOTP = async (email: string) => {
    const response = await authApi.sendOTP({ email });
    if (!response.success) {
      throw new Error(response.message || "Erreur lors de l'envoi du code OTP");
    }
  };

  const sendOTPForInvite = async (code: string) => {
    const response = await authApi.sendOTPForInvite(code);
    if (!response.success) {
      throw new Error(response.message || "Erreur lors de l'envoi du code OTP");
    }
  };

  const registerGuest = async (code: string, firstName: string, lastName: string, otp: string) => {
    const response = await authApi.registerGuest({ code, firstName, lastName, otp });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Erreur lors de l'inscription");
    }

    const { user: userData, accessToken } = response.data;

    // Compute name from firstName and lastName if not provided
    const userWithName = {
      ...userData,
      name: userData.name || `${userData.firstName} ${userData.lastName}`.trim(),
    };

    localStorage.setItem("user", JSON.stringify(userWithName));
    localStorage.setItem("token", accessToken);
    setUser(userWithName);
  };

  const login = async (email: string, otp: string) => {
    const response = await authApi.verifyOTP({ email, otp });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Erreur lors de la connexion");
    }

    const { user: userData, accessToken } = response.data;

    // Compute name from firstName and lastName if not provided
    const userWithName = {
      ...userData,
      name: userData.name || `${userData.firstName} ${userData.lastName}`.trim(),
    };

    localStorage.setItem("user", JSON.stringify(userWithName));
    localStorage.setItem("token", accessToken);
    setUser(userWithName);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        sendOTP,
        sendOTPForInvite,
        registerGuest,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
