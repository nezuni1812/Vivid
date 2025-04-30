"use client";

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Video, ChevronDown, LogOut, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, userName, photoURL, userEmail, signIn, signOut, isLoading } = useAuth();

  // Check if the link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Redirect to login page if not signed in, but only after auth state is loaded
  useEffect(() => {
    if (!isLoading && !isSignedIn && location.pathname !== "/") {
      navigate("/");
    }
  }, [isLoading, isSignedIn, location.pathname, navigate]);

  // Change Google account
  const changeGoogleAccount = async () => {
    try {
      await signIn();
      window.location.reload();
      setIsProfileOpen(false);
    } catch (error) {
      console.error("Error changing Google account:", error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    signOut();
    navigate("/");
    setIsProfileOpen(false);
  };

  // Navigation links
  const navLinks = [
    { name: "Trang chủ", path: "/homepage" },
    { name: "Thông tin", path: "/about" },
    { name: "Thống kê", path: "/analytics" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isProfileOpen && !target.closest(".profile-dropdown")) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md py-2" : "bg-white/80 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/homepage" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Vivid</span>
          </Link>

          {/* Desktop Navigation */}
          {isSignedIn && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}

          {/* User Profile */}
          <div className="relative profile-dropdown">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              disabled={!isSignedIn}
            >
              <img
                src={photoURL || "/placeholder.svg"}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-gray-700">
                {userName || "Tài khoản"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && isSignedIn && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
              >
                <button
                  onClick={changeGoogleAccount}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Thay đổi tài khoản
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </button>
              </motion.div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mt-4 pb-4"
          >
            <div className="flex flex-col space-y-2">
              {isSignedIn &&
                navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isActive(link.path)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              <hr className="my-2 border-gray-200" />
              {isSignedIn ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-700">{userEmail}</div>
                  <button
                    onClick={() => {
                      changeGoogleAccount();
                      setIsOpen(false);
                    }}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center w-full text-left"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Thay đổi tài khoản
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center w-full text-left"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </button>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
