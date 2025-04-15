import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebaseConfig";

export const signInWithGoogle = async () => {
    localStorage.removeItem("accessToken")
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
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

        localStorage.setItem("currentUser", JSON.stringify(loginUser));
        // loginUser = {
        // "user_id":
        // "firebase_uid": 
        // "username": 
        // "email":
        // "role":
        // }
       
        return loginUser;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};
