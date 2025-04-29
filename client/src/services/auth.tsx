import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebaseConfig";

export const signInWithGoogle = async () => {
  localStorage.removeItem("accessToken");
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/youtube.upload"); // Add YouTube scope

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken; // Extract Google OAuth accessToken

    const userData = {
      firebase_uid: user.uid,
      username: user.displayName || "None",
      email: user.email,
      photoURL: user.photoURL || "",
    };

        // Gửi thông tin lên server
        const response = await fetch("http://localhost:5000/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });
        const loginUser = await response.json();

    // Lưu accessToken vào localStorage nếu cần
    if (accessToken) {
      localStorage.setItem("googleAccessToken", accessToken);
    }

    localStorage.setItem("currentUser", JSON.stringify(loginUser));
    return { ...loginUser, accessToken }; // Trả về accessToken cùng với loginUser
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};