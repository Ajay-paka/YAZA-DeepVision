import React from 'react';
import { motion } from 'motion/react';

const ChatEmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Animated Neon Circular Pulse Ring */}
        <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
          {/* Soft Radial Glow */}
          <div className="absolute inset-0 bg-brand/10 rounded-full blur-2xl animate-ring-pulse" />
          
          {/* Pulse Ring */}
          <div className="absolute inset-0 border border-brand/30 rounded-full animate-ring-pulse" />
          
          {/* Rotating Ring */}
          <div className="absolute inset-2 border-t border-brand/40 rounded-full animate-ring-rotate" />
          
          {/* Center Text */}
          <div className="relative z-10 font-bold text-brand tracking-widest text-sm">
            YAZA
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            YAZA DeepVision
          </h2>
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-[0.3em] font-medium">
            Deep Video Analyzer
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatEmptyState;
