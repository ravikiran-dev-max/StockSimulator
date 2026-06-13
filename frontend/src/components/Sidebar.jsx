import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, PieChart, Activity, Briefcase, Trophy, User, X, ShieldAlert } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Portfolio', icon: PieChart, path: '/dashboard/portfolio' },
  { name: 'Watchlist', icon: Activity, path: '/dashboard/watchlist' },
  { name: 'Trade', icon: Briefcase, path: '/dashboard/trade' },
  { name: 'Leaderboard', icon: Trophy, path: '/dashboard/leaderboard' },
  { name: 'Profile', icon: User, path: '/dashboard/profile' },
  { name: 'Admin Panel', icon: ShieldAlert, path: '/dashboard/admin', adminOnly: true }
];

export default function Sidebar({ mobile, onClose }) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const sidebarClass = mobile
    ? "w-64 h-full bg-card/95 backdrop-blur-xl border-r border-border flex flex-col z-50"
    : "w-64 border-r border-border bg-card/30 backdrop-blur-md hidden md:flex flex-col z-20";

  // Filter items based on user role: admin only sees Admin Panel
  const visibleItems = navItems.filter(item => {
    if (user?.role === 'admin') {
      return item.adminOnly === true;
    } else {
      return !item.adminOnly;
    }
  });

  return (
    <aside className={sidebarClass}>
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
          StockSimulator
        </h1>
        {mobile && (
          <button 
            onClick={onClose} 
            className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/');
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={mobile ? onClose : undefined}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative ${
                isActive ? 'text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={mobile ? "active-nav-mobile" : "active-nav"}
                  className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/20"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : ''}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <Link 
          to="/dashboard/profile" 
          onClick={mobile ? onClose : undefined}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <User className="h-5 w-5" />
          <span>Profile Settings</span>
        </Link>
      </div>
    </aside>
  );
}

