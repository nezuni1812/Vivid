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
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "../components/ui/dialog";
import { Youtube, Facebook, Share2, FileText, Loader2 } from "lucide-react";
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

const LOCAL_STORAGE_KEY = "facebook_stats_auth";

interface ShareVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clipUrl: string;
  clipId: string;
  clipPrompt: string;
  facebookAuth: UserAuth;
  setFacebookAuth: (auth: UserAuth) => void;
  selectedFacebookPage: FacebookPage | null;
  setSelectedFacebookPage: (page: FacebookPage | null) => void;
  setError: (error: string | null) => void;
}

export default function ShareVideoDialog({
  isOpen,
  onClose,
  clipUrl,
  clipId,
  clipPrompt,
  facebookAuth,
  setFacebookAuth,
  selectedFacebookPage,
  setSelectedFacebookPage,
  setError,
}: ShareVideoDialogProps) {
  const { isSignedIn, accessToken, signIn } = useAuth();
  const [activePlatform, setActivePlatform] = useState("youtube");
  const [youtube, setYoutube] = useState({ title: clipPrompt, description: "" });
  const [tiktok, setTiktok] = useState({ title: clipPrompt, description: "" });
  const [facebook, setFacebook] = useState({ title: clipPrompt, description: "" });
  const [isYoutubeLoading, setIsYoutubeLoading] = useState(false);
  const [isTiktokLoading, setIsTiktokLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isQuickShareLoading, setIsQuickShareLoading] = useState(false);
  const [isCaptionLoading, setIsCaptionLoading] = useState(false);
  const [isCaptionDialogOpen, setIsCaptionDialogOpen] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState({
    title: "",
    description: "",
  });
  const [youtubeUserInfo, setYoutubeUserInfo] = useState<YouTubeUserInfo | null>(null);
  const [tiktokAccessToken, setTiktokAccessToken] = useState<string | null>(
    localStorage.getItem("tiktok_access_token")
  );
  const [tiktokUserInfo, setTikTokUserInfo] = useState<TikTokUserInfo | null>(null);

  // Load and initialize Facebook SDK with retry
  useEffect(() => {
    if (!window.FB) return;

    const checkFacebookAuth = () => {
      const savedAuth = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedAuth) {
        try {
          const parsedAuth: UserAuth = JSON.parse(savedAuth);
          const selected = parsedAuth.pages.find((p: FacebookPage) => p.id === parsedAuth.selectedPageId);

          if (selected && parsedAuth.pages.length > 0) {
            window.FB.api("/me", { access_token: selected.access_token }, (response: any) => {
              if (response.error) {
                console.error("Token validation failed:", response.error);
                setError("Phiên đăng nhập Facebook đã hết hạn. Vui lòng đăng nhập lại.");
                setFacebookAuth({ isLoggedIn: false, pages: [] });
                setSelectedFacebookPage(null);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
              } else {
                setFacebookAuth({
                  isLoggedIn: true,
                  pages: parsedAuth.pages,
                  selectedPageId: parsedAuth.selectedPageId,
                });
                setSelectedFacebookPage(selected);
              }
            });
          } else {
            setFacebookAuth({ isLoggedIn: false, pages: [] });
            setSelectedFacebookPage(null);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        } catch (err) {
          console.error("Error parsing saved auth:", err);
          setFacebookAuth({ isLoggedIn: false, pages: [] });
          setSelectedFacebookPage(null);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    };

    checkFacebookAuth();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        checkFacebookAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Handle TikTok login messages
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
        setTiktokAccessToken(accessToken);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Fetch YouTube user info
  const fetchYouTubeUserInfo = async () => {
    if (!accessToken) {
      setError("Không tìm thấy access token YouTube. Vui lòng đăng nhập.");
      return;
    }

    try {
      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Không thể lấy thông tin kênh YouTube");
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
      setError(err instanceof Error ? err.message : "Lỗi khi lấy thông tin kênh YouTube");
    }
  };

  // Fetch TikTok user info
  const fetchTikTokUserInfo = async () => {
    if (!tiktokAccessToken) {
      setError("Không tìm thấy access token TikTok. Vui lòng đăng nhập.");
      return;
    }

    try {
      const fields = ["open_id", "union_id", "avatar_url", "display_name", "username"].join(",");
      const response = await fetch(
        `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(fields)}`,
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
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      if (data.data && data.data.user) {
        setTikTokUserInfo(data.data.user);
      } else {
        setError("Không thể lấy thông tin người dùng TikTok");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi lấy thông tin người dùng TikTok");
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

  // Handle Facebook login
  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError("Facebook SDK chưa sẵn sàng. Vui lòng thử lại sau.");
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
        setFacebookAuth({
          isLoggedIn: true,
          pages: pageList,
          selectedPageId: pageList[0].id,
        });
        setSelectedFacebookPage(pageList[0]);
      } else {
        setError("Không tìm thấy Trang Facebook. Bạn cần là quản trị viên của ít nhất một Trang.");
        handleFacebookLogout();
      }
    });
  };

  const handleFacebookLogout = () => {
    if (window.FB) {
      try {
        window.FB.logout((response: any) => {
          console.log("Facebook logout response:", response);
          setFacebookAuth({ isLoggedIn: false, pages: [] });
          setSelectedFacebookPage(null);
          setError(null);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        });
      } catch (err) {
        console.error("Error during Facebook logout:", err);
        setFacebookAuth({ isLoggedIn: false, pages: [] });
        setSelectedFacebookPage(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } else {
      console.warn("Facebook SDK not loaded");
      setFacebookAuth({ isLoggedIn: false, pages: [] });
      setSelectedFacebookPage(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  // Check YouTube channel
  const checkYouTubeChannel = async () => {
    if (!accessToken) {
      setError("Không tìm thấy access token YouTube. Vui lòng đăng nhập.");
      return false;
    }

    try {
      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
        {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        if (data.error?.code === 401) {
          setError("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
          await handleYouTubeSignIn();
        } else {
          setError(data.error?.message || "Lỗi khi kiểm tra kênh YouTube.");
        }
        return false;
      }

      if (data.items && data.items.length > 0) {
        return true;
      }

      setError("Không tìm thấy kênh YouTube. Vui lòng tạo kênh trước.");
      return false;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Lỗi khi kiểm tra kênh YouTube."
      );
      return false;
    }
  };

  // Save published data to MongoDB
  const savePublishedData = async (
    platform: string,
    external_id: string,
    url: string,
    title: string,
    description: string
  ) => {
    const publishedData = {
      clip_id: clipId,
      platform,
      external_id,
      url,
      metadata: { title, description },
    };

    try {
      const saveResponse = await fetch("http://localhost:5000/published-clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publishedData),
      });
      if (!saveResponse.ok) {
        throw new Error("Không thể lưu bài đăng vào cơ sở dữ liệu.");
      }
      const result = await saveResponse.json();
      console.log("Đã lưu bài đăng:", result);
    } catch (saveError) {
      console.error("Lỗi khi lưu thông tin bài đăng:", saveError);
      setError("Lỗi khi lưu thông tin bài đăng.");
    }
  };

  // YouTube upload logic
  const uploadToYouTube = async () => {
    setIsYoutubeLoading(true);
    if (!isSignedIn || !accessToken) {
      await handleYouTubeSignIn();
      setIsYoutubeLoading(false);
      return;
    }

    const hasChannel = await checkYouTubeChannel();
    if (!hasChannel) {
      alert("Tài khoản của bạn chưa có kênh YouTube. Vui lòng tạo kênh trước.");
      window.open("https://www.youtube.com/create_channel", "_blank");
      setIsYoutubeLoading(false);
      return;
    }

    const metadata = {
      snippet: {
        title: youtube.title || "Video không có tiêu đề",
        description: youtube.description || "Không có mô tả",
      },
      status: { privacyStatus: "public" },
    };

    try {
      const response = await fetch(clipUrl, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`Không thể tải video từ URL: ${response.statusText}`);
      }
      const blob = await response.blob();
      const selectedFile = new File([blob], "video.mp4", { type: blob.type });

      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", selectedFile);

      const uploadResponse = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        }
      );

      const data = await uploadResponse.json();
      if (data.id) {
        alert(`Tải lên YouTube thành công! Link video: https://www.youtube.com/watch?v=${data.id}`);
        await savePublishedData(
          "YouTube",
          data.id,
          `https://www.youtube.com/watch?v=${data.id}`,
          youtube.title,
          youtube.description
        );
      } else {
        throw new Error(data.error?.message || "Tải lên YouTube thất bại.");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Lỗi khi tải lên video YouTube. Vui lòng thử lại."
      );
    } finally {
      setIsYoutubeLoading(false);
    }
  };

  // TikTok upload logic
  const fetchTikTokVideoList = async () => {
    if (!tiktokAccessToken) {
      setError("Không tìm thấy access token TikTok. Vui lòng đăng nhập.");
      return null;
    }

    try {
      const fields = ["id", "create_time", "title", "video_description", "share_url"].join(",");
      const response = await fetch(
        `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tiktokAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ max_count: 1 }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      if (data.data && data.data.videos) {
        return data.data.videos[0];
      } else {
        setError("Không thể lấy danh sách video TikTok.");
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi lấy danh sách video TikTok.");
      return null;
    }
  };

  const uploadToTikTok = async () => {
    setIsTiktokLoading(true);
    if (!tiktokAccessToken) {
      alert("Vui lòng đăng nhập TikTok trước.");
      setIsTiktokLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("source_type", "PULL_FROM_URL");
    formData.append("publish_type", "DIRECT_POST");
    formData.append("title", `${tiktok.title} ${tiktok.description}`);
    formData.append("privacy_level", "SELF_ONLY");
    formData.append("disable_duet", "false");
    formData.append("disable_comment", "false");
    formData.append("disable_stitch", "false");
    formData.append("video_cover_timestamp_ms", "1000");
    formData.append("is_aigc", "false");
    formData.append("video_url", clipUrl);

    try {
      const response = await fetch("http://localhost:5000/upload-tiktok-video/", {
        method: "POST",
        headers: { Authorization: `Bearer ${tiktokAccessToken}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        const latestVideo = await fetchTikTokVideoList();
        if (latestVideo) {
          const tiktokVideoUrl = `https://www.tiktok.com/@${tiktokUserInfo?.username}/video/${latestVideo.id}`;
          await savePublishedData(
            "TikTok",
            latestVideo.id,
            tiktokVideoUrl,
            tiktok.title,
            tiktok.description
          );
          alert(`Tải lên TikTok thành công! Link video: ${tiktokVideoUrl}`);
        } else {
          console.warn("Không thể lấy thông tin video vừa đăng.");
        }
      } else {
        setError(data.error || "Tải lên TikTok thất bại: Lỗi không xác định");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải lên TikTok.");
    } finally {
      setIsTiktokLoading(false);
    }
  };

  // Facebook upload logic
  const uploadToFacebook = async () => {
    if (!selectedFacebookPage) {
      setError("Vui lòng chọn một Trang Facebook.");
      return;
    }

    setIsFacebookLoading(true);
    try {
      const response = await fetch(clipUrl);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("source", blob, "video.mp4");
      formData.append("title", facebook.title);
      formData.append("description", facebook.description);
      formData.append("access_token", selectedFacebookPage.access_token);

      const uploadResponse = await fetch(
        `https://graph.facebook.com/v19.0/${selectedFacebookPage.id}/videos`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error?.message || "Không thể đăng video lên Facebook");
      }

      const uploadData = await uploadResponse.json();
      const storedUser = localStorage.getItem("currentUser");
      const userId = storedUser ? JSON.parse(storedUser).user_id : null;

      await fetch("http://localhost:5000/published-clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          clip_id: clipId,
          platform: "Facebook",
          external_id: uploadData.id,
          url: `https://www.facebook.com/${selectedFacebookPage.id}/videos/${uploadData.id}`,
          metadata: JSON.stringify({ title: facebook.title, description: facebook.description }),
          published_at: new Date().toISOString(),
        }),
      });

      alert(`Video đã được đăng lên Facebook thành công! Link video: https://www.facebook.com/${selectedFacebookPage.id}/videos/${uploadData.id}`);
      setFacebook({ title: "", description: "" });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi đăng video lên Facebook");
    } finally {
      setIsFacebookLoading(false);
    }
  };

  // Quick share to all platforms
  const handleQuickShare = () => {
    if (isQuickShareLoading) return;
    setIsQuickShareLoading(true);

    const promises = [];
    if (facebookAuth.isLoggedIn && selectedFacebookPage) {
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
        setError(
          error instanceof Error ? error.message : "Lỗi khi chia sẻ nhanh."
        );
      })
      .finally(() => {
        setIsQuickShareLoading(false);
      });
  };

  // YouTube sign-in
  const handleYouTubeSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      setError("Đăng nhập YouTube thất bại. Vui lòng thử lại.");
    }
  };

  // Generate caption
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

  const handleCaptionDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] [&>button]:hidden">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="md:order-1">
              <div className="p-4">
                <h3 className="text-lg font-medium">Xem trước video</h3>
                <p className="text-sm text-muted-foreground">
                  Kiểm tra video trước khi chia sẻ
                </p>
              </div>
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                  <video width="640" height="360" controls>
                    <source src={clipUrl} type="video/mp4" />
                    <source src={clipUrl.replace(".mp4", ".mov")} type="video/quicktime" />
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
                          <img
                            src={youtubeUserInfo.avatar_url}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <span className="text-sm font-medium">
                            {youtubeUserInfo.username}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tiêu đề video</label>
                        <Input
                          placeholder="Nhập tiêu đề video..."
                          value={youtube.title}
                          onChange={(e) => setYoutube({ ...youtube, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mô tả</label>
                        <Textarea
                          placeholder="Nhập mô tả video..."
                          value={youtube.description}
                          onChange={(e) =>
                            setYoutube({ ...youtube, description: e.target.value })
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
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
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
                                {tiktokUserInfo.display_name} ({tiktokUserInfo.username})
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Đang tải thông tin kênh...
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tiêu đề video</label>
                        <Input
                          placeholder="Nhập tiêu đề cho video TikTok..."
                          value={tiktok.title}
                          onChange={(e) => setTiktok({ ...tiktok, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mô tả</label>
                        <Textarea
                          placeholder="Nhập mô tả cho video TikTok..."
                          value={tiktok.description}
                          onChange={(e) =>
                            setTiktok({ ...tiktok, description: e.target.value })
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
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
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
                  {!facebookAuth.isLoggedIn ? (
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
                          disabled={!window.FB}
                        >
                          Đăng nhập Facebook
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Chọn Trang</label>
                        <Select
                          onValueChange={(value) => {
                            const page = facebookAuth.pages.find((p) => p.id === value);
                            if (page) setSelectedFacebookPage(page);
                          }}
                          value={selectedFacebookPage?.id || ""}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Không có trang nào" />
                          </SelectTrigger>
                          <SelectContent>
                            {facebookAuth.pages.length === 0 ? (
                              <SelectItem value="" disabled>
                                Không có trang nào
                              </SelectItem>
                            ) : (
                              facebookAuth.pages.map((page) => (
                                <SelectItem key={page.id} value={page.id}>
                                  {page.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tiêu đề bài đăng</label>
                        <Input
                          placeholder="Nhập tiêu đề bài đăng..."
                          value={facebook.title}
                          onChange={(e) =>
                            setFacebook({ ...facebook, title: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nội dung</label>
                        <Textarea
                          placeholder="Nhập nội dung bài đăng..."
                          value={facebook.description}
                          onChange={(e) =>
                            setFacebook({ ...facebook, description: e.target.value })
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
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
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
                  <h3 className="text-lg font-medium">Chia sẻ nhanh</h3>
                  <p className="text-sm text-muted-foreground">
                    Chia sẻ video lên tất cả nền tảng đã đăng nhập
                  </p>
                </div>
                <div className="ml-auto flex space-x-2">
                <Dialog open={isCaptionDialogOpen} onOpenChange={setIsCaptionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-slate-800 hover:bg-slate-700" onClick={handleGenerateCaption} disabled={isCaptionLoading}>
                      <FileText className="mr-2 h-4 w-4" />
                      Tạo caption tự động
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Caption được tạo</DialogTitle>
                      <DialogDescription>Nhấn "Xác nhận" để áp dụng caption cho tất cả nền tảng.</DialogDescription>
                    </DialogHeader>
                    {isCaptionLoading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 text-slate-600 animate-spin" />
                        <p className="mt-2 text-sm text-gray-600">Đang tạo caption...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Tiêu đề</label>
                          <Input value={generatedCaption.title} onChange={handleCaptionTitleChange} disabled={isCaptionLoading} />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Mô tả</label>
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
                      <Button onClick={handleAcceptCaption} className="bg-slate-800 hover:bg-slate-700" disabled={isCaptionLoading}>
                        Xác nhận
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                  <Button
                    className="bg-slate-800 hover:bg-slate-700"
                    onClick={handleQuickShare}
                    disabled={isQuickShareLoading}
                  >
                    {isQuickShareLoading ? (
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
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Đang xử lý...
                      </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4 mr-2" />
                          Chia sẻ nhanh
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }