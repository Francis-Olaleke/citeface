
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthUser,
  type LoginData,
  type RegisterData,
} from "../services/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginData) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      setUser(null);

      if (
        err instanceof Error &&
        "status" in err &&
        err.status !== 401
      ) {
        setError(err.message);
        return;
      }

      setError(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser();

        if (active) {
          setUser(currentUser);
          setError(null);
        }
      } catch (err) {
        if (!active) return;

        setUser(null);

        if (
          err instanceof Error &&
          "status" in err &&
          err.status !== 401
        ) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  async function login(credentials: LoginData) {
    const response = await loginUser(credentials);
    setUser(response.user);
    setError(null);
  }

  async function register(userData: RegisterData) {
    const response = await registerUser(userData);
    setUser(response.user);
    setError(null);
  }

  async function logout() {
    await logoutUser();
    setUser(null);
    setError(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
