import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import TopMarket from "./components/TopMarket";
import SearchCoins from "./components/SearchCoins";
import CoinPage from "./components/CoinPage";

const App = () => {
  return (
    <div>
      <title>CryptoTracker</title>
      <Router>
        <Link to="" style={{ textDecoration: "none", color: "inherit" }}>
          <h1 className="cryptotracker-h1">CryptoTracker</h1>
        </Link>
        <Routes>
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
