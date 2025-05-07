"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Download,
  Youtube,
  Facebook,
  Eye,
  FileText,
  Share2,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import TikTokLogin from "../pages/TikTokLogin";

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

interface PublishOptionsProps {
  isOpen?: boolean;
  onClose?: () => void;
  exportVid?: (
    quality: string,
    format: string,
    fps: string,
    updateProgress: (current: number, total: number) => void
  ) => Promise<any>;
  workspaceId: string;
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

export default function PublishOptions({
  isOpen = true,
  onClose,
  exportVid,
  workspaceId,
}: PublishOptionsProps) {
  const { isSignedIn, accessToken, signIn } = useAuth();
  const [quality, setQuality] = useState("1080p");
  const [format, setFormat] = useState("MP4");
  const [fps, setFps] = useState("30");
  const [youtube, setYoutube] = useState({ title: "", description: "" });
  const [tiktok, setTiktok] = useState({ title: "", description: "" });
  const [facebook, setFacebook] = useState({ title: "", description: "" });
  const [isCaptionDialogOpen, setIsCaptionDialogOpen] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState({
    title: "",
    description: "",
  });
  const [activePlatform, setActivePlatform] = useState("youtube");
  const [activeTab, setActiveTab] = useState("export");
  const [isExporting, setIsExporting] = useState(false);
  const [isCaptionLoading, setIsCaptionLoading] = useState(false);
  const [isYoutubeLoading, setIsYoutubeLoading] = useState(false);
  const [isTiktokLoading, setIsTiktokLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isQuickShareLoading, setIsQuickShareLoading] = useState(false);

  // State cho xuất video
  const [exportProgress, setExportProgress] = useState(0);
  const updateProgress = (current: number, total: number) => {
    if (total > 0) {
      setExportProgress(+((current / total) * 100).toFixed(2));
    } else {
      setExportProgress(0);
    }
  };

  // Biến lưu tạm link video
  const [VideoLink, setVideoLink] = useState<string>(
    "" // Thay bằng link thực tế sau
  );

  // State cho YouTube
  const [youtubeUserInfo, setYoutubeUserInfo] =
    useState<YouTubeUserInfo | null>(null);
  // State cho TikTok
  const [tiktokAccessToken, setTiktokAccessToken] = useState<string | null>(
    localStorage.getItem("tiktok_access_token")
  );
  const [tiktokUserInfo, setTikTokUserInfo] = useState<TikTokUserInfo | null>(
    null
  );
  // State cho Facebook
  const [isSdkLoaded, setSdkLoaded] = useState(false);
  const [authState, setAuthState] = useState<UserAuth>({
    isLoggedIn: false,
    pages: [],
  });
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  // State cho clip ID
  const [clipId, setClipId] = useState<string | null>(null);

  // Load Facebook SDK
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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const { accessToken, error, error_type } = event.data;
      if (error) {
        setError(
          `Đăng nhập TikTok thất bại: ${error} (${
            error_type || "Unknown error type"
          })`
        );
        return;
      }
      if (accessToken) {
        localStorage.setItem("tiktok_access_token", accessToken);
        setTiktokAccessToken(accessToken);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  // TikTok User Info Fetching
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

  // Youtube User Info Fetching
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

  useEffect(() => {
    if (tiktokAccessToken) {
      fetchTikTokUserInfo();
    }
    if (accessToken) {
      // console.log("Fetching YouTube user info with access token:", accessToken);
      fetchYouTubeUserInfo();
    }
  }, [tiktokAccessToken, accessToken]);

  const handleGenerateCaption = async () => {
    setIsCaptionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/caption-from-clip/${clipId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Lỗi khi tạo caption.");
      }

      const data = await response.json();
      setGeneratedCaption({
        title: data.title || "",
        description: data.description || "",
      });
      setIsCaptionDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tạo caption.");
    } finally {
      setIsCaptionLoading(false);
    }
  };

  const handleCaptionTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneratedCaption((prev) => ({ ...prev, title: e.target.value }));
  };

  const handleCaptionDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setGeneratedCaption((prev) => ({ ...prev, description: e.target.value }));
  };

  const handleAcceptCaption = () => {
    setYoutube({
      title: generatedCaption.title,
      description: generatedCaption.description,
    });
    setTiktok({
      title: generatedCaption.title,
      description: generatedCaption.description,
    });
    setFacebook({
      title: generatedCaption.title,
      description: generatedCaption.description,
    });
    setIsCaptionDialogOpen(false);
  };

  const handlePublishAutomatcally = () => {
    if (isQuickShareLoading) return;
    setIsQuickShareLoading(true);

    const promises = [];

    if (authState.isLoggedIn && selectedPage) {
      promises.push(uploadToFacebook());
    }
    if (tiktokAccessToken) {
      promises.push(uploadToTikTok());
    }
    if (isSignedIn && accessToken && youtubeUserInfo) {
      promises.push(uploadToYouTube());
    }

    Promise.all(promises)
      .catch((error) => {
        console.error("Error during quick share:", error);
      })
      .finally(() => {
        setIsQuickShareLoading(false);
      });
  };

  const createClip = async () => {
    try {
      const scriptResponse = await fetch(`http://localhost:5000/scripts?workspace_id=${workspaceId}`);
      const scripts = await scriptResponse.json();
      
      const scriptTitle = scripts.length > 0 ? scripts[0].title : "Video export";
      
      const formData = new FormData();
      formData.append("workspace_id", workspaceId);
      formData.append("prompt", scriptTitle);
      formData.append("status", "processing");

      const response = await fetch("http://localhost:5000/clips", {
        method: "POST",
        body: formData, // Gửi FormData thay vì JSON
      });

      const data = await response.json();
      if (response.ok) {
        setClipId(data.clip_id);
        return data.clip_id;
      } else {
        throw new Error(data.error || "Failed to create clip");
      }
    } catch (error) {
      console.error("Error creating clip:", error);
      setError(error instanceof Error ? error.message : "Failed to create clip");
      return null;
    }
  };

  const updateClip = async (clipId: string, clipUrl: string) => {
    try {
      const response = await fetch(`http://localhost:5000/clips/${clipId}/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clip_url: clipUrl, 
          status: "completed",
        }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update clip");
      }
    } catch (error) {
      console.error("Error updating clip:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update clip"
      );
    }
  };

  const handleExport = async () => {
    console.log("Fps:", fps);
    console.log("Quality:", quality);
    console.log("Format:", format);
  
    if (!exportVid) {
      setError("Export function not available.");
      return;
    }
  
    // Kiểm tra hoặc tạo clip
    const clipId = await createClip();
    if (!clipId) {
      setError("Failed to create or find clip.");
      return;
    }
  
    setIsExporting(true);
    try {
      const data = await exportVid(quality, format, fps, updateProgress);
      if (data && data.content) {
        console.log("Export successful, updating clip with ID:", clipId, "URL:", data.content);
        alert("Video đã được xuất thành công!");
        setVideoLink(data.content);
        await updateClip(clipId, data.content);
        setActiveTab("publish");
      } else {
        setError("Failed to export video: No content returned.");
      }
    } catch (error) {
      console.error("Export error:", error);
      setError(
        "Error exporting video: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsExporting(false);
      setActiveTab("publish");
    }
  };

  const handleYouTubeSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error("Error signing in:", error);
      setError("Đăng nhập YouTube thất bại. Vui lòng thử lại.");
    }
  };

  const checkYouTubeChannel = async () => {
    if (!accessToken) {
      setError("Không tìm thấy access token YouTube. Vui lòng đăng nhập.");
      return false;
    }

    try {
      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "API Error:",
          data.error?.message || "Unknown error",
          data.error?.code
        );
        if (data.error?.code === 401) {
          setError("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
          await handleYouTubeSignIn();
        } else {
          setError(data.error?.message || "Lỗi khi kiểm tra kênh YouTube.");
        }
        return false;
      }

      if (data.items && data.items.length > 0) {
        console.log(
          "Found channels:",
          data.items.map((item: any) => item.snippet.title)
        );
        return true; // Tài khoản có kênh
      }

      setError("Không tìm thấy kênh YouTube. Vui lòng tạo kênh trước.");
      return false;
    } catch (error) {
      console.error("Error checking YouTube channel:", error);
      setError(
        "Lỗi khi kiểm tra kênh YouTube: " +
          (error instanceof Error ? error.message : "Lỗi không xác định")
      );
      return false;
    }
  };
  // lưu dữ liệu lên MongoDB
  const savePublishedData: any = async (
    i_platform: string,
    i_external_id: string,
    i_url: string,
    i_title: string,
    i_desc: string
  ) => {
    const publishedData = {
      clip_id: clipId,
      platform: i_platform,
      external_id: i_external_id,
      url: i_url,
      metadata: {
        title: i_title,
        description: i_desc,
      },
    };

    try {
      const saveResponse = await fetch(
        "http://localhost:5000/published-clips",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(publishedData),
        }
      );
      if (!saveResponse.ok) {
        throw new Error("Không thể lưu bài đăng vào cơ sở dữ liệu.");
      }
      const result = await saveResponse.json();
      console.log("Đã lưu bài đăng:", result);
    } catch (saveError) {
      console.error("Lỗi khi lưu thông tin bài đăng:", saveError);
    }
  };

  // YouTube Upload Logic
  const uploadToYouTube = async () => {
    setIsYoutubeLoading(true);
    if (!isSignedIn || !accessToken) {
      await handleYouTubeSignIn();
      return;
    }

    const hasChannel = await checkYouTubeChannel();
    if (!hasChannel) {
      alert("Tài khoản của bạn chưa có kênh YouTube. Vui lòng tạo kênh trước.");
      window.open("https://www.youtube.com/create_channel", "_blank");
      return;
    }

    const metadata = {
      snippet: {
        title: youtube.title || "Video không có tiêu đề",
        description: youtube.description || "Không có mô tả",
        // tags: ["API", "Video Generation", "test", "AI"],
      },
      status: {
        privacyStatus: "public", // "public", "private", or "unlisted"
      },
    };

    try {
      const response = await fetch(VideoLink, {
        mode: "cors",
      });
      if (!response.ok) {
        throw new Error(`Không thể tải video từ URL: ${response.statusText}`);
      }
      const blob = await response.blob();
      const selectedFile = new File([blob], "video.mp4", { type: blob.type });

      const form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      form.append("file", selectedFile);

      const uploadResponse = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        }
      );

      const data = await uploadResponse.json();
      if (data.id) {
        alert(
          "Tải lên YouTube thành công! Link video: " +
            `https://www.youtube.com/watch?v=${data.id}`
        );
        savePublishedData(
          "YouTube",
          data.id,
          `https://www.youtube.com/watch?v=${data.id}`,
          youtube.title,
          youtube.description
        );
      } else {
        console.error("Upload failed:", data);
        throw new Error(data.error?.message || "Tải lên YouTube thất bại.");
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Lỗi khi tải lên video YouTube. Vui lòng thử lại."
      );
    } finally {
      setIsYoutubeLoading(false);
    }
  };

  // Thêm hàm fetchTikTokVideoList để truy vấn danh sách video
  const fetchTikTokVideoList = async () => {
    if (!tiktokAccessToken) {
      setError("Không tìm thấy access token TikTok. Vui lòng đăng nhập.");
      return null;
    }

    try {
      const fields = [
        "id",
        "create_time",
        "title",
        "video_description",
        "share_url",
      ].join(",");
      const response = await fetch(
        `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(
          fields
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tiktokAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            max_count: 1,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      if (data.data && data.data.videos) {
        return data.data.videos[0];
      } else {
        setError("Không thể lấy danh sách video TikTok.");
        return null;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Lỗi khi lấy danh sách video TikTok."
      );
      return null;
    }
  };

  const uploadToTikTok = async () => {
    setIsTiktokLoading(true);
    if (!tiktokAccessToken) {
      alert("Please login to TikTok first.");
      setIsTiktokLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("source_type", "PULL_FROM_URL");
    formData.append("publish_type", "DIRECT_POST");
    formData.append("title", `${tiktok.title} ${tiktok.description}`); // Concat title + description
    formData.append("privacy_level", "SELF_ONLY");
    formData.append("disable_duet", "false");
    formData.append("disable_comment", "false");
    formData.append("disable_stitch", "false");
    formData.append("video_cover_timestamp_ms", "1000");
    formData.append("is_aigc", "false");
    formData.append("video_url", VideoLink);

    try {
      const response = await fetch(
        "http://localhost:5000/upload-tiktok-video/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tiktokAccessToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        const latestVideo = await fetchTikTokVideoList();
        if (latestVideo) {
          // console.log("Video vừa đăng:", latestVideo);
          const tiktokVideoUrl = `https://www.tiktok.com/@${tiktokUserInfo?.username}/video/${latestVideo.id}`;
          await savePublishedData(
            "TikTok",
            latestVideo.id,
            tiktokVideoUrl,
            tiktok.title,
            tiktok.description
          );
          alert("Tải lên TikTok thành công! Link video: " + tiktokVideoUrl);
        } else {
          console.warn("Không thể lấy thông tin video vừa đăng.");
        }
      } else {
        alert(
          "Tải lên TikTok thất bại: " + (data.error || "Lỗi không xác định")
        );
      }
    } catch (err) {
      alert("Lỗi khi tải lên TikTok: " + (err as Error).message);
    } finally {
      setIsTiktokLoading(false);
    }
  };

  // Facebook Upload Logic
  const uploadToFacebook = async () => {
    setIsFacebookLoading(true);
    if (!selectedPage) {
      setError("Vui lòng chọn một Trang trước khi đăng.");
      return;
    }

    try {
      const res = await fetch(VideoLink);
      if (!res.ok) {
        throw new Error("Không thể tải video từ URL.");
      }
      const blob = await res.blob();
      const fileToUpload = new File([blob], "video.mp4", { type: blob.type });

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("title", facebook.title);
      formData.append("description", facebook.description);
      formData.append("access_token", selectedPage.access_token);
      formData.append("published", "true"); // Công khai
      formData.append("privacy", JSON.stringify({ value: "EVERYONE" }));

      const resUpload = await fetch(
        `https://graph-video.facebook.com/v19.0/${selectedPage.id}/videos`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await resUpload.json();
      if (data.id) {
        alert(
          `Đăng video lên Facebook thành công! ID: https://www.facebook.com/${selectedPage.id}/posts/${data.id}`
        );
        savePublishedData(
          "Facebook",
          data.id,
          `https://www.facebook.com/${selectedPage.id}/posts/${data.id}`,
          facebook.title,
          facebook.description
        );
      } else {
        if (data.error?.code === 190 && data.error?.error_subcode === 463) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          handleFacebookLogout();
        } else {
          setError(
            `Đăng video thất bại: ${
              data.error?.message || "Lỗi không xác định"
            }`
          );
        }
      }
    } catch (err) {
      setError(
        `Có lỗi xảy ra khi đăng video lên Facebook: ${
          err instanceof Error ? err.message : "Lỗi không xác định"
        }`
      );
    } finally {
      setIsFacebookLoading(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4">
          <Button
            variant={activeTab === "export" ? "default" : "outline"}
            onClick={() => setActiveTab("export")}
            className={
              activeTab === "export" ? "bg-blue-600 hover:bg-blue-700" : ""
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Xuất video
          </Button>
          <Button
            variant={activeTab === "publish" ? "default" : "outline"}
            onClick={() => setActiveTab("publish")}
            className={
              activeTab === "publish" ? "bg-blue-600 hover:bg-blue-700" : ""
            }
          >
            <Share2 className="mr-2 h-4 w-4" />
            Xem trước & Chia sẻ
          </Button>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Đóng</span>
          </Button>
        )}
      </div>

      {activeTab === "export" && (
        <Card>
          <CardHeader>
            <CardTitle>Cấu hình xuất video</CardTitle>
            <CardDescription>
              Chọn chất lượng và định dạng xuất video
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chất lượng video</label>
              <Select
                value={quality}
                onValueChange={(value) => setQuality(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chất lượng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">HD (720p)</SelectItem>
                  <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                  <SelectItem value="4k">Ultra HD (4K)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Định dạng</label>
              <Select
                value={format}
                onValueChange={(value) => setFormat(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn định dạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MP4">MP4</SelectItem>
                  <SelectItem value="MOV">MOV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tốc độ khung hình (FPS)
              </label>
              <Select value={fps} onValueChange={(value) => setFps(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn FPS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24fps</SelectItem>
                  <SelectItem value="25">25fps</SelectItem>
                  <SelectItem value="30">30fps</SelectItem>
                  <SelectItem value="50">50fps</SelectItem>
                  <SelectItem value="60">60fps</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {`Đang xử lý... ${exportProgress}%`}
                </>
              ) : (
                "Xuất video"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {activeTab === "publish" && (
        <>
          {!VideoLink ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3">
                <Eye className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mb-2 text-xl font-medium">Chưa có Video</h3>
              <p className="text-sm text-muted-foreground">
                Hãy xuất một video trước khi chia sẻ
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card className="md:order-1">
                  <div className="p-4">
                    <h3 className="text-lg font-medium">Xem trước video</h3>
                    <p className="text-sm text-muted-foreground">
                      Kiểm tra video trước khi xuất bản
                    </p>
                  </div>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gray-900 flex items-center justify-center">
                      <video width="640" height="360" controls>
                        <source src={VideoLink} type="video/mp4" />
                        <source
                          src={VideoLink.replace(".mp4", ".mov")}
                          type="video/quicktime"
                        />
                        Trình duyệt của bạn không hỗ trợ thẻ video.
                      </video>
                    </div>
                  </CardContent>
                </Card>

                <div className="md:order-2">
                  <div className="flex mb-2 border-b">
                    <button
                      className={`flex items-center px-4 py-2 border-b-2 ${
                        activePlatform === "youtube"
                          ? "border-red-500 text-red-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActivePlatform("youtube")}
                    >
                      <Youtube className="mr-2 h-5 w-5" />
                      YouTube
                    </button>
                    <button
                      className={`flex items-center px-4 py-2 border-b-2 ${
                        activePlatform === "tiktok"
                          ? "border-black text-black"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActivePlatform("tiktok")}
                    >
                      <svg
                        className="mr-2 h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16.8217 5.1344C16.0886 4.29394 15.6479 3.19805 15.6479 2H14.7293M16.8217 5.1344C17.4898 5.90063 18.3944 6.45788 19.4245 6.67608C19.7446 6.74574 20.0786 6.78293 20.4266 6.78293V10.2191C18.645 10.2191 16.9932 9.64801 15.6477 8.68211V15.6707C15.6477 19.1627 12.8082 22 9.32386 22C7.50043 22 5.85334 21.2198 4.69806 19.98C3.64486 18.847 2.99994 17.3331 2.99994 15.6707C2.99994 12.2298 5.75592 9.42509 9.17073 9.35079M16.8217 5.1344C16.8039 5.12276 16.7861 5.11101 16.7684 5.09914M6.9855 17.3517C6.64217 16.8781 6.43802 16.2977 6.43802 15.6661C6.43802 14.0734 7.73249 12.7778 9.32394 12.7778C9.62087 12.7778 9.9085 12.8288 10.1776 12.9124V9.40192C9.89921 9.36473 9.61622 9.34149 9.32394 9.34149C9.27287 9.34149 8.86177 9.36884 8.81073 9.36884M14.7244 2H12.2097L12.2051 15.7775C12.1494 17.3192 10.8781 18.5591 9.32386 18.5591C8.35878 18.5591 7.50971 18.0808 6.98079 17.3564"
                          stroke="#000000"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                      TikTok
                    </button>
                    <button
                      className={`flex items-center px-4 py-2 border-b-2 ${
                        activePlatform === "facebook"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActivePlatform("facebook")}
                    >
                      <Facebook className="mr-2 h-5 w-5" />
                      Facebook
                    </button>
                  </div>

                  {activePlatform === "youtube" && (
                    <div className="space-y-3">
                      {!youtubeUserInfo ? (
                        <Card className="p-8 text-center py-20">
                          <CardHeader>
                            <CardTitle>Chia sẻ Video lên YouTube</CardTitle>
                            <CardDescription>
                              Kết nối tài khoản YouTube để chia sẻ video
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button
                              onClick={handleYouTubeSignIn}
                              className="w-full bg-red-600 hover:bg-red-700"
                            >
                              Đăng nhập YouTube
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <div className="space-y-2 mb-4">
                            <label className="text-sm font-medium">Kênh</label>
                            <div className="flex items-center p-2 bg-gray-100 rounded-md">
                              {youtubeUserInfo ? (
                                <>
                                  <img
                                    src={youtubeUserInfo.avatar_url}
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full mr-3"
                                  />
                                  <span className="text-sm font-medium">
                                    {youtubeUserInfo.username}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  Đăng nhập để xem thông tin kênh
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Tiêu đề video
                            </label>
                            <Input
                              placeholder="Nhập tiêu đề video..."
                              value={youtube.title}
                              onChange={(e) =>
                                setYoutube({
                                  ...youtube,
                                  title: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Mô tả</label>
                            <Textarea
                              placeholder="Nhập mô tả video..."
                              value={youtube.description}
                              onChange={(e) =>
                                setYoutube({
                                  ...youtube,
                                  description: e.target.value,
                                })
                              }
                              className="min-h-[100px]"
                            />
                          </div>
                          <Button
                            className="w-full bg-red-600 hover:bg-red-700 mt-4"
                            onClick={uploadToYouTube}
                            disabled={isYoutubeLoading}
                          >
                            {isYoutubeLoading ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Đang xử lý...
                              </>
                            ) : (
                              "Chia sẻ lên YouTube"
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {activePlatform === "tiktok" && (
                    <div className="space-y-3">
                      {!tiktokAccessToken ? (
                        <Card className="p-8 text-center py-20">
                          <CardHeader>
                            <CardTitle>Chia sẻ Video lên TikTok</CardTitle>
                            <CardDescription>
                              Kết nối tài khoản TikTok để chia sẻ video
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <TikTokLogin />
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <div className="space-y-2 mb-4">
                            <label className="text-sm font-medium">Kênh</label>
                            <div className="flex items-center p-2 bg-gray-100 rounded-md">
                              {tiktokUserInfo ? (
                                <>
                                  <img
                                    src={tiktokUserInfo.avatar_url}
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full mr-3"
                                  />
                                  <span className="text-sm font-medium">
                                    {tiktokUserInfo.display_name} (
                                    {tiktokUserInfo.username})
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  Đăng nhập để xem thông tin kênh
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Tiêu đề video
                            </label>
                            <Input
                              placeholder="Nhập tiêu đề cho video TikTok..."
                              value={tiktok.title}
                              onChange={(e) =>
                                setTiktok({ ...tiktok, title: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Mô tả</label>
                            <Textarea
                              placeholder="Nhập mô tả cho video TikTok..."
                              value={tiktok.description}
                              onChange={(e) =>
                                setTiktok({
                                  ...tiktok,
                                  description: e.target.value,
                                })
                              }
                              className="min-h-[100px]"
                            />
                          </div>
                          <Button
                            className="w-full bg-black hover:bg-gray-800 mt-4"
                            onClick={uploadToTikTok}
                            disabled={isTiktokLoading}
                          >
                            {isTiktokLoading ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Đang xử lý...
                              </>
                            ) : (
                              "Chia sẻ lên TikTok"
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {activePlatform === "facebook" && (
                    <div className="space-y-3">
                      {!authState.isLoggedIn ? (
                        <Card className="p-8 text-center py-20">
                          <CardHeader>
                            <CardTitle>Chia sẻ Video lên Facebook</CardTitle>
                            <CardDescription>
                              Kết nối tài khoản Facebook để chia sẻ video
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button
                              onClick={handleFacebookLogin}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              Đăng nhập Facebook
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Chọn Trang
                            </label>
                            <Select
                              onValueChange={(value) => {
                                const page = authState.pages.find(
                                  (p) => p.id === value
                                );
                                if (page) setSelectedPage(page);
                              }}
                              value={selectedPage?.id || ""}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Không có trang nào" />
                              </SelectTrigger>
                              <SelectContent>
                                {authState.pages.length === 0 ? (
                                  <SelectItem value="" disabled>
                                    Không có trang nào
                                  </SelectItem>
                                ) : (
                                  authState.pages.map((page) => (
                                    <SelectItem key={page.id} value={page.id}>
                                      {page.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Tiêu đề bài đăng
                            </label>
                            <Input
                              placeholder="Nhập tiêu đề bài đăng..."
                              value={facebook.title}
                              onChange={(e) =>
                                setFacebook({
                                  ...facebook,
                                  title: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Nội dung
                            </label>
                            <Textarea
                              placeholder="Nhập nội dung bài đăng..."
                              value={facebook.description}
                              onChange={(e) =>
                                setFacebook({
                                  ...facebook,
                                  description: e.target.value,
                                })
                              }
                              className="min-h-[100px]"
                            />
                          </div>
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                            onClick={uploadToFacebook}
                            disabled={isFacebookLoading}
                          >
                            {isFacebookLoading ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Đang xử lý...
                              </>
                            ) : (
                              "Chia sẻ lên Facebook"
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div>
                      <h3 className="text-lg font-medium">
                        Tạo nội dung cho tất cả nền tảng
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Sử dụng các chức năng sau để xuất bản nhanh chóng hơn
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-auto">
                      <Dialog
                        open={isCaptionDialogOpen}
                        onOpenChange={setIsCaptionDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            className="bg-slate-800 hover:bg-slate-700"
                            onClick={handleGenerateCaption}
                            disabled={isCaptionLoading}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Tạo caption tự động
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Caption được tạo</DialogTitle>
                            <DialogDescription>
                              Nhấn "Xác nhận" để áp dụng caption cho tất cả nền
                              tảng.
                            </DialogDescription>
                          </DialogHeader>
                          {isCaptionLoading ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Loader2 className="h-8 w-8 text-slate-600 animate-spin" />
                              <p className="mt-2 text-sm text-gray-600">Đang tạo caption...</p>
                            </div>
                          ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">
                                Tiêu đề
                              </label>
                              <Input
                                value={generatedCaption.title}
                                onChange={handleCaptionTitleChange}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Mô tả
                              </label>
                              <Textarea
                                value={generatedCaption.description}
                                onChange={handleCaptionDescriptionChange}
                                className="min-h-[100px]"
                                disabled={isCaptionLoading}
                              />
                            </div>
                          </div>
                          )}
                          <DialogFooter>
                            <Button
                              onClick={handleAcceptCaption}
                              className="bg-slate-800 hover:bg-slate-700"
                            >
                              Xác nhận
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        className="bg-slate-800 hover:bg-slate-700"
                        onClick={handlePublishAutomatcally}
                      >
                        <Share2 className="h-4 w-4" />
                        Chia sẻ nhanh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );

  if (isOpen === true && !onClose) {
    return content;
  }

  return content;
}
