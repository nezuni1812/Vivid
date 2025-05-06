// <DOCUMENT filename="pages/TikTokLogin.tsx">
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import axios from "axios";

const BACKEND_URL = "http://localhost:5000";

export default function TikTokLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    const error_type = searchParams.get("error_type");
    const access_token = searchParams.get("access_token");
  
    console.log("TikTokLogin params:", { error, error_type, access_token });
  
    if (window.opener) {
      window.opener.postMessage(
        { accessToken: access_token, error, error_type },
        window.location.origin
      );
      window.close(); 
      return;
    }

    if (error) {
      console.error("TikTok OAuth error:", { error, error_type });
      alert(`Đăng nhập TikTok thất bại: ${error} (${error_type || "Unknown error type"})`);
      return;
    }
    if (access_token) {
      // console.log("Access token received:", access_token);
      localStorage.setItem("tiktok_access_token", access_token);
      // navigate("/tiktok-stats");
    }
  }, [searchParams, navigate]);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/auth/init/`, { withCredentials: true });
      const { auth_url, error } = response.data;
      if (error) {
        throw new Error(`Lỗi từ server: ${error}`);
      }
      if (!auth_url) {
        throw new Error("Không nhận được auth URL");
      }
  
      console.log("Redirecting to TikTok auth in popup:", auth_url);
      const popup = window.open(
        auth_url,
        'TikTokAuthPopup',
        'width=600,height=600,scrollbars=no'
      );
  
      if (!popup) {
        alert("Trình duyệt đã chặn cửa sổ popup. Vui lòng cho phép để tiếp tục.");
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button onClick={handleLogin} disabled={isLoading} className="w-full bg-black hover:bg-slate-700">
      {isLoading ? "Đang xử lý..." : "Đăng nhập TikTok"}
    </Button>
  );
}
// </DOCUMENT>