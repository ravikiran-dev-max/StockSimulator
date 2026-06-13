import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, Wallet, Upload, Check, AlertCircle, Calendar, Briefcase, FileText } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useStockStore from '../store/useStockStore';
import api from '../utils/api';

export default function Profile() {
  const { user, updateProfileDetails, uploadProfileImage, isLoading, error } = useAuthStore();
  const { portfolio, watchlist, fetchPortfolio, fetchWatchlist } = useStockStore();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [transactionCount, setTransactionCount] = useState(0);
  
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  // Fetch metrics (watchlist size, holdings size, trade counts)
  useEffect(() => {
    if (user?.token) {
      fetchPortfolio();
      fetchWatchlist();

      // Fetch transaction count
      api.get('/users/transactions')
      .then(res => setTransactionCount(res.data.length))
      .catch(err => console.error(err));
    }
  }, [user?.token]);

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const success = await updateProfileDetails(name, email);
    if (success) {
      setSuccessMsg('Profile details updated successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(error || 'Failed to update profile details');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSuccessMsg(null);
    setErrorMsg(null);

    const success = await uploadProfileImage(file);
    if (success) {
      setSuccessMsg('Profile image updated successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(error || 'Image upload failed. Make sure it is a valid image under 5MB.');
    }
  };

  // Dynamic portfolio values
  const totalHoldingsValue = portfolio.reduce((sum, item) => sum + (item.quantity * item.averageBuyPrice), 0);
  const totalNetWorth = user.balance + totalHoldingsValue;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">Manage your personal settings, upload avatars, and view trade metrics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Avatar Card */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm flex flex-col items-center text-center space-y-4"
        >
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="h-28 w-28 rounded-full object-cover shadow-lg border-2 border-primary/20 group-hover:opacity-75 transition-opacity"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground font-black text-4xl flex items-center justify-center shadow-lg group-hover:opacity-75 transition-opacity">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="h-6 w-6 text-white" />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div>
            <h3 className="font-bold text-xl text-foreground flex items-center justify-center space-x-1">
              <span>{user?.name}</span>
            </h3>
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full inline-block mt-2 font-medium">
              Trader Account
            </span>
          </div>

          <div className="w-full border-t border-border/60 pt-4 text-left space-y-2.5 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> Joined Date</span>
              <span className="font-medium text-foreground">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
            </div>
          </div>
        </motion.div>

        {/* Center/Right Side: Forms and Stats */}
        <div className="md:col-span-2 space-y-6">
          {/* Settings Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm"
          >
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              Edit Profile
            </h3>

            <AnimatePresence mode="wait">
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-500/10 text-green-500 text-sm p-3 rounded-lg flex items-center space-x-2 mb-4"
                >
                  <Check className="h-4 w-4" />
                  <span>{successMsg}</span>
                </motion.div>
              )}

              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center space-x-2 mb-4"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-input/40 border border-border rounded-xl py-2 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-input/40 border border-border rounded-xl py-2 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/95 transition-all text-sm shadow-md"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </motion.div>

          {/* User Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm"
          >
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-primary" />
              Trading Metrics
            </h3>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-center">
                <Wallet className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <span className="text-2xl font-bold text-foreground block">
                  ${user?.balance?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Cash</span>
              </div>

              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-center">
                <Briefcase className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <span className="text-2xl font-bold text-foreground block">
                  ${totalHoldingsValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Assets</span>
              </div>

              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-center">
                <FileText className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <span className="text-2xl font-bold text-foreground block">{transactionCount}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Trades</span>
              </div>

              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-center">
                <Shield className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <span className="text-2xl font-bold text-foreground block">{watchlist.length}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Watchlist</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
