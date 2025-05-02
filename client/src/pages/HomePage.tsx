"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import { FaFolder } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Video, BarChart2 } from "lucide-react";
import VideoList from "../components/video-list";
import StatsChart from "../components/stats-chart";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import FacebookUploader from "../components/facebook-upload";
import TikTokLogin from "../pages/TikTokLogin";

import {
  AllContent,
  CreatedContent,
  ProcessingContent
} from "./tabsContent";

interface Workspace {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const videos = [
  { title: "Video Title 1", thumbnail: "" },
  { title: "Video Title 2", thumbnail: "" },
  { title: "Video Title 3", thumbnail: "" },
  { title: "Long video titleeeeeeeee...", thumbnail: "" },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, userEmail, accessToken, signIn } = useAuth();

  const [activeTab, setActiveTab] = useState("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Fetch workspaces from MongoDB
  const fetchWorkspaces = async () => {
    setIsWorkspaceLoading(true);
    const storedUser = localStorage.getItem("currentUser");
    const userId = storedUser ? JSON.parse(storedUser).user_id : null;
    try {
      const response = await fetch(
        `http://localhost:5000/workspaces?user_id=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const WorkspacesData = await response.json();

      setWorkspaces(
        WorkspacesData.map((w: any) => ({
          _id: w.id,
          name: w.name,
          description: w.description,
          created_at: w.created_at,
          updated_at: w.updated_at,
        }))
      );
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  // Create new workspace
  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      alert("Vui lòng nhập tên workspace");
      return;
    }
    const storedUser = localStorage.getItem("currentUser");
    const userId = storedUser ? JSON.parse(storedUser).user_id : null;
    try {
      const newWorkspace = {
        user_id: userId,
        name: newWorkspaceName,
        description: newWorkspaceDescription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response = await fetch("http://localhost:5000/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWorkspace),
      });
      const data = await response.json();
      const newWorkspaceObj: Workspace = {
        _id: data.id,
        name: newWorkspace.name,
        description: newWorkspace.description,
        created_at: newWorkspace.created_at,
        updated_at: newWorkspace.updated_at,
      };
      setWorkspaces([...workspaces, newWorkspaceObj]);
      setIsCreateModalOpen(false);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
    } catch (error) {
      console.error("Error creating workspace:", error);
    }
  };

  // Navigate to workspace page
  const navigateToWorkspace = (workspaceId: string) => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleChannelSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error("Error signing in:", error);
      alert("Failed to sign in. Please try again.");
    }
  };

  async function checkYouTubeChannel() {
    if (!accessToken) {
      console.error("No access token available");
      return false;
    }

    try {
      console.log("Checking YouTube channel with accessToken:", accessToken);
      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true&maxResults=50",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );
      const data = await response.json();
      console.log("YouTube API Response:", data);

      if (!response.ok) {
        console.error("API Error:", data.error?.message || "Unknown error", data.error?.code);
        if (data.error?.code === 401) {
          console.warn("Invalid or expired access token. Triggering re-authentication.");
          await handleChannelSignIn();
        }
        return false;
      }

      if (data.items && data.items.length > 0) {
        console.log(
          "Found channels:",
          data.items.map((item: any) => item.snippet.title)
        );
        return true;
      }
      console.warn("No channels found for this account.");
      return false;
    } catch (error) {
      console.error("Error checking YouTube channel:", error);
      return false;
    }
  }

  const handleUpload = async () => {
    if (!isSignedIn || !accessToken) {
      await handleChannelSignIn();
      return;
    }

    const hasChannel = await checkYouTubeChannel();

    if (!hasChannel) {
      alert(
        "Your account does not have a YouTube channel. Please create one first."
      );
      window.open("https://www.youtube.com/create_channel", "_blank");
      return;
    }

    // Nếu có kênh, tiếp tục upload video
    await uploadVideo();
  };

  // Upload video to YouTube
  const uploadVideo = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn một tệp video trước.");
      return;
    }

    const metadata = {
      snippet: {
        title: "Demo video",
        description: "This is a test video upload via YouTube API.",
        tags: ["API", "Video Generation", "test", "AI"],
      },
      status: {
        privacyStatus: "private",
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
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        }
      );

      const data = await response.json();
      if (data.id) {
        alert(
          "Tải lên thành công! Link video: " +
            `https://www.youtube.com/watch?v=${data.id}`
        );
      } else {
        console.error("Upload failed:", data);
        alert("Tải lên thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Lỗi khi tải lên video. Vui lòng thử lại.");
    }
  };

  const tabs = [
    { id: "all", label: "Tất cả", content: <AllContent /> },
    { id: "created", label: "Video đã tạo", content: <CreatedContent /> },
    {
      id: "processing",
      label: "Video đang xử lý",
      content: <ProcessingContent />,
    }
  ];

  // Tìm tab đang active
  const activeTabData = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return (
    <div className="w-full bg-gray-100 text-black text-center p-4 min-h-screen overflow-y-auto">
      {/* Tabs and Actions */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex gap-6">
          {["all", "created", "processing", "stats"].map((tab) => (
            <button
              key={tab}
              className={`pb-2 font-semibold ${
                activeTab === tab ? "border-b-2 border-black" : "text-gray-500"
              }`}
              onClick={() => {
                if (tab === "stats") {
                  navigate("/channelStat", { state: { accessToken } });
                } else {
                  setActiveTab(tab);
                }
              }}
            >
              {tab === "all"
                ? "Tất cả"
                : tab === "created"
                ? "Video đã tạo"
                : tab === "processing"
                ? "Video đang xử lý" : ""}
            </button>
          ))}
        </div>
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Video Upload</h1>
          {!isSignedIn ? (
            <button
              onClick={handleChannelSignIn}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Sign in with Google
            </button>
          ) : (
            <>
              <p>Tài khoản: {userEmail}</p>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="mb-2"
              />
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-green-500 text-black rounded"
              >
                Upload to YouTube
              </button>

              {/* <button
                onClick={handleChannelSignIn}
                className="bg-red-500 text-black px-4 py-2 rounded m-2"
              >
                Chuyển tài khoản
              </button> */}
            </>
          )}
        </div>
        <FacebookUploader />
        {/* <button
          onClick={() => navigate("/facebook-stats")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Xem thống kê Facebook Page
        </button> */}
        <TikTokLogin/>
      </div>

      {/* Workspace Section */}
      <div className="p-6 bg-white rounded-lg shadow-md mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Workspaces</h3>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-purple-600 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-purple-700 transition"
          >
            <FiPlus /> Tạo Workspace
          </button>
        </div>

        {isWorkspaceLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaFolder className="mx-auto text-4xl mb-2" />
            <p>Bạn chưa có workspace nào. Hãy tạo workspace đầu tiên!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => (
              <div
                key={workspace._id}
                onClick={() => navigateToWorkspace(workspace._id)}
                className="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer bg-gray-50 hover:bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-left">
                      {workspace.name}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1 text-left line-clamp-2">
                      {workspace.description}
                    </p>
                  </div>
                  <FaFolder className="text-purple-600 text-xl" />
                </div>
                <div className="mt-4 text-xs text-gray-500 text-left">
                  Tạo ngày: {formatDate(workspace.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Tổng số Video</CardTitle>
            <CardDescription>Số lượng video đã tạo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Video className="h-8 w-8 text-green-500 mr-3" />
              <span className="text-3xl font-bold">24</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Lượt xem YouTube</CardTitle>
            <CardDescription>Tổng lượt xem trên YouTube</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart2 className="h-8 w-8 text-red-500 mr-3" />
              <span className="text-3xl font-bold">12,458</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Lượt xem TikTok</CardTitle>
            <CardDescription>Tổng lượt xem trên TikTok</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart2 className="h-8 w-8 text-blue-500 mr-3" />
              <span className="text-3xl font-bold">35,721</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">Video gần đây</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video, index) => (
            <div key={index} className="bg-white p-2 rounded shadow-md">
              <img
                src={video.thumbnail || "/placeholder.svg?height=120&width=240"}
                alt={video.title}
                className="w-full h-32 object-cover rounded bg-gray-200"
              />
              <p className="text-sm mt-2 truncate">{video.title}</p>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-2">Video nổi bật</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video, index) => (
            <div key={index} className="bg-white p-2 rounded shadow-md">
              <img
                src={video.thumbnail || "/placeholder.svg?height=120&width=240"}
                alt={video.title}
                className="w-full h-32 object-cover rounded bg-gray-200"
              />
              <p className="text-sm mt-2 truncate">{video.title}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Video của bạn</CardTitle>
                <CardDescription>
                  Danh sách các video đã tạo và đang xử lý
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoList />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Hiệu suất</CardTitle>
                <CardDescription>
                  Thống kê hiệu suất video theo thời gian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatsChart />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Tạo Workspace mới</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                Tên workspace
              </label>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Nhập tên workspace"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                Mô tả
              </label>
              <textarea
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Nhập mô tả (không bắt buộc)"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={createWorkspace}
                className="px-4 py-2 bg-purple-600 rounded-md hover:bg-purple-700"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
