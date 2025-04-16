import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Login";
import About from "./pages/About";
import HomePage from "./pages/HomePage";
import NavBar from "./components/NavBar";
import PrivateRoute from "./privateRoute";
import StatPage from "./pages/StatPage";
import CreateVideo from "./pages/CreateVideo"
import TikTokLogin from "./pages/TikTokLogin";
import TikTokCallback from "./pages/TikTokCallback"; 
import TikTokStats from "./pages/TikTokStats";
import TikTokUpload from "./pages/TikTokUpload";

import React, { useEffect } from 'react';
declare const FB: any;
function App() {

  useEffect(() => {
    window.fbAsyncInit = function () {
      FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
    };
    console.log("Facebook SDK Initialized");
   // Tải SDK Facebook từ URL chính thức
    (function (d, s, id) {
      var js: HTMLScriptElement, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/zh_TW/all.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  

  return (
    <div className="max-w-[45rem] mx-auto">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/create-video" element={<CreateVideo />} />
        <Route path="/homepage" element={
          <PrivateRoute><HomePage/></PrivateRoute>} />
        { <Route path="/channelStat/" element={<PrivateRoute><StatPage/></PrivateRoute>} /> }
        {/* <Route path="*" element={<NotFound />} /> */}
        <Route path="/tiktok-login" element={<TikTokLogin />} />
        <Route path="/tiktok-callback" element={<TikTokCallback />} />
        <Route path="/tiktok-upload" element={<TikTokUpload />} />
        <Route
          path="/tiktok-stats"
          element={
              <TikTokStats />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
