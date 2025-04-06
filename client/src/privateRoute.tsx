import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const isAuthenticated = !!localStorage.getItem("currentUser");

  return isAuthenticated ? children : <Navigate to="/" />;
};

export default PrivateRoute;