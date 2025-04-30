import { Route, Routes, useLocation  } from "react-router-dom";
import "./App.css";
import Home from "./pages/Login";
import About from "./pages/About";
import HomePage from "./pages/HomePage";
import NavBar from "./components/NavBar";
import PrivateRoute from "./privateRoute";
import AnalyticsPage from "./pages/Stats";
import CreateVideo from "./pages/CreateVideo"
import TikTokLogin from "./pages/TikTokLogin";
import TikTokCallback from "./pages/TikTokCallback"; 
import TikTokStats from "./pages/TikTokStats";
import TikTokUpload from "./pages/TikTokUpload";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import Workspace from "./pages/Workspace";
import VideoEditor from "./pages/Editor";
import Resource from "./pages/Resource";
import FacebookStatPage from './pages/FacebookStatPage';
import { AuthProvider } from "./context/AuthContext";

function App() {
  const location = useLocation()
  const noNavbarRoutes = ["/", "/login"]
  const shouldShowNavbar = !noNavbarRoutes.includes(location.pathname)

  return (
    <AuthProvider>
      <WorkspaceProvider>
        <div className="mx-auto">
          {shouldShowNavbar && <NavBar />}
          <div className={shouldShowNavbar ? "content-with-navbar" : ""}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/create-video" element={<CreateVideo />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/homepage" element={
                <PrivateRoute><HomePage/></PrivateRoute>} />
              <Route path="/tiktok-login" element={<TikTokLogin />} />
              <Route path="/tiktok-callback" element={<TikTokCallback />} />
              <Route path="/tiktok-upload" element={<TikTokUpload />} />
              <Route
                path="/tiktok-stats"
                element={<TikTokStats />}
              />
              <Route path="/workspace/:id" element={<Workspace></Workspace>} />
              <Route path="/resource" element={<Resource></Resource>} />
              <Route path="/editor" element={<VideoEditor/>} />

              <Route path="/facebook-stats" element={<FacebookStatPage />} />

            </Routes>
          </div>
        </div>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
