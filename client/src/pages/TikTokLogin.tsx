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

    if (error) {
      console.error("TikTok OAuth error:", { error, error_type });
      alert(`Đăng nhập TikTok thất bại: ${error} (${error_type || "Unknown error type"})`);
      return;
    }
    if (access_token) {
      console.log("Access token received:", access_token);
      localStorage.setItem("tiktokAccessToken", access_token);
      navigate("/tiktok-stats");
    }
  }, [searchParams, navigate]);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/auth/init/`);
      const { auth_url, error } = response.data;
      if (error) {
        throw new Error(`Lỗi từ server: ${error}`);
      }
      if (!auth_url) {
        throw new Error("Không nhận được auth URL");
      }
      console.log("Redirecting to TikTok auth:", auth_url);
      window.location.href = auth_url;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error initiating login:", error.message);
      } else {
        console.error("Error initiating login:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[45rem] mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Đăng nhập với TikTok</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogin} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? "Đang xử lý..." : "Đăng nhập TikTok"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
// </DOCUMENT>