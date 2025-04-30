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
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Sync context with Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const storedUser = localStorage.getItem("currentUser");
        const storedToken = localStorage.getItem("googleAccessToken");
        console.log("onAuthStateChanged storedUser:", storedUser); // Log storedUser
        console.log("onAuthStateChanged user.photoURL:", user.photoURL); // Log Firebase photoURL
        if (storedUser) {
          const loginUser = JSON.parse(storedUser);
          setIsSignedIn(true);
          setUserName(loginUser.username);
          setPhotoURL(user.photoURL || loginUser.photoURL || ""); // Prioritize Firebase user.photoURL
          setUserEmail(loginUser.email);
          setAccessToken(storedToken);
        } else {
          console.warn("No currentUser in localStorage");
          // Fallback to Firebase user data if localStorage is empty
          setIsSignedIn(true);
          setUserName(user.displayName);
          setPhotoURL(user.photoURL || "");
          setUserEmail(user.email);
          setAccessToken(null);
        }
      } else {
        setIsSignedIn(false);
        setUserName(null);
        setPhotoURL(null);
        setUserEmail(null);
        setAccessToken(null);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("googleAccessToken");
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const { accessToken: googleAccessToken, ...loginUser } = await signInWithGoogle();
      const user = auth.currentUser;
      console.log("AuthContext signIn loginUser:", loginUser); // Log loginUser
      console.log("AuthContext signIn user.photoURL:", user?.photoURL); // Log Firebase photoURL
      setIsSignedIn(true);
      setUserName(loginUser.username);
      setPhotoURL(user?.photoURL || loginUser.photoURL || "");
      setUserEmail(loginUser.email);
      setAccessToken(googleAccessToken || null);
    } catch (error) {
      console.error("Sign-in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setIsSignedIn(true);
      setUserName(null);
      setPhotoURL(null);
      setUserEmail(null);
      setAccessToken(null);
      localStorage.removeItem("currentUser");
      localStorage.removeItem("googleAccessToken");
    } catch (error) {
      console.error("Sign-out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ isSignedIn, userName, photoURL, userEmail, accessToken, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};