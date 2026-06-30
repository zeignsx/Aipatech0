import { motion } from 'framer-motion';
import { Wrench, Clock, Mail, RefreshCw, Shield, AlertTriangle } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface MaintenancePageProps {
  message?: string;
  until?: string;
}

export function MaintenancePage({ message, until }: MaintenancePageProps) {
  const defaultMessage = "We're currently performing scheduled maintenance to improve your experience.";
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-blue-500/5 to-cyan-500/5 blur-2xl"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-full shadow-2xl">
            <Wrench className="w-16 h-16 text-white animate-bounce" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4"
        >
          Maintenance Mode
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-gray-300 max-w-md mb-6"
        >
          {message || defaultMessage}
        </motion.p>

        {/* Estimated Time */}
        {until && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full mb-8"
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-300">
              Estimated completion: {new Date(until).toLocaleString()}
            </span>
          </motion.div>
        )}

        {/* Status Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-full">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-yellow-400">Under Maintenance</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full">
            <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
            <span className="text-xs text-blue-400">Auto-refresh: 30s</span>
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-gray-400 mb-4">Need immediate assistance?</p>
          <a
            href="mailto:support@aipatechenergy.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-[1.02]"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </motion.div>

        {/* Auto-refresh script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            setTimeout(function() {
              location.reload();
            }, 30000);
          `
        }} />
      </div>

      {/* Decorative Bottom Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
    </div>
  );
}