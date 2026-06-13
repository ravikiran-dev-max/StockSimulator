import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import useNotificationStore from '../store/useNotificationStore';

export default function ToastContainer() {
  const toasts = useNotificationStore((state) => state.toasts);
  const removeToast = useNotificationStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-[420px] px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            toast={toast} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ toast, onClose }) {
  const { title, message, type } = toast;

  // Icons and borders according to notification type
  const config = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      progressColor: 'bg-green-500',
    },
    error: {
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      progressColor: 'bg-red-500',
    },
    info: {
      icon: Info,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      progressColor: 'bg-primary',
    }
  };

  const currentConfig = config[type] || config.info;
  const Icon = currentConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      className={`pointer-events-auto w-full bg-card/85 backdrop-blur-xl border ${currentConfig.borderColor} rounded-2xl shadow-xl p-4 flex gap-3 relative overflow-hidden`}
    >
      {/* Icon */}
      <div className={`p-2 rounded-xl h-fit ${currentConfig.bgColor}`}>
        <Icon className={`h-5 w-5 ${currentConfig.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pr-4">
        <h4 className="font-extrabold text-sm text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{message}</p>
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/40 transition-colors h-fit"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress Bar Timer Animation */}
      <motion.div 
        className={`absolute bottom-0 left-0 h-1 ${currentConfig.progressColor}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 4, ease: 'linear' }}
      />
    </motion.div>
  );
}
