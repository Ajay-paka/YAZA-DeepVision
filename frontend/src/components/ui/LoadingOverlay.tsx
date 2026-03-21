import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useChat } from '../../context/ChatContext';

const LoadingOverlay: React.FC = () => {
  const { isLoading, loadingStatus } = useChat();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
        >
          <div className="relative flex items-center justify-center">
            {/* Outer glowing ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 rounded-full border-2 border-transparent border-t-brand border-r-brand shadow-[0_0_20px_var(--color-brand-glow)]"
            />
            {/* Inner glowing ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute w-24 h-24 rounded-full border-2 border-transparent border-b-brand border-l-brand opacity-50"
            />
            {/* Center text */}
            <div className="absolute text-brand font-bold tracking-widest text-xl">
              YAZA
            </div>
          </div>
          
          <motion.div
            key={loadingStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-brand/80 font-medium tracking-wide uppercase text-sm"
          >
            {loadingStatus}...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
