import React, { useEffect, useState } from "react";

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

const FacebookUploader: React.FC = () => {
  const [isSdkLoaded, setSdkLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<any | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Load SDK
  useEffect(() => {
    if (window.FB) {
      setSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = function () {
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

  const handleLogin = () => {
    if (!isSdkLoaded) return;

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          setIsLoggedIn(true);
          fetchPages();
        } else {
          alert("Đăng nhập thất bại");
        }
      },
      { scope: "pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content,pages_manage_metadata,publish_video" }
    );
  };

  const fetchPages = () => {
    window.FB.api("/me/accounts", (response: any) => {
      if (response?.data) {
        setPages(response.data);
      } else {
        alert("Không lấy được danh sách trang");
      }
    });
  };

  const handleVideoUpload = async () => {
    if (!selectedPage) return alert("Chọn Page trước");
    if (!videoFile && !videoUrl) return alert("Chọn video từ thiết bị hoặc nhập URL");

    setIsUploading(true);

    try {
      let fileToUpload = videoFile;

      if (!fileToUpload && videoUrl) {
        const res = await fetch(videoUrl);
        const blob = await res.blob();
        fileToUpload = new File([blob], "video.mp4", { type: blob.type });
      }

      const formData = new FormData();
      formData.append("file", fileToUpload!);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("access_token", selectedPage.access_token);
      formData.append("published", published ? "true" : "false");
      formData.append("privacy", JSON.stringify({"value": "EVERYONE"}));

      const res = await fetch(
        `https://graph-video.facebook.com/${selectedPage.id}/videos`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      console.log("Upload success:", data);
      if (data.id) {
        alert(` Đăng video thành công! ID: https://www.facebook.com/${selectedPage.id}/posts/${data.id}`);
      } else {
        console.error("Upload error:", data);
        alert("Upload thất bại.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Có lỗi xảy ra khi upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: 600, margin: "auto" }}>
      <h2>Đăng video lên Facebook Page</h2>

      {!isLoggedIn && (
        <button onClick={handleLogin}> Đăng nhập Facebook</button>
      )}

      {isLoggedIn && (
        <>
          <div>
            <label>🔹 Chọn Page:</label>
            <select
              value={selectedPage?.id || ""}
              onChange={(e) => {
                const page = pages.find((p) => p.id === e.target.value);
                setSelectedPage(page);
              }}
            >
              <option value="">-- Chọn Page --</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label> Chọn video từ thiết bị:</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <label> Hoặc nhập URL video:</label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label> Tiêu đề:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label> Mô tả:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Công khai video
            </label>
          </div>

          <button onClick={handleVideoUpload} disabled={isUploading}>
            {isUploading ? "Đang đăng..." : "Đăng video"}
          </button>
        </>
      )}
    </div>
  );
};

export default FacebookUploader;
