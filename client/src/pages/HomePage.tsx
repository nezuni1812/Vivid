import { useState } from "react";
import { FiSettings } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

const videos = [
    { title: "Video Title 1", thumbnail: "" },
    { title: "Video Title 2", thumbnail: "" },
    { title: "Video Title 3", thumbnail: "" },
    { title: "Long video titleeeeeeeee...", thumbnail: "" },
];

const HomePage = () => {
    const [activeTab, setActiveTab] = useState("all");

    return (
        <div className="absolute top-0 left-0 w-screen bg-gray-500 text-black text-center p-4 h-screen overflow-y-auto">
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

            {/* Tabs */}
            <div className="flex gap-6 p-4 border-b">
                {[
                    { id: "all", label: "Tất cả" },
                    { id: "created", label: "Video đã tạo" },
                    { id: "processing", label: "Video đang xử lý" },
                    { id: "stats", label: "Thống kê" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        className={`pb-2 font-semibold ${activeTab === tab.id ? "border-b-2 border-black" : "text-gray-500"}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
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
