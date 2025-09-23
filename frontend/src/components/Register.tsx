import { useState } from "react";
import { UserRegister } from "../api/cryptoApi";
import { useNavigate, Link } from "react-router-dom";
import {
  validateUsername,
  validateEmail,
  validatePassword,
} from "../helper/ValidateRegistration";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
  }>({});
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};
    if (!validateUsername(username)) {
      newErrors.username = "Must be 3–20 chars.";
    }
    if (!validateEmail(email)) {
      newErrors.email = "Invalid email.";
    }
    if (!validatePassword(password)) {
      newErrors.password = "Must be at least 8 chars.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await UserRegister(username, email, password);
      setMessage(res.msg);
      navigate("/login");
    } catch (err: any) {
      if (err.response && err.response.data?.detail) {
        setMessage(`${err.response.data.detail}`);
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="form-container">
        <h2 className="register-title">Create a CryptoTracker Account</h2>
        <form onSubmit={handleRegister} className="register-form">
          <input
            className={`form-field ${errors.username ? "input-error" : ""}`}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {errors.username && <p className="error-text">{errors.username}</p>}

          <input
            className={`form-field ${errors.email ? "input-error" : ""}`}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className="error-text">{errors.email}</p>}

          <input
            className={`form-field ${errors.password ? "input-error" : ""}`}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="error-text">{errors.password}</p>}

          <button
            type="submit"
            disabled={loading}
            className="submit-register-button"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="signin-text">
          Already have an account? <Link to="/login">Sign in here.</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
