import { useState } from "react";
import { UserLogin } from "../api/cryptoApi";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getCurrentUser } from "../api/cryptoApi";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await UserLogin(username, password);
      const userData = await getCurrentUser();
      setUser(userData);
      navigate("/");
    } catch (err: any) {
      setError("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="form-container">
        <h2 className="register-title">Sign in</h2>
        <form onSubmit={handleLogin} className="register-form">
          <input
            className={`form-field ${error ? "input-error" : ""}`}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className={`form-field ${error ? "input-error" : ""}`}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-text">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="submit-register-button"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="signin-text">
          No account?<Link to="/register">Register here.</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
