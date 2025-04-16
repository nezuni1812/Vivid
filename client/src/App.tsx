import { Route, Routes, useLocation  } from "react-router-dom";
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
import { WorkspaceProvider } from "./context/WorkspaceContext";

function App() {
  const location = useLocation()
  const noNavbarRoutes = ["/", "/login"]
  const shouldShowNavbar = !noNavbarRoutes.includes(location.pathname)

  return (
    <WorkspaceProvider>
      <div className="mx-auto">
        {shouldShowNavbar && <NavBar />}
        <div className={shouldShowNavbar ? "content-with-navbar" : ""}>
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
              element={<TikTokStats />}
            />
          </Routes>
        </div>
      </div>
    </WorkspaceProvider>
  );
}

export default App;
