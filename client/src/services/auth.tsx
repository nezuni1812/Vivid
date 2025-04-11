import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebaseConfig";

export const signInWithGoogle = async () => {
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
        await fetch("http://localhost:5000/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });

        localStorage.setItem("currentUser", JSON.stringify(userData));

        return userData;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};
