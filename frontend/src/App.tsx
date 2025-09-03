import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import TopMarket from './components/TopMarket';
import SearchCoins from './components/SearchCoins';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav>
      {location.pathname === "/topcap" && (
        <Link to="/">
          <div className="button-container">
            <button className="dark-btn">Back to dashboard</button>
          </div>
        </Link>
      )}
      {location.pathname === "/search" && (
        <Link to="/search">
          <div className="button-container">
            <button className="dark-btn">Back to dashboard</button>
          </div>
        </Link>
      )}
    </nav>
  );
};


const App = () => {
  return (
    <Router>
      <div>
        <Navigation />
        <Routes>
          <Route path="/topcap" element={<TopMarket />} />
          <Route path="search" element={<SearchCoins />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
