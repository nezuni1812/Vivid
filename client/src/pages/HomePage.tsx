import { useState, useEffect } from "react";
import { FiSettings } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaUpload } from "react-icons/fa";
import { gapi } from "gapi-script";

const videos = [
    { title: "Video Title 1", thumbnail: "" },
    { title: "Video Title 2", thumbnail: "" },
    { title: "Video Title 3", thumbnail: "" },
    { title: "Long video titleeeeeeeee...", thumbnail: "" },
];

const HomePage = () => {
    const [activeTab, setActiveTab] = useState("all");
    const [videoFile, setVideoFile] = useState(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [accessToken, setAccessToken] = useState("");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const updateUserInfo = (user: any) => {
        if (user && user.isSignedIn()) {
            const profile = user.getBasicProfile();
            setUserEmail(profile.getEmail());
            setIsSignedIn(true);
        } else {
            setUserEmail("");
            setIsSignedIn(false);
        }
    };

    // Load Google API client
    useEffect(() => {
        function start() {
            gapi.load("client:auth2", () => {
                gapi.client
                    .init({
                        clientId: import.meta.env.VITE_CLIENT_ID,
                        scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
                    })
                    .then(() => {
                        setIsSignedIn(gapi.auth2.getAuthInstance().isSignedIn.get());
                        
                        const auth = gapi.auth2.getAuthInstance();
                        updateUserInfo(auth.currentUser.get());

                        // Lắng nghe khi thay đổi tài khoản
                        auth.currentUser.listen(updateUserInfo);
                    });
            });
        }
        start();
    }, []);

    const handleSignIn = async () => {
        const auth = gapi.auth2.getAuthInstance();
        await auth.signIn();

        const user = auth.currentUser.get();
        const authResponse = user.getAuthResponse();
        if (authResponse && authResponse.access_token) {
            setAccessToken(authResponse.access_token);
        } else {
            console.error("Failed to get access token");
        }

        setIsSignedIn(auth.isSignedIn.get());
    };

    async function checkYouTubeChannel() {
        const response = await fetch(
            "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/json",
                },
            }
        );
        const data = await response.json();
    
        if (data.items && data.items.length > 0) {
            return true; // Có kênh
        } else {
            return false; // Không có kênh
        }
    }
    const handleUpload = async () => {
        const hasChannel = await checkYouTubeChannel();
    
        if (!hasChannel) {
            alert("Your account does not have a YouTube channel. Please create one first.");
            window.open("https://www.youtube.com/create_channel", "_blank");
            return;
        }
    
        // Nếu có kênh, tiếp tục upload video
        await uploadVideo();
    };

    // Upload video to YouTube
    const uploadVideo = async () => {
        if (!selectedFile) {
            alert("Please select a video file first.");
            return;
        }

        const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        
        // Thay đổi thông tin video ở đây
        const metadata = {
            snippet: {
                title: "Demo video", // tên video
                description: "This is a test video upload via YouTube API.", // mô tả video
                tags: ["API", "Video Generation", "test", "AI"], // tags video
                // categoryId: "",  // danh mục video
            },
            status: {
                privacyStatus: "private", // trạng thái video(public, private, unlisted)
            },
        };

        const form = new FormData();
        form.append(
            "metadata",
            new Blob([JSON.stringify(metadata)], { type: "application/json" })
        );
        form.append("file", selectedFile);

        try {
            const response = await fetch(
                "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: form,
                }
            );

            const data = await response.json();
            if (data.id) {
                alert("Upload successful! Video link: " + `https://www.youtube.com/watch?v=${data.id}`);
            } else {
                console.error("Upload failed:", data);
            }
        } catch (error) {
            console.error("Error uploading video:", error);
        }
    };
    

    return (
        <div className="absolute top-0 left-0 w-screen bg-gray-100 text-black text-center p-4 h-screen overflow-y-auto">
            {/* Header */}
            <header className="bg-white p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="h-8" />
                    {/* <h1 className="text-xl font-bold">Vivid</h1> */}
                </div>
                <input
                    type="text"
                    placeholder="Tìm kiếm tên video"
                    className="border p-2 rounded w-1/3"
                />
                <div className="flex items-center gap-4">
                    <FiSettings className="text-xl cursor-pointer" />
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded">
                        {/* <FcGoogle className="text-xl" /> */}
                        <span>Tên người dùng</span>
                    </div>
                </div>
            </header>

            {/* Banner */}
            <div className="bg-gradient-to-r from-red-500 to-purple-500 text-white text-center p-6 mt-4 rounded-md">
                <h2 className="text-2xl font-bold">How can we help you today?</h2>
                <p>abc xyz 123</p>
            </div>

            {/* Tabs and Actions */}
            <div className="flex justify-between items-center p-4 border-b">
                <div className="flex gap-6">
                    {["all", "created", "processing", "stats"].map((tab, index) => (
                        <button
                            key={tab}
                            className={`pb-2 font-semibold ${activeTab === tab ? "border-b-2 border-black" : "text-gray-500"}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === "all" ? "Tất cả" : tab === "created" ? "Video đã tạo" : tab === "processing" ? "Video đang xử lý" : "Thống kê"}
                        </button>
                    ))}
                </div>
                <div className="p-4">
                    <h1 className="text-xl font-bold mb-4">YouTube Video Upload</h1>

                    {!isSignedIn ? (
                        <button onClick={handleSignIn} className="px-4 py-2 bg-blue-500 text-black rounded">
                            Sign in with Google
                        </button>
                    ) : (
                        <>
                            <p>Tài khoản: {userEmail}</p>
                            <input type="file" accept="video/*" onChange={handleFileChange} className="mb-2" />
                            <button onClick={handleUpload} className="px-4 py-2 bg-green-500 text-black rounded">
                                Upload to YouTube
                            </button>

                            <button onClick={handleSignIn} className="bg-red-500 text-black px-4 py-2 rounded m-2">
                                Chuyển tài khoản
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Video Sections */}
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Video gần đây</h3>
                <div className="grid grid-cols-4 gap-4">
                    {videos.map((video, index) => (
                        <div key={index} className="bg-white p-2 rounded shadow-md">
                            <img src={video.thumbnail} alt={video.title} className="w-full rounded" />
                            <p className="text-sm mt-2">{video.title}</p>
                        </div>
                    ))}
                </div>

                <h3 className="text-lg font-semibold mt-6 mb-2">Video nổi bật</h3>
                <div className="grid grid-cols-4 gap-4">
                    {videos.map((video, index) => (
                        <div key={index} className="bg-white p-2 rounded shadow-md">
                            <img src={video.thumbnail} alt={video.title} className="w-full rounded" />
                            <p className="text-sm mt-2">{video.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
