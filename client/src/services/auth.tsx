import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebaseConfig";

export const signInWithGoogle = async () => {
  localStorage.removeItem("accessToken");
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/youtube.readonly");
  provider.addScope("https://www.googleapis.com/auth/youtube.upload");
  provider.addScope("https://www.googleapis.com/auth/yt-analytics.readonly");

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (!accessToken) {
      throw new Error("Failed to obtain Google access token");
    }

    const userData = {
      firebase_uid: user.uid,
      username: user.displayName || "None",
      email: user.email,
      photoURL: user.photoURL || "",
    };

    // Send user data to backend
    const response = await fetch("http://localhost:5000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to register user with backend");
    }

    const loginUser = await response.json();

    // Store in localStorage
    localStorage.setItem("currentUser", JSON.stringify(loginUser));
    localStorage.setItem("googleAccessToken", accessToken);

    // Return both backend and Firebase data
    return {
      user_id: loginUser.user_id,
      firebase_uid: loginUser.firebase_uid,
      username: user.displayName || loginUser.username,
      email: user.email || loginUser.email,
      photoURL: user.photoURL || loginUser.photoURL || "",
      accessToken,
    };
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};
