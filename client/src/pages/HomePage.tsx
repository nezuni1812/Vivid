"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FiPlus } from "react-icons/fi"
import { FaFolder } from "react-icons/fa"
import { gapi } from "gapi-script"
import { signInWithGoogle } from "../services/auth"
import { AllContent, CreatedContent, ProcessingContent, StatsContent } from "./tabsContent"
import { useNavigate } from "react-router-dom"

interface Workspace {
  _id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

const videos = [
  { title: "Video Title 1", thumbnail: "" },
  { title: "Video Title 2", thumbnail: "" },
  { title: "Video Title 3", thumbnail: "" },
  { title: "Long video titleeeeeeeee...", thumbnail: "" },
]

const HomePage = () => {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState("all")
  const [videoFile, setVideoFile] = useState(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isChannelSignedIn, setIsChannelSignedIn] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [accessToken, setAccessToken] = useState("")

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userName, setUserName] = useState("")
  const [photoURL, setPhotoURL] = useState("")

  // Workspace states
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("")
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0])
    }
  }

  const updateUserChannelInfo = (user: any) => {
    if (user && user.isSignedIn()) {
      const profile = user.getBasicProfile()
      setUserEmail(profile.getEmail())
      setIsChannelSignedIn(true)
    } else {
      setUserEmail("")
      setIsChannelSignedIn(false)
    }
  }

  // Load Google API client
  useEffect(() => {
    function start() {
      gapi.load("client:auth2", () => {
        gapi.client
          .init({
            clientId: import.meta.env.VITE_CLIENT_ID,
            scope:
              "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly",
          })
          .then(() => {
            setIsChannelSignedIn(gapi.auth2.getAuthInstance().isSignedIn.get())

            const auth = gapi.auth2.getAuthInstance()
            updateUserChannelInfo(auth.currentUser.get())

            // Lắng nghe khi thay đổi tài khoản
            auth.currentUser.listen(updateUserChannelInfo)
          })
      })
    }
    start()

    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      setUserName(parsed.username || "")
      setPhotoURL(parsed.photoURL || "")
    }

    // Fetch workspaces when component mounts
    fetchWorkspaces()
  }, [])

  // Fetch workspaces from MongoDB
  const fetchWorkspaces = async () => {
    setIsWorkspaceLoading(true)
    const storedUser = localStorage.getItem("currentUser")
    const userId = storedUser ? JSON.parse(storedUser).user_id : null
    // console.log("userId: ", userId)
    try {
      const response = await fetch(`http://localhost:5000/workspaces?user_id=${userId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
      const WorkspacesData = await response.json();

      setWorkspaces(WorkspacesData.map((w: any) => ({
        _id: w.id, 
        name: w.name,
        description: w.description,
        created_at: w.created_at,
        updated_at: w.updated_at,
      })))
    } catch (error) {
      console.error("Error fetching workspaces:", error)
    } finally {
      setIsWorkspaceLoading(false)
    }
  }

  // Create new workspace
  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      alert("Vui lòng nhập tên workspace")
      return
    }
    const storedUser = localStorage.getItem("currentUser")
    const userId = storedUser ? JSON.parse(storedUser).user_id : null
    try {
      const newWorkspace = {
        user_id: userId,
        name: newWorkspaceName,
        description: newWorkspaceDescription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const response = await fetch('http://localhost:5000/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      }
      setWorkspaces([...workspaces, newWorkspaceObj as Workspace])
      setIsCreateModalOpen(false)
      setNewWorkspaceName("")
      setNewWorkspaceDescription("")
    } catch (error) {
      console.error("Error creating workspace:", error)
    }
  }

  // Navigate to workspace page
  const navigateToWorkspace = (workspaceId: string) => {
    navigate(`/workspace/${workspaceId}`)
  }

  const changeGoogleAccount = async () => {
    try {
      const user = await signInWithGoogle()
      setUserName(user.username || "")
      setPhotoURL(user.photoURL || "")

      // Đăng xuât tài khoản kênh hiện tại
      const auth = gapi.auth2.getAuthInstance()
      auth.signOut()
      window.location.reload()
    } catch (error) {}
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("accessToken")
    gapi.auth2.getAuthInstance().signOut()
    window.location.href = "/" // Redirect về trang login
  }

  const handleChannelSignIn = async () => {
    const auth = gapi.auth2.getAuthInstance()
    await auth.signIn()

    const user = auth.currentUser.get()
    const authResponse = user.getAuthResponse()
    if (authResponse && authResponse.access_token) {
      setAccessToken(authResponse.access_token)
      localStorage.setItem("accessToken", authResponse.access_token)
    } else {
      console.error("Failed to get access token")
    }

    setIsChannelSignedIn(auth.isSignedIn.get())
  }

  async function checkYouTubeChannel() {
    const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id&mine=true", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    })
    const data = await response.json()

    if (data.items && data.items.length > 0) {
      return true // Có kênh
    } else {
      return false // Không có kênh
    }
  }

  const handleUpload = async () => {
    const hasChannel = await checkYouTubeChannel()

    if (!hasChannel) {
      alert("Your account does not have a YouTube channel. Please create one first.")
      window.open("https://www.youtube.com/create_channel", "_blank")
      return
    }

    // Nếu có kênh, tiếp tục upload video
    await uploadVideo()
  }

  // Upload video to YouTube
  const uploadVideo = async () => {
    if (!selectedFile) {
      alert("Please select a video file first.")
      return
    }

    const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token

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
    }

    const form = new FormData()
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
    form.append("file", selectedFile)

    try {
      const response = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        },
      )

      const data = await response.json()
      if (data.id) {
        alert("Upload successful! Video link: " + `https://www.youtube.com/watch?v=${data.id}`)
      } else {
        console.error("Upload failed:", data)
      }
    } catch (error) {
      console.error("Error uploading video:", error)
    }
  }

  const tabs = [
    { id: "all", label: "Tất cả", content: <AllContent /> },
    { id: "created", label: "Video đã tạo", content: <CreatedContent /> },
    { id: "processing", label: "Video đang xử lý", content: <ProcessingContent /> },
    { id: "stats", label: "Thống kê", content: <StatsContent /> },
  ]

  // Tìm tab đang active
  const activeTabData = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="absolute top-0 left-0 w-screen bg-gray-100 text-black text-center p-4 h-screen overflow-y-auto">
      {/* Header */}
      <header className="bg-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-8" />
          {/* <h1 className="text-xl font-bold">Vivid</h1> */}
        </div>
        <input type="text" placeholder="Tìm kiếm tên video" className="border p-2 rounded w-1/3" />
        <div className="relative">
          <div
            className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-lg cursor-pointer shadow-sm hover:bg-gray-200 transition"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <img src={photoURL || "/placeholder.svg"} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
            <span className="font-medium text-sm">{userName}</span>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 shadow-lg z-10 w-48 overflow-hidden pn-2 bg-white rounded">
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  changeGoogleAccount()
                }}
                className="px-4 py-2 text-sm text-left hover:bg-gray-200 w-full"
              >
                Thay đổi tài khoản
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  handleLogout()
                }}
                className="px-4 py-2 text-sm text-left hover:bg-gray-200 w-full"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Banner */}
      <div className="bg-gradient-to-r from-red-500 to-purple-500 text-white text-center p-6 mt-4 rounded-md">
        <h2 className="text-2xl font-bold">How can we help you today?</h2>
        <p> </p>
      </div>

      {/* Tabs and Actions */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex gap-6">
          {["all", "created", "processing", "stats"].map((tab) => (
            <button
              key={tab}
              className={`pb-2 font-semibold ${activeTab === tab ? "border-b-2 border-black" : "text-gray-500"}`}
              onClick={() => {
                if (tab === "stats") {
                  navigate("/channelStat", { state: { accessToken } })
                } else {
                  setActiveTab(tab)
                }
              }}
            >
              {tab === "all"
                ? "Tất cả"
                : tab === "created"
                  ? "Video đã tạo"
                  : tab === "processing"
                    ? "Video đang xử lý"
                    : "Thống kê"}
            </button>
          ))}
        </div>
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">YouTube Video Upload</h1>

          {!isChannelSignedIn ? (
            <button onClick={handleChannelSignIn} className="px-4 py-2 bg-blue-500 text-black rounded">
              Sign in with Google
            </button>
          ) : (
            <>
              <p>Tài khoản: {userEmail}</p>
              <input type="file" accept="video/*" onChange={handleFileChange} className="mb-2" />
              <button onClick={handleUpload} className="px-4 py-2 bg-green-500 text-black rounded">
                Upload to YouTube
              </button>

              <button onClick={handleChannelSignIn} className="bg-red-500 text-black px-4 py-2 rounded m-2">
                Chuyển tài khoản
              </button>
            </>
          )}
        </div>
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
                    <h4 className="font-semibold text-lg text-left">{workspace.name}</h4>
                    <p className="text-gray-600 text-sm mt-1 text-left line-clamp-2">{workspace.description}</p>
                  </div>
                  <FaFolder className="text-purple-600 text-xl" />
                </div>
                <div className="mt-4 text-xs text-gray-500 text-left">Tạo ngày: {formatDate(workspace.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Sections */}
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
      </div>

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Tạo Workspace mới</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Tên workspace</label>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Nhập tên workspace"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Mô tả</label>
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
  )
}

export default HomePage
