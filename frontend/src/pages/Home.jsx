import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, ShieldCheck, Cpu, Trophy, BarChart3, ChevronRight, HelpCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useStockStore from '../store/useStockStore';

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const livePrices = useStockStore((state) => state.livePrices);
  const navigate = useNavigate();

  const handleLaunch = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const featuredStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'TSLA', name: 'Tesla Motors' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="h-20 border-b border-border bg-background/20 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-md shadow-primary/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
            StockSimulator
          </span>
        </div>

        <nav className="flex items-center space-x-4">
          {user ? (
            <Link 
              to="/dashboard" 
              className="text-sm font-semibold hover:text-primary transition-colors mr-2 hidden sm:block"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-sm font-semibold hover:text-primary transition-colors px-3 py-2"
              >
                Log In
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 md:py-20 z-10">
        <div className="max-w-4xl mx-auto text-center px-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-primary mb-3"
          >
            <span>⚡ Real-Time Trading Simulator</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-foreground"
          >
            Master the Markets, <br />
            <span className="bg-gradient-to-r from-primary via-indigo-400 to-accent bg-clip-text text-transparent">
              Risk-Free in Real-Time
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Experience live market volatility, construct a virtual stock portfolio, and utilize state-of-the-art AI-driven insights to refine your investing strategy—all using a default $10,000 starting cash balance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-primary-foreground font-black px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center space-x-2 text-base group"
            >
              <span>Start Your Journry</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const featuresSection = document.getElementById('features');
                featuresSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto bg-card/40 hover:bg-card/70 border border-border backdrop-blur-md text-foreground font-bold px-8 py-4 rounded-2xl transition-all"
            >
              Learn More
            </button>
          </motion.div>
        </div>

        {/* Live Market Marquee */}
        <div className="w-full mt-16 border-y border-border/60 bg-card/10 backdrop-blur-sm py-4 overflow-hidden relative">
          <div className="flex w-[200%] animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused] space-x-12 px-6">
            {/* Repeat list twice to ensure infinite scroll */}
            {[...featuredStocks, ...featuredStocks, ...featuredStocks].map((stock, idx) => {
              const price = livePrices[stock.symbol] ? parseFloat(livePrices[stock.symbol]).toFixed(2) : '---.--';
              return (
                <div key={idx} className="flex items-center space-x-3 bg-card/40 border border-border px-4 py-2 rounded-xl shadow-sm min-w-[180px]">
                  <span className="font-extrabold text-sm">{stock.symbol}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{stock.name}</span>
                  <span className="text-sm font-black text-foreground ml-auto">${price}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features Grid */}
        <section id="features" className="py-20 px-6 max-w-6xl mx-auto w-full space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight">Robust Simulator Features</h2>
            <p className="text-sm text-muted-foreground">Everything you need to practice, track, and master equities trading.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-card/30 backdrop-blur-md p-6 rounded-2xl border border-border/80 shadow-sm flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all group">
              <div className="p-3 bg-primary/10 text-primary rounded-xl h-fit w-fit mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">Real-Time Data</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Live ticking simulated prices updated every 2 seconds via WebSockets, mirroring market volatility.
                </p>
              </div>
            </div>

            <div className="bg-card/30 backdrop-blur-md p-6 rounded-2xl border border-border/80 shadow-sm flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all group">
              <div className="p-3 bg-green-500/10 text-green-500 rounded-xl h-fit w-fit mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-green-500 transition-colors">Risk-Free Funds</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Start with a default balance of $10,000 in paper trading credit. Practice buy and sell trades risk-free.
                </p>
              </div>
            </div>

            <div className="bg-card/30 backdrop-blur-md p-6 rounded-2xl border border-border/80 shadow-sm flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all group">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl h-fit w-fit mb-4">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-purple-500 transition-colors">AI Insights</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Powered by Gemini AI, inspect your active portfolio to evaluate risk analysis and receive diversification suggestions.
                </p>
              </div>
            </div>

            <div className="bg-card/30 backdrop-blur-md p-6 rounded-2xl border border-border/80 shadow-sm flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all group">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl h-fit w-fit mb-4">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-amber-500 transition-colors">Leaderboard</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Compete with other users based on total wealth (buying power + portfolio value) and rank as a top trader.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 StockSimulator. All rights reserved. Created for educational trading training.</p>
          <div className="flex space-x-4">
            <Link to="/login" className="hover:text-foreground transition-colors">Log In</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
