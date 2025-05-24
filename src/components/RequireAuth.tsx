import { Navigate } from "react-router-dom";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  // return token ? children : <Navigate to="/auth/login" replace />; // Old line
  return (token && token.trim() !== '') ? children : <Navigate to="/auth/login" replace />; // New line
};

export default RequireAuth;