import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth } from "../firebaseConfig";
import { signInWithGoogle } from "../services/auth";
import { onAuthStateChanged } from "firebase/auth";

interface AuthContextType {
  isSignedIn: boolean;
  userName: string | null;
  photoURL: string | null;
  userEmail: string | null;
  accessToken: string | null;
  userId: string | null; 
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync context with Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        try {
          // Retrieve backend data from localStorage
          const currentUser = localStorage.getItem("currentUser");
          const googleAccessToken = localStorage.getItem("googleAccessToken");

          if (!currentUser || !googleAccessToken) {
            console.warn("Missing user data or access token, re-authentication required.");
            setIsSignedIn(false);
            setUserName(null);
            setPhotoURL(null);
            setUserEmail(null);
            setAccessToken(null);
            setUserId(null);
            localStorage.removeItem("currentUser");
            localStorage.removeItem("googleAccessToken");
            setIsLoading(false);
            return;
          }

          const parsedUser = JSON.parse(currentUser);

          // Use Firebase user object for client-side data
          setIsSignedIn(true);
          setUserName(user.displayName);
          setPhotoURL(user.photoURL || "");
          setUserEmail(user.email);
          setAccessToken(googleAccessToken);
          setUserId(parsedUser.user_id);
        } catch (error) {
          console.error("Error syncing user data:", error);
          setIsSignedIn(false);
          setUserName(null);
          setPhotoURL(null);
          setUserEmail(null);
          setAccessToken(null);
          setUserId(null);
          localStorage.removeItem("currentUser");
          localStorage.removeItem("googleAccessToken");
        }
      } else {
        setIsSignedIn(false);
        setUserName(null);
        setPhotoURL(null);
        setUserEmail(null);
        setAccessToken(null);
        setUserId(null);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("googleAccessToken");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const loginUser = await signInWithGoogle();
      setIsSignedIn(true);
      setUserName(loginUser.username);
      setPhotoURL(loginUser.photoURL);
      setUserEmail(loginUser.email);
      setAccessToken(loginUser.accessToken);
      setUserId(loginUser.user_id);
    } catch (error) {
      console.error("Sign-in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setIsSignedIn(false);
      setUserName(null);
      setPhotoURL(null);
      setUserEmail(null);
      setAccessToken(null);
      setUserId(null);
      localStorage.removeItem("currentUser");
      localStorage.removeItem("googleAccessToken");
    } catch (error) {
      console.error("Sign-out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isSignedIn,
        userName,
        photoURL,
        userEmail,
        accessToken,
        userId,
        signIn,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider, useAuth };