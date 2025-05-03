"use client";

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { FiPlus } from "react-icons/fi"
import { FaFolder, FaTiktok, FaFacebook, FaYoutube, FaUserCircle } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import { House } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Video, CheckCircle, Eye, Calendar, RefreshCw, LinkIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import FacebookUploader from "../components/facebook-upload";
import TikTokLogin from "../pages/TikTokLogin";

interface Workspace {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Định nghĩa interface cho clips (video từ workspace)
interface Clip {
  _id: string
  workspace_id: string
  prompt: string
  clip_url: string
  status: "processing" | "completed"
  created_at: string
  updated_at: string
  thumbnail?: string
}

// Định nghĩa interface cho published_clips (video đã xuất bản)
interface PublishedClip {
  _id: string;
  clip_id: string;
  platform: "YouTube" | "Facebook" | "TikTok";
  external_id: string;
  url: string;
  metadata: string;
  published_at: string;
  views?: number;
  title?: string;
  thumbnail?: string;
  originalClip?: Clip;
}

interface YouTubeUserInfo {
  avatar_url: string;
  username: string;
}

interface TikTokUserInfo {
  open_id: string;
  union_id: string;
  avatar_url: string;
  display_name: string;
  username: string;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface UserAuth {
  isLoggedIn: boolean;
  pages: FacebookPage[];
  selectedPageId?: string;
}

const LOCAL_STORAGE_KEY = "facebook_stats_auth";

const HomePage = () => {
  const navigate = useNavigate();
  const { isSignedIn, userEmail, accessToken, signIn } = useAuth();

  const [activeTab, setActiveTab] = useState("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [publishedClips, setPublishedClips] = useState<PublishedClip[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [isClipsLoading, setIsClipsLoading] = useState(false);
  const [isPublishedClipsLoading, setIsPublishedClipsLoading] = useState(false);
  const [isUploadHovered, setIsUploadHovered] = useState(false);
  const [isChannelsHovered, setIsChannelsHovered] = useState(false);
  const [isSdkLoaded, setSdkLoaded] = useState(false);
  const [youtubeUserInfo, setYoutubeUserInfo] = useState<YouTubeUserInfo | null>(null);
  const [tiktokUserInfo, setTikTokUserInfo] = useState<TikTokUserInfo | null>(null);
  const [authState, setAuthState] = useState<UserAuth>({ isLoggedIn: false, pages: [] });
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function getFacebookAccessTokenFromLocalStorage(): string | null {
    const savedAuth = localStorage.getItem("facebook_stats_auth");
    if (!savedAuth) return null;
  
    try {
      const parsedAuth = JSON.parse(savedAuth);
      const selectedPage = parsedAuth.pages.find(
        (p: any) => p.id === parsedAuth.selectedPageId
      );
      return selectedPage?.access_token || null;
    } catch (e) {
      console.error("Failed to parse Facebook auth from localStorage:", e);
      return null;
    }
  }  

  const facebookAccessToken = getFacebookAccessTokenFromLocalStorage();
  const tiktokAccessToken = localStorage.getItem("tiktok_access_token");

  const completedClips = clips.filter((clip) => clip.status === "completed")
  const processingClips = clips.filter((clip) => clip.status === "processing")

  const allContent = [
    ...clips,
    ...publishedClips.map((pc) => ({
      ...pc,
      isPublished: true,
    })),
  ]

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
        })),
      )
    } catch (error) {
      console.error("Error fetching workspaces:", error)
    } finally {
      setIsWorkspaceLoading(false)
    }
  }

  const fetchClips = async () => {
    setIsClipsLoading(true);
    try {
      const storedUser = localStorage.getItem("currentUser");
      const userId = storedUser ? JSON.parse(storedUser).user_id : null;
  
      if (!userId) {
        throw new Error("User ID not found");
      }
  
      const response = await fetch(`http://localhost:5000/clips?user_id=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch clips");
      }
  
      const data = await response.json();
  
      const formattedClips: Clip[] = data.map((clip: any) => ({
        _id: clip.clip_id,
        workspace_id: clip.workspace_id,
        prompt: clip.prompt,
        clip_url: clip.clip_url,
        status: clip.status,
        created_at: clip.created_at,
        updated_at: clip.updated_at,
        thumbnail: clip.thumbnail || "/placeholder.svg?height=120&width=240",
      }));
  
      setClips(formattedClips);
    } catch (error) {
      console.error("Error fetching clips:", error);
    } finally {
      setIsClipsLoading(false);
    }
  };

  const fetchPublishedClips = async () => {
    setIsPublishedClipsLoading(true);
    try {
      const storedUser = localStorage.getItem("currentUser");
      const userId = storedUser ? JSON.parse(storedUser).user_id : null;
  
      if (!userId) {
        throw new Error("User ID not found");
      }
  
      const response = await fetch(`http://localhost:5000/published-clips?user_id=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch published clips");
      }
  
      const publishedClipsData = await response.json();
  
      const enrichedPublishedClips: PublishedClip[] = await Promise.all(
        publishedClipsData.map(async (publishedClip: any) => {
          let title = "Video không có tiêu đề";
          let thumbnail = "/placeholder.svg?height=120&width=240";
          let views = 0;
  
          const clipResponse = await fetch(`http://localhost:5000/clips/${publishedClip.clip_id}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
  
          let originalClip: Clip | undefined;
          if (clipResponse.ok) {
            const clipData = await clipResponse.json();
            originalClip = {
              _id: clipData.clip_id,
              workspace_id: clipData.workspace_id,
              prompt: clipData.prompt,
              clip_url: clipData.clip_url,
              status: clipData.status,
              created_at: clipData.created_at,
              updated_at: clipData.updated_at,
              thumbnail: clipData.thumbnail || thumbnail,
            };
          }
  
          if (publishedClip.platform === "YouTube" && !accessToken) {
            // console.warn("No YouTube access token available");
            return {
              _id: publishedClip.published_clip_id || publishedClip._id,
              clip_id: publishedClip.clip_id,
              platform: publishedClip.platform,
              external_id: publishedClip.external_id,
              url: publishedClip.url,
              metadata: publishedClip.metadata,
              published_at: publishedClip.published_at,
              views,
              title,
              thumbnail,
              originalClip,
            };
          }
  
          if (publishedClip.platform === "Facebook" && !facebookAccessToken) {
            // console.warn("No Facebook access token available");
            return {
              _id: publishedClip.published_clip_id || publishedClip._id,
              clip_id: publishedClip.clip_id,
              platform: publishedClip.platform,
              external_id: publishedClip.external_id,
              url: publishedClip.url,
              metadata: publishedClip.metadata,
              published_at: publishedClip.published_at,
              views,
              title,
              thumbnail,
              originalClip,
            };
          }
  
          if (publishedClip.platform === "TikTok" && !tiktokAccessToken) {
            // console.warn("No TikTok access token available");
            return {
              _id: publishedClip.published_clip_id || publishedClip._id,
              clip_id: publishedClip.clip_id,
              platform: publishedClip.platform,
              external_id: publishedClip.external_id,
              url: publishedClip.url,
              metadata: publishedClip.metadata,
              published_at: publishedClip.published_at,
              views,
              title,
              thumbnail,
              originalClip,
            };
          }
  
          // Gọi API cho YouTube
          if (publishedClip.platform === "YouTube" && accessToken) {
            try {
              const youtubeResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${publishedClip.external_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );
              if (!youtubeResponse.ok) {
                throw new Error(`YouTube API error: ${youtubeResponse.statusText}`);
              }
              const youtubeData = await youtubeResponse.json();
              if (youtubeData.items && youtubeData.items.length > 0) {
                const video = youtubeData.items[0];
                title = video.snippet.title || title;
                thumbnail = video.snippet.thumbnails?.medium?.url || thumbnail;
                views = parseInt(video.statistics.viewCount || "0");
              } else {
                console.warn(`No YouTube video found for ID: ${publishedClip.external_id}`);
              }
            } catch (error) {
              console.error(`Error fetching YouTube video ${publishedClip.external_id}:`, error);
            }
          }
  
          // Gọi API cho Facebook
          if (publishedClip.platform === "Facebook" && facebookAccessToken) {
            try {
              const facebookResponse = await fetch(
                `https://graph.facebook.com/v19.0/${publishedClip.external_id}?fields=title,picture,video_insights{name,values}&access_token=${facebookAccessToken}`
              );
              if (!facebookResponse.ok) {
                throw new Error(`Facebook API error: ${facebookResponse.statusText}`);
              }
              const facebookData = await facebookResponse.json();
              title = facebookData.title || title;
              thumbnail = facebookData.picture || thumbnail;
              const viewsInsight = facebookData.video_insights?.data?.find(
                (insight: any) => insight.name === "total_video_views"
              );
              views = viewsInsight ? viewsInsight.values[0].value : 0;
            } catch (error) {
              console.error(`Error fetching Facebook video ${publishedClip.external_id}:`, error);
            }
          }
  
          // Gọi API cho TikTok
          if (publishedClip.platform === "TikTok" && tiktokAccessToken) {
            try {
              const tiktokResponse = await fetch(
                `https://open.tiktokapis.com/v2/video/query/?fields=id,title,cover_image_url,view_count`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${tiktokAccessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    filters: {
                      video_ids: [publishedClip.external_id],
                    },
                  }),
                }
              );
              if (!tiktokResponse.ok) {
                throw new Error(`TikTok API error: ${tiktokResponse.statusText}`);
              }
              const tiktokData = await tiktokResponse.json();
              const video = tiktokData.data?.videos?.[0];
              if (video && video.id === publishedClip.external_id) {
                title = video.title || title;
                thumbnail = video.cover_image_url || thumbnail;
                views = video.view_count || 0;
              } else {
                console.warn(`No TikTok video found for ID: ${publishedClip.external_id}`);
              }
            } catch (error) {
              console.error(`Error fetching TikTok video ${publishedClip.external_id}:`, error);
            }
          }
  
          return {
            _id: publishedClip.published_clip_id || publishedClip._id,
            clip_id: publishedClip.clip_id,
            platform: publishedClip.platform,
            external_id: publishedClip.external_id,
            url: publishedClip.url,
            metadata: publishedClip.metadata,
            published_at: publishedClip.published_at,
            views,
            title,
            thumbnail,
            originalClip,
          };
        })
      );
  
      setPublishedClips(enrichedPublishedClips);
    } catch (error) {
      console.error("Error fetching published clips:", error);
    } finally {
      setIsPublishedClipsLoading(false);
    }
  };

  // Xử lý message từ TikTok login
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const { accessToken, error, error_type } = event.data;
      if (error) {
        setError(`Đăng nhập TikTok thất bại: ${error} (${error_type || "Unknown error type"})`);
        return;
      }
      if (accessToken) {
        localStorage.setItem("tiktok_access_token", accessToken);
        setTikTokUserInfo(null);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  //Load FB
  useEffect(() => {
    if (window.FB) {
      setSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v19.0",
      });
      setSdkLoaded(true);
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Kiểm tra trạng thái đăng nhập Facebook
  useEffect(() => {
    if (!isSdkLoaded) return;

    const savedAuth = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedAuth) {
      const parsedAuth = JSON.parse(savedAuth);
      const selected = parsedAuth.pages.find(
        (p: FacebookPage) => p.id === parsedAuth.selectedPageId
      );

      if (selected && parsedAuth.pages.length > 0) {
        window.FB.api(
          "/me",
          { access_token: selected.access_token },
          (response: any) => {
            if (response.error) {
              console.error("Token validation failed:", response.error);
              handleFacebookLogout();
              setError("Your session has expired. Please log in again.");
            } else {
              setAuthState({
                isLoggedIn: true,
                pages: parsedAuth.pages,
                selectedPageId: parsedAuth.selectedPageId,
              });
              setSelectedPage(selected);
            }
          }
        );
      } else {
        handleFacebookLogout();
      }
    }
  }, [isSdkLoaded]);

  // Lưu trạng thái Facebook vào localStorage
  useEffect(() => {
    if (!isSdkLoaded) return;
    if (authState.isLoggedIn) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          ...authState,
          selectedPageId: selectedPage?.id,
        })
      );
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [authState, selectedPage]);

  // Xử lý đăng nhập Facebook
  const handleFacebookLogin = () => {
    if (!isSdkLoaded) {
      setError("Facebook SDK not loaded. Please refresh the page.");
      return;
    }

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          fetchPages();
        } else {
          setError("Đăng nhập thất bại. Vui lòng thử lại.");
        }
      },
      {
        scope:
          "pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content,pages_manage_metadata,publish_video",
        auth_type: "rerequest",
      }
    );
  };

  // Lấy danh sách trang Facebook
  const fetchPages = () => {
    window.FB.api("/me/accounts", "GET", {}, (response: any) => {
      if (response?.data && response.data.length > 0) {
        const pageList = response.data.map((page: any) => ({
          id: page.id,
          name: page.name,
          access_token: page.access_token,
        }));
        setAuthState({
          isLoggedIn: true,
          pages: pageList,
          selectedPageId: pageList[0].id,
        });
        setSelectedPage(pageList[0]);
      } else {
        setError(
          "Không tìm thấy Trang Facebook. Bạn cần là quản trị viên của ít nhất một Trang."
        );
        handleFacebookLogout();
      }
    });
  };

  // Xử lý đăng xuất Facebook
  const handleFacebookLogout = () => {
    if (window.FB) {
      window.FB.logout(() => {
        resetFacebookAuthState();
      });
    } else {
      resetFacebookAuthState();
    }
  };

  const resetFacebookAuthState = () => {
    setAuthState({ isLoggedIn: false, pages: [] });
    setSelectedPage(null);
    setError(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // Lấy thông tin người dùng YouTube
  const fetchYouTubeUserInfo = async () => {
    if (!accessToken) {
      setError("Không tìm thấy access token YouTube. Vui lòng đăng nhập.");
      return;
    }

    try {
      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Không thể lấy thông tin kênh YouTube"
        );
      }

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        setYoutubeUserInfo({
          avatar_url: channel.snippet.thumbnails.default.url,
          username: channel.snippet.title,
        });
      } else {
        setError("Không tìm thấy kênh YouTube. Vui lòng tạo kênh trước.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Lỗi khi lấy thông tin kênh YouTube"
      );
    }
  };

  // Lấy thông tin người dùng TikTok
  const fetchTikTokUserInfo = async () => {
    if (!tiktokAccessToken) {
      setError("Không tìm thấy access token TikTok. Vui lòng đăng nhập.");
      return;
    }

    try {
      const fields = [
        "open_id",
        "union_id",
        "avatar_url",
        "display_name",
        "username",
      ].join(",");

      const response = await fetch(
        `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(
          fields
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tiktokAccessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      if (data.data && data.data.user) {
        setTikTokUserInfo(data.data.user);
      } else {
        setError("Không thể lấy thông tin người dùng TikTok");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Lỗi khi lấy thông tin người dùng TikTok"
      );
    }
  };

  useEffect(() => {
    if (tiktokAccessToken) {
      fetchTikTokUserInfo();
    }
    if (accessToken) {
      fetchYouTubeUserInfo();
    }
  }, [tiktokAccessToken, accessToken]);

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

  // Xử lý đăng nhập YouTube
  const handleChannelSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error("Error signing in:", error);
      setError("Failed to sign in. Please try again.");
    }
  };

  // Kiểm tra kênh YouTube
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

  // // Xử lý upload video
  // const handleUpload = async () => {
  //   if (!isSignedIn || !accessToken) {
  //     await handleChannelSignIn()
  //     return
  //   }

  //   const hasChannel = await checkYouTubeChannel()

  //   if (!hasChannel) {
  //     alert("Your account does not have a YouTube channel. Please create one first.")
  //     window.open("https://www.youtube.com/create_channel", "_blank")
  //     return
  //   }

  //   // Nếu có kênh, tiếp tục upload video
  //   await uploadVideo()
  // }

  // // Upload video to YouTube
  // const uploadVideo = async () => {
  //   if (!selectedFile) {
  //     alert("Vui lòng chọn một tệp video trước.")
  //     return
  //   }

  //   const metadata = {
  //     snippet: {
  //       title: "Demo video",
  //       description: "This is a test video upload via YouTube API.",
  //       tags: ["API", "Video Generation", "test", "AI"],
  //     },
  //     status: {
  //       privacyStatus: "private",
  //     },
  //   }

  //   const form = new FormData()
  //   form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
  //   form.append("file", selectedFile)

  //   try {
  //     const response = await fetch(
  //       "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
  //       {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //         body: form,
  //       },
  //     )

  //     const data = await response.json()
  //     if (data.id) {
  //       alert("Tải lên thành công! Link video: " + `https://www.youtube.com/watch?v=${data.id}`)
  //     } else {
  //       console.error("Upload failed:", data)
  //       alert("Tải lên thất bại. Vui lòng thử lại.")
  //     }
  //   } catch (error) {
  //     console.error("Error uploading video:", error)
  //     alert("Lỗi khi tải lên video. Vui lòng thử lại.")
  //   }
  // }

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Lấy icon cho nền tảng
  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case "YouTube":
        return <FaYoutube className="text-red-500" />
      case "Facebook":
        return <FaFacebook className="text-blue-600" />
      case "TikTok":
        return <FaTiktok className="text-black" />
      default:
        return null
    }
  }

  // Lấy màu cho trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Lấy icon cho trạng thái
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return null
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchWorkspaces();
        await fetchClips();
        await fetchPublishedClips();
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };

    initializeData();
  }, [accessToken]);

  // Render clip card
  const renderClipCard = (clip: Clip) => (
    <Card key={clip._id} className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={clip.thumbnail || "/placeholder.svg?height=120&width=240"}
          alt={clip.prompt}
          className="w-full h-36 object-cover"
        />
      </div>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm line-clamp-2 text-left">{clip.prompt}</h3>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(clip.created_at)}</span>
          </div>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${getStatusColor(clip.status)}`}>
            {getStatusIcon(clip.status)}
            <span className="capitalize">{clip.status === "processing" ? "Đang xử lý" : "Hoàn thành"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Render published clip card
  const renderPublishedClipCard = (publishedClip: PublishedClip) => (
    <Card key={publishedClip._id} className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={publishedClip.thumbnail || publishedClip.originalClip?.thumbnail || "/placeholder.svg?height=120&width=240"}
          alt={publishedClip.title || publishedClip.originalClip?.prompt || "Published video"}
          className="w-full h-36 object-cover"
        />
        <div className="absolute top-2 right-2 bg-white text-black text-xs px-2 py-1 rounded-full flex items-center gap-1">
          {getPlatformIcon(publishedClip.platform)}
          <span>{publishedClip.platform}</span>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="mb-2">
          <h3 className="font-medium text-sm line-clamp-2 text-left">
            {publishedClip.title || publishedClip.originalClip?.prompt || "Video đã xuất bản"}
          </h3>
        </div>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(publishedClip.published_at)}</span>
            </div>
            {publishedClip.views !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{publishedClip.views.toLocaleString()} lượt xem</span>
              </div>
            )}
          </div>
          <a
            href={publishedClip.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon className="h-3 w-3" />
            <span>Xem trên {publishedClip.platform}</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );

  // Tính tổng lượt xem theo nền tảng
  const getTotalViewsByPlatform = (platform: string) => {
    return publishedClips
      .filter((clip) => clip.platform === platform)
      .reduce((total, clip) => total + (clip.views || 0), 0)
      .toLocaleString();
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-10 bg-gray-50">
      {/* Header */}
      <div className="">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100 mb-1 flex items-center justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <House className="h-6 w-6 text-blue-500" />
              Trang chủ
            </CardTitle>
            <CardDescription>
              Tạo ra những Video sống động và chia sẻ lên các nền tảng mạng xã hội cùng Vivid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                <FiPlus className="h-4 w-4" />
                <span>Tạo Workspace</span>
              </Button>

              {/* Upload Section */}
              {/* <div
                className="relative"
                onMouseEnter={() => setIsUploadHovered(true)}
                onMouseLeave={() => setIsUploadHovered(false)}
              >
                <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  <FiUploadCloud className="h-4 w-4" />
                  <span>Upload Video</span>
                </Button> */}

                {/* Upload Dropdown - Hiển thị khi hover */}
                {/* {isUploadHovered && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border overflow-hidden">
                    <div className="p-3 border-b">
                      <h3 className="font-medium text-sm">Upload to YouTube</h3>
                      {!isSignedIn ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleChannelSignIn}
                          className="w-full mt-2 flex items-center gap-2"
                        >
                          <FaYoutube className="text-red-500" />
                          <span>Sign in with Google</span>
                        </Button>
                      ) : (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-gray-500">Đã đăng nhập: {userEmail}</p>
                          <Input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            size={1}
                            className="text-xs"
                          />
                          <Button size="sm" onClick={handleUpload} className="w-full">
                            Upload to YouTube
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <FacebookUploader />
                    </div>

                    <div className="p-3 border-t">
                      <TikTokLogin />
                    </div>
                  </div>
                )}
              </div> */}

              {/* Channels Section */}
              <div
                className="relative"
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                  }
                  setIsChannelsHovered(true);
                }}
                onMouseLeave={() => {
                  hoverTimeoutRef.current = setTimeout(() => {
                    setIsChannelsHovered(false);
                  }, 150); // Chờ 150ms trước khi tắt
                }}
              >
                <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  <FaUserCircle className="h-4 w-4" />
                  <span>Kênh</span>
                </Button>

                {isChannelsHovered && (
                  <div
                    className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 border overflow-hidden"
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                      }
                      setIsChannelsHovered(true);
                    }}
                    onMouseLeave={() => {
                      hoverTimeoutRef.current = setTimeout(() => {
                        setIsChannelsHovered(false);
                      }, 150);
                    }}
                  >
                    <div className="p-3 border-b">
                      <h3 className="font-medium text-sm mb-2">Kênh YouTube</h3>
                      {youtubeUserInfo ? (
                        <div className="flex items-center p-2 bg-gray-100 rounded-md">
                          <img
                            src={youtubeUserInfo.avatar_url}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <span className="text-sm font-medium">{youtubeUserInfo.username}</span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleChannelSignIn}
                          className="w-full flex items-center gap-2"
                        >
                          <FaYoutube className="text-red-500" />
                          <span>Đăng nhập YouTube</span>
                        </Button>
                      )}
                    </div>

                    <div className="p-3 border-b">
                      <h3 className="font-medium text-sm mb-2">Kênh TikTok</h3>
                      {tiktokUserInfo ? (
                        <div className="flex items-center p-2 bg-gray-100 rounded-md">
                          <img
                            src={tiktokUserInfo.avatar_url}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <span className="text-sm font-medium">
                            {tiktokUserInfo.display_name} ({tiktokUserInfo.username})
                          </span>
                        </div>
                      ) : (
                        <TikTokLogin />
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="font-medium text-sm mb-2">Trang Facebook</h3>
                      {authState.isLoggedIn ? (
                        <div className="space-y-2">
                          <select
                            value={selectedPage?.id || ""}
                            onChange={(e) => {
                              const page = authState.pages.find((p) => p.id === e.target.value);
                              if (page) setSelectedPage(page);
                            }}
                            className="w-full p-2 border rounded-md text-sm"
                          >
                            {authState.pages.map((page) => (
                              <option key={page.id} value={page.id}>
                                {page.name}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFacebookLogout}
                            className="w-full flex items-center gap-2"
                          >
                            <FaFacebook className="text-blue-600" />
                            <span>Đăng xuất</span>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleFacebookLogin}
                          className="w-full flex items-center gap-2"
                        >
                          <FaFacebook className="text-blue-600" />
                          <span>Đăng nhập Facebook</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tổng số Video</CardTitle>
              <CardDescription>Số lượng video đã tạo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 mr-3">
                  <Video className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-3xl font-bold">{clips.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Lượt xem YouTube</CardTitle>
              <CardDescription>Tổng lượt xem trên YouTube</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-red-100 mr-3">
                  <FaYoutube className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-3xl font-bold">{getTotalViewsByPlatform("YouTube")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Lượt xem Facebook</CardTitle>
              <CardDescription>Tổng lượt xem trên Facebook</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 mr-3">
                  <FaFacebook className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-3xl font-bold">{getTotalViewsByPlatform("Facebook")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Lượt xem TikTok</CardTitle>
              <CardDescription>Tổng lượt xem trên TikTok</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-gray-100 mr-3">
                  <FaTiktok className="h-5 w-5 text-black" />
                </div>
                <span className="text-3xl font-bold">{getTotalViewsByPlatform("TikTok")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="all" onClick={() => setActiveTab("all")}>
              Tất cả
            </TabsTrigger>
            <TabsTrigger value="clips" onClick={() => setActiveTab("clips")}>
              Video từ Workspace
            </TabsTrigger>
            <TabsTrigger value="processing" onClick={() => setActiveTab("processing")}>
              Video đang xử lý
            </TabsTrigger>
            <TabsTrigger value="published" onClick={() => setActiveTab("published")}>
              Video đã xuất bản
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {isClipsLoading || isPublishedClipsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Hiển thị cả clips và published_clips */}
                {clips.map(renderClipCard)}
                {publishedClips.map(renderPublishedClipCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="clips" className="mt-0">
            {isClipsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {completedClips.map(renderClipCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="processing" className="mt-0">
            {isClipsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {processingClips.map(renderClipCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="published" className="mt-0">
            {isPublishedClipsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {publishedClips.map(renderPublishedClipCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Workspace Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Workspaces</h2>
              <p className="text-sm text-gray-500 mt-1">Quản lý các workspace của bạn</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <FiPlus className="mr-2 h-4 w-4" /> Tạo Workspace
            </Button>
          </div>

          {isWorkspaceLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <FaFolder className="mx-auto text-4xl mb-3 text-gray-400" />
              <h3 className="text-lg font-medium mb-1">Chưa có workspace nào</h3>
              <p className="text-gray-500 mb-4">Hãy tạo workspace đầu tiên của bạn để bắt đầu</p>
              <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
                <FiPlus className="mr-2 h-4 w-4" /> Tạo Workspace
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((workspace) => (
                <Card
                  key={workspace._id}
                  className="hover:shadow-md transition-shadow cursor-pointer border"
                  onClick={() => navigateToWorkspace(workspace._id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{workspace.name}</CardTitle>
                      <div className="p-2 rounded-full bg-purple-100">
                        <FaFolder className="text-purple-600 h-4 w-4" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                      {workspace.description || "Không có mô tả"}
                    </p>
                  </CardContent>
                  <CardFooter className="text-xs text-gray-500 pt-0">
                    Tạo ngày: {formatDate(workspace.created_at)}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Tạo Workspace mới</h3>

            <div className="mb-4">
              <Label htmlFor="workspace-name" className="mb-1.5">
                Tên workspace
              </Label>
              <Input
                id="workspace-name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Nhập tên workspace"
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="workspace-desc" className="mb-1.5">
                Mô tả
              </Label>
              <Textarea
                id="workspace-desc"
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                rows={3}
                placeholder="Nhập mô tả (không bắt buộc)"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={createWorkspace}>Tạo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
