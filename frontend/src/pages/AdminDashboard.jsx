import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingDown, 
  Search, 
  Edit2, 
  Trash2, 
  Plus, 
  ShieldAlert, 
  Activity, 
  Check, 
  X, 
  DollarSign,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';
import { getStockName } from '../utils/stockHelpers';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'stocks', 'activities'
  
  // Data states
  const [usersList, setUsersList] = useState([]);
  const [removedStocks, setRemovedStocks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSearchResults, setStockSearchResults] = useState([]);
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const stockSearchRef = useRef(null);

  // Edit User Modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user', balance: 0 });
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsersList(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch removed stocks
  const fetchRemovedStocks = async () => {
    try {
      const { data } = await api.get('/admin/stocks/removed');
      setRemovedStocks(data);
    } catch (err) {
      console.error('Failed to fetch removed stocks', err);
    }
  };

  // Fetch activities
  const fetchActivities = async () => {
    try {
      const { data } = await api.get('/admin/activities');
      setActivities(data);
    } catch (err) {
      console.error('Failed to fetch activities', err);
    }
  };

  // Initial load and tab transitions
  useEffect(() => {
    if (user?.token) {
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'stocks') fetchRemovedStocks();
      if (activeTab === 'activities') fetchActivities();
    }
  }, [activeTab, user?.token]);

  // Stock search debounce
  useEffect(() => {
    if (stockSearchQuery.trim() === '') {
      setStockSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await api.get(`/stocks/search?q=${stockSearchQuery}`);
        setStockSearchResults(data);
      } catch (err) {
        console.error('Error searching stocks:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [stockSearchQuery, user?.token]);

  // Click outside listener for stock autocomplete
  useEffect(() => {
    function handleClickOutside(event) {
      if (stockSearchRef.current && !stockSearchRef.current.contains(event.target)) {
        setShowStockDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Blacklist stock
  const handleRemoveStock = async (symbol) => {
    try {
      await api.post(
        '/admin/stocks/remove',
        { symbol }
      );
      setStockSearchQuery('');
      setShowStockDropdown(false);
      fetchRemovedStocks();
    } catch (err) {
      console.error('Failed to remove stock', err);
    }
  };

  // Handle Restore stock
  const handleRestoreStock = async (symbol) => {
    try {
      await api.delete(`/admin/stocks/removed/${symbol}`);
      fetchRemovedStocks();
    } catch (err) {
      console.error('Failed to restore stock', err);
    }
  };

  // Open Edit User modal
  const openEditModal = (u) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      balance: u.balance
    });
    setModalError('');
    setModalSuccess('');
  };

  // Submit Edit User
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    try {
      await api.put(
        `/admin/users/${editingUser._id}`,
        editForm
      );
      setModalSuccess('User profile updated successfully!');
      fetchUsers();
      setTimeout(() => setEditingUser(null), 1000);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Update failed');
    }
  };

  // Filter users based on search
  const filteredUsers = usersList.filter(
    u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
         u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Console</h2>
          <p className="text-muted-foreground">Manage users, blacklist equities, and audit live market activity.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex space-x-1.5 bg-muted/65 p-1 rounded-xl w-full sm:w-auto">
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'stocks', label: 'Stock Controls', icon: ShieldAlert },
            { id: 'activities', label: 'Audit Log', icon: Activity }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                activeTab === t.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search and stats bar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-card/40 border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                />
              </div>
              <button 
                onClick={fetchUsers} 
                className="flex items-center justify-center space-x-1 px-4 py-2 border border-border bg-card/20 rounded-xl text-xs font-bold hover:bg-card/40 transition-all text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Users</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-4 shadow-sm overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3 text-right">Cash Balance</th>
                    <th className="py-3 px-3 text-right">Portfolio Value</th>
                    <th className="py-3 px-3 text-right">Total Wealth</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground flex items-center space-x-2">
                        {u.profileImage ? (
                          <img src={u.profileImage} alt={u.name} className="h-6 w-6 rounded-full object-cover border border-primary/20" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-[10px]">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          u.role === 'admin' 
                            ? 'bg-primary/10 text-primary border-primary/20' 
                            : 'bg-muted/40 text-muted-foreground border-border/60'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-foreground">
                        ${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">
                        ${u.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-foreground">
                        ${u.totalWealth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors inline-flex"
                          title="Edit user profile"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-muted-foreground">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* STOCKS TAB */}
        {activeTab === 'stocks' && (
          <motion.div
            key="stocks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 md:grid-cols-7"
          >
            {/* Left side: search and remove */}
            <div className="md:col-span-3 space-y-4">
              <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-lg flex items-center">
                  <ShieldAlert className="h-5 w-5 mr-2 text-primary" />
                  Blacklist Stock Ticker
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Removing a stock ticker makes it untradeable, deletes it from all active users' watchlists, and hides it from stock searches.
                </p>

                <div className="relative" ref={stockSearchRef}>
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 text-muted-foreground h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search stock ticker to remove..."
                      value={stockSearchQuery}
                      onChange={(e) => {
                        setStockSearchQuery(e.target.value);
                        setShowStockDropdown(true);
                      }}
                      onFocus={() => setShowStockDropdown(true)}
                      className="w-full bg-input/40 border border-border rounded-xl py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                    />
                  </div>

                  {/* Stock search results overlay */}
                  {showStockDropdown && stockSearchResults.length > 0 && (
                    <div className="absolute top-10 left-0 w-full bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-xl p-2 z-50 max-h-[180px] overflow-y-auto">
                      {stockSearchResults.map(stock => (
                        <button
                          key={stock.symbol}
                          onClick={() => handleRemoveStock(stock.symbol)}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all text-left text-xs"
                        >
                          <div>
                            <span className="font-extrabold text-foreground">{stock.symbol}</span>
                            <span className="text-[10px] text-muted-foreground ml-2 truncate max-w-[120px] inline-block align-bottom">{stock.name}</span>
                          </div>
                          <span className="text-[9px] bg-destructive/15 text-destructive px-1.5 py-0.5 rounded font-bold">Remove</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: blacklisted list */}
            <div className="md:col-span-4 bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-4">Removed Stocks List</h3>
                {removedStocks.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">No stocks are currently removed.</div>
                ) : (
                  <div className="divide-y divide-border/60 max-h-[300px] overflow-y-auto pr-1">
                    {removedStocks.map(stock => (
                      <div key={stock._id} className="flex justify-between items-center py-2.5">
                        <div>
                          <span className="font-extrabold text-foreground block text-sm">{stock.symbol}</span>
                          <span className="text-[10px] text-muted-foreground block">{getStockName(stock.symbol)}</span>
                        </div>
                        <button
                          onClick={() => handleRestoreStock(stock.symbol)}
                          className="text-primary hover:text-primary-foreground border border-primary/30 hover:bg-primary font-bold px-3 py-1 rounded-lg transition-all text-xs"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* AUDIT LOG TAB */}
        {activeTab === 'activities' && (
          <motion.div
            key="activities"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                Global Transaction Feed
              </h3>
              <button 
                onClick={fetchActivities} 
                className="text-xs text-primary font-semibold hover:underline"
              >
                Refresh Log
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">No transaction records found in the system.</div>
            ) : (
              <div className="overflow-x-auto max-h-[450px]">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold sticky top-0 bg-card">
                      <th className="py-2 px-2">User</th>
                      <th className="py-2 px-2">Type</th>
                      <th className="py-2 px-2">Symbol</th>
                      <th className="py-2 px-2 text-right">Shares</th>
                      <th className="py-2 px-2 text-right">Price</th>
                      <th className="py-2 px-2 text-right">Total Order Value</th>
                      <th className="py-2 px-2 text-right">Date/Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {activities.map((t) => (
                      <tr key={t._id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-2.5 px-2 font-medium text-foreground flex items-center space-x-1.5">
                          {t.user?.profileImage ? (
                            <img src={t.user.profileImage} alt={t.user.name} className="h-5 w-5 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center font-bold text-[9px]">
                              {t.user?.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="leading-tight">
                            <span className="block text-xs font-semibold">{t.user?.name || 'Unknown User'}</span>
                            <span className="text-[9px] text-muted-foreground">{t.user?.email}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block border ${
                            t.type === 'BUY' 
                              ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-extrabold text-foreground">{t.symbol}</td>
                        <td className="py-2.5 px-2 text-right">{t.quantity}</td>
                        <td className="py-2.5 px-2 text-right">${t.price.toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-foreground">
                          ${(t.quantity * t.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-2 text-right text-xs text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT USER PROFILE MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              onClick={() => setEditingUser(null)}
            />

            {/* Modal Dialog */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl z-10"
            >
              <button 
                onClick={() => setEditingUser(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="font-extrabold text-xl mb-4 flex items-center text-foreground">
                <Edit2 className="h-5 w-5 mr-2 text-primary" />
                Edit User Profile
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-input/40 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-input/40 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full bg-input/40 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground font-semibold"
                    >
                      <option value="user" className="bg-card text-foreground">USER</option>
                      <option value="admin" className="bg-card text-foreground">ADMIN</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Cash Balance ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={editForm.balance}
                      onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                      className="w-full bg-input/40 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground font-semibold"
                    />
                  </div>
                </div>

                {modalError && (
                  <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-xl flex items-center space-x-1.5">
                    <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {modalSuccess && (
                  <div className="bg-green-500/10 text-green-500 text-xs p-3 rounded-xl flex items-center space-x-1.5">
                    <Check className="h-4 w-4 flex-shrink-0" />
                    <span>{modalSuccess}</span>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 bg-card hover:bg-muted/50 text-foreground border border-border font-semibold py-2 rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground font-semibold py-2 rounded-xl text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
