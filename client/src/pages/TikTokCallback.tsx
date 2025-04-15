// <DOCUMENT filename="pages/TikTokCallback.tsx">
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function TikTokCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    console.log("TikTokCallback received:", { code, state, error });

    // Redirect to Flask callback
    const flaskCallback = `http://localhost:5000/callback?code=${encodeURIComponent(code || '')}&state=${encodeURIComponent(state || '')}${error ? `&error=${encodeURIComponent(error)}` : ''}`;
    window.location.href = flaskCallback;
  }, [searchParams]);

  return <div className="p-6 text-center">Đang xử lý đăng nhập...</div>;
}
// </DOCUMENT>