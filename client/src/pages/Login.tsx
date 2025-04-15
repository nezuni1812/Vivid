import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { FcGoogle } from "react-icons/fc"; // Import icon Google
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { signInWithGoogle } from "../services/auth";
const Home = () => {
    const navigate = useNavigate();
    const handleGoogleLogin = async () => {
        try {
            const user = await signInWithGoogle();
            
            navigate("/homepage");
        } catch (error) {
            alert("Đăng nhập thất bại!");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md text-center">
                <h1 className="text-2xl font-bold mb-4">Welcome to Vivid </h1>
                <h2 className="text-xl font-semibold mb-4">An AI video Generator</h2>
                <p className="mb-6">Please log in to continue</p>
                <button
                    onClick={handleGoogleLogin}
                    className="flex items-center gap-2 text-black rounded hover:bg-blue-600 mx-auto"
                >
                    <FcGoogle className="text-xl" /> {/*Icon Google*/}
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default Home;