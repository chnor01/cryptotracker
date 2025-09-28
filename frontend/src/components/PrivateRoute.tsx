import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface PrivateRouteProps {
  children: React.ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default PrivateRoute;
