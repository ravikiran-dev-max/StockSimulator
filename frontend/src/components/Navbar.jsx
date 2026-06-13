import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut, Trash2, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useStockStore from '../store/useStockStore';
import useNotificationStore from '../store/useNotificationStore';
import api from '../utils/api';

export default function Navbar({ onToggleMobileMenu }) {
  const { user, logout } = useAuthStore();
  const { livePrices } = useStockStore();
  const { notifications, markAllAsRead, clearNotifications } = useNotificationStore();
  const navigate = useNavigate();

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const searchRef = useRef(null);

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Debounced search query fetch
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStocks([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await api.get(`/stocks/search?q=${searchQuery}`);
        setFilteredStocks(data);
      } catch (error) {
        console.error('Error fetching stock search results:', error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user?.token]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSelect = (symbol) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate('/dashboard/trade', { state: { selectedSymbol: symbol, actionType: 'BUY' } });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (filteredStocks.length > 0) {
        handleSearchSelect(filteredStocks[0].symbol);
      }
    }
  };

  const handleNotificationClick = () => {
    const nextShow = !showNotifications;
    setShowNotifications(nextShow);
    if (nextShow) {
      // Mark as read after a short delay so user can see which are unread
      setTimeout(() => {
        markAllAsRead();
      }, 2000);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-30">
      {/* Hamburger Menu Icon for Mobile */}
      <button 
        onClick={onToggleMobileMenu}
        className="md:hidden mr-3 p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        aria-label="Toggle Navigation Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search Input Container */}
      <div className="flex-1 max-w-xl flex items-center relative" ref={searchRef}>
        <Search className="absolute left-3 text-muted-foreground h-4 w-4" />
        <input
          type="text"
          placeholder="Search stocks (e.g. AAPL, Apple)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-input/40 border border-border rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
        />

        {/* Autocomplete Search Dropdown */}
        {showSearchResults && filteredStocks.length > 0 && (
          <div className="absolute top-12 left-0 w-full bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-2 z-50 max-h-[300px] overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Stocks Found
            </div>
            <div className="divide-y divide-border/40">
              {filteredStocks.map((stock) => {
                const price = livePrices[stock.symbol];
                return (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSearchSelect(stock.symbol)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/50 transition-all text-left"
                  >
                    <div>
                      <span className="font-extrabold text-sm text-foreground">{stock.symbol}</span>
                      <span className="text-xs text-muted-foreground ml-2">{stock.name}</span>
                    </div>
                    {price && (
                      <span className="font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-lg">
                        ${parseFloat(price).toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3 md:space-x-6 ml-auto">
        {/* Notification Bell Button */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={handleNotificationClick}
            className="relative text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/30"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-card animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 top-10 w-80 sm:w-96 bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-3 z-50 flex flex-col max-h-[400px] overflow-hidden">
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <span className="font-extrabold text-sm text-foreground">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center space-x-1 font-semibold"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/40 mt-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-3 px-1 transition-colors ${
                        !n.read ? 'bg-primary/5 rounded-xl px-2' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-foreground block">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center border-l border-border pl-3 md:pl-6 space-x-2 md:space-x-3">
          <Link to={user?.role === 'admin' ? "/dashboard/admin" : "/dashboard/profile"} className="flex items-center space-x-2 md:space-x-3 hover:opacity-80 transition-opacity">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover shadow-md border border-primary/20"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground leading-none">{user?.name}</p>
              {user?.role === 'admin' ? (
                <p className="text-xs text-muted-foreground mt-1 font-semibold">System Administrator</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1 font-semibold">
                  $
                  {user?.balance?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              )}
            </div>
          </Link>
          <button onClick={logout} className="ml-1 md:ml-2 text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-muted/30">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}


