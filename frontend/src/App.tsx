import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import TopMarket from "./components/TopMarket";
import SearchCoins from "./components/SearchCoins";
import CoinPage from "./components/CoinPage";
import UserRegister from "./components/Register";
import UserLogin from "./components/Login";

const App = () => {
  return (
    <div>
      <title>CryptoTracker</title>
      <Router>
        <Link to="" style={{ textDecoration: "none", color: "inherit" }}>
          <h1 className="cryptotracker-h1">CryptoTracker</h1>
        </Link>
        <Routes>
          <Route path="/register" element={<UserRegister />}></Route>
          <Route path="/login" element={<UserLogin />}></Route>
          <Route
            path=""
            element={
              <>
                <SearchCoins />
                <TopMarket />
              </>
            }
          ></Route>
          <Route path="/coins/:coinId" element={<CoinPage />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
