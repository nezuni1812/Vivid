import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Login";
import About from "./pages/About";
import HomePage from "./pages/HomePage";
import NavBar from "./components/NavBar";

function App() {
  return (
    <div className="max-w-[45rem] mx-auto">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/homepage" element={<HomePage />} />
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </div>
  );
}

export default App;
