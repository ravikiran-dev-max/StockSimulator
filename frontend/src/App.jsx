import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuthStore from './store/useAuthStore';
import useStockStore from './store/useStockStore';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './layouts/Layout';
import Portfolio from './pages/Portfolio';
import Watchlist from './pages/Watchlist';
import Trade from './pages/Trade';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  return user && user.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

function App() {
  const setLivePrices = useStockStore((state) => state.setLivePrices);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const socket = io('http://localhost:5001');
    
    socket.on('connect', () => {
      console.log('Connected to socket server');
      if (user) {
        socket.emit('join_user_room', user._id);
      }
    });

    socket.on('stock_prices', (prices) => {
      setLivePrices(prices);
    });

    return () => {
      socket.disconnect();
    };
  }, [setLivePrices, user]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="trade" element={<Trade />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

