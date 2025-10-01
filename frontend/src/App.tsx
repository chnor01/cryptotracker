import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import TopMarket from "./components/TopMarket";
import SearchCoins from "./components/SearchCoins";
import CoinPage from "./components/CoinPage";
import UserRegister from "./components/Register";
import UserLogin from "./components/Login";
import Portfolio from "./components/Portfolio";
import { useAuth } from "./components/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import defaultUser from "./assets/icons/defaultuser.png";
import portfolio from "./assets/icons/portfolio.png";

const App = () => {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  if (loading) return null;

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div>
      <title>CryptoTracker</title>
      <div className="auth-buttons">
        {user ? (
          <div>
            <img
              className="user-image"
              src={defaultUser}
              onClick={toggleMenu}
            />
            {menuOpen && (
              <div className="dropdown-menu">
                <span>Hi, {user.username}</span>
                <button
                  className="logout-btn"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          !isAuthPage && (
            <>
              <Link to="/login">
                <button className="login-btn">Login</button>
              </Link>
              <Link to="/register">
                <button className="register-btn">Register</button>
              </Link>
            </>
          )
        )}
      </div>

      <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
        <h1 className="cryptotracker-h1">CryptoTracker</h1>
      </Link>
      <Link to="/portfolio">
        <button className="portfolio-btn">
          <img className="portfolio-image" src={portfolio} />
          Portfolio
        </button>
      </Link>
      <Routes>
        <Route path="/register" element={<UserRegister />}></Route>
        <Route path="/login" element={<UserLogin />}></Route>
        <Route
          path="/"
          element={
            <>
              <SearchCoins />
              <TopMarket />
            </>
          }
        ></Route>
        <Route path="/coins/:coinId" element={<CoinPage />} />
        <Route
          path="/portfolio"
          element={
            <PrivateRoute>
              <Portfolio />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
