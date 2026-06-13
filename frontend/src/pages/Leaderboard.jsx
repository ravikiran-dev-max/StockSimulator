import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Activity, Award, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' or 'activity'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user?.token) return;
    try {
      const [leaderboardRes, activitiesRes] = await Promise.all([
        api.get('/users/leaderboard'),
        api.get('/users/activities')
      ]);
      setLeaderboard(leaderboardRes.data);
      setActivities(activitiesRes.data);
    } catch (err) {
      console.error('Failed to fetch leaderboard or activity data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 10 seconds to keep live feed fresh
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user?.token]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getTrophyColor = (index) => {
    if (index === 0) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'; // Gold
    if (index === 1) return 'text-slate-400 bg-slate-400/10 border-slate-400/20'; // Silver
    if (index === 2) return 'text-amber-700 bg-amber-700/10 border-amber-700/20'; // Bronze
    return 'text-muted-foreground bg-muted border-transparent';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Community Hub</h2>
          <p className="text-muted-foreground">See how you rank against other traders and monitor live activity.</p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing || loading}
          className="flex items-center space-x-1.5 text-xs bg-muted/60 hover:bg-muted font-bold px-3 py-2 rounded-xl transition-all border border-border"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center space-x-2 pb-3 px-4 font-bold text-sm border-b-2 transition-all relative ${
            activeTab === 'leaderboard'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Global Leaderboard</span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center space-x-2 pb-3 px-4 font-bold text-sm border-b-2 transition-all relative ${
            activeTab === 'activity'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Live Activity Feed</span>
        </button>
      </div>

      {/* Content Panels */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground animate-pulse">Loading community data...</div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'leaderboard' ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium pb-2">
                      <th className="py-3 px-2 w-[80px]">Rank</th>
                      <th className="py-3 px-2">Trader</th>
                      <th className="py-3 px-2 text-right">Cash Balance</th>
                      <th className="py-3 px-2 text-right">Portfolio Value</th>
                      <th className="py-3 px-2 text-right">Total Net Worth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {leaderboard.map((trader, index) => {
                      const isCurrentUser = trader._id === user?._id;
                      const hasAvatar = trader.profileImage;

                      return (
                        <tr
                          key={trader._id}
                          className={`transition-colors ${
                            isCurrentUser
                              ? 'bg-primary/5 hover:bg-primary/10 font-medium'
                              : 'hover:bg-muted/30'
                          }`}
                        >
                          <td className="py-4 px-2">
                            {index < 3 ? (
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-black border flex items-center justify-center w-8 h-8 ${getTrophyColor(
                                  index
                                )}`}
                              >
                                <Award className="h-3.5 w-3.5" />
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-semibold pl-2">#{index + 1}</span>
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center space-x-3">
                              {hasAvatar ? (
                                <img
                                  src={trader.profileImage}
                                  alt={trader.name}
                                  className="h-9 w-9 rounded-full object-cover border border-border shadow-sm"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary/80 to-accent/80 text-primary-foreground font-bold flex items-center justify-center text-sm">
                                  {trader.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="text-foreground font-bold block">
                                  {trader.name} {isCurrentUser && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full ml-1">YOU</span>}
                                </span>
                                <span className="text-xs text-muted-foreground block">{trader.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-right font-medium">
                            ${trader.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-2 text-right font-medium">
                            ${trader.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-2 text-right font-bold text-foreground">
                            ${trader.totalWealth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {activities.length === 0 ? (
                <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-12 text-center text-muted-foreground shadow-sm">
                  No trade activity has been logged on the platform yet.
                </div>
              ) : (
                <div className="grid gap-3">
                  {activities.map((act) => {
                    const isBuy = act.type === 'BUY';
                    const actUser = act.user || { name: 'Anonymous', profileImage: '' };
                    const hasAvatar = actUser.profileImage;

                    return (
                      <motion.div
                        key={act._id}
                        layout
                        className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-4 shadow-sm flex items-center justify-between hover:border-border/80 transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          {hasAvatar ? (
                            <img
                              src={actUser.profileImage}
                              alt={actUser.name}
                              className="h-10 w-10 rounded-full object-cover border border-border shadow-sm"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary/80 to-accent/80 text-primary-foreground font-bold flex items-center justify-center text-sm">
                              {actUser.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              <span className="font-extrabold">{actUser.name}</span>{' '}
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block mx-1 ${
                                  isBuy ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
                                }`}
                              >
                                {act.type}
                              </span>{' '}
                              <span className="font-bold text-foreground">{act.quantity}</span> shares of{' '}
                              <span className="font-extrabold text-foreground">{act.symbol}</span>
                            </p>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              {new Date(act.createdAt).toLocaleDateString()} {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-foreground block">
                            ${(act.quantity * act.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            at ${act.price.toFixed(2)}/share
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
