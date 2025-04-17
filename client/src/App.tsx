import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Login";
import About from "./pages/About";
import HomePage from "./pages/HomePage";
import NavBar from "./components/NavBar";
import PrivateRoute from "./privateRoute";
import StatPage from "./pages/StatPage";
import Workspace from "./pages/Workspace";
import VideoEditor from "./pages/Editor";
import Resource from "./pages/Resource";

function App() {
  return (
    <div className=" mx-auto">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/homepage" element={
          <PrivateRoute><HomePage/></PrivateRoute>} />
        { <Route path="/channelStat/" element={<PrivateRoute><StatPage/></PrivateRoute>} /> }
        {/* <Route path="*" element={<NotFound />} /> */}
        <Route path="/workspace/:id" element={<Workspace></Workspace>} />
        <Route path="/resource" element={<Resource></Resource>} />
        <Route path="/editor" element={<VideoEditor/>} />
      </Routes>
    </div>
  );
}

export default App;
