import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Bot, MessageSquare } from 'lucide-react';
import { AIChatDrawer } from '../ai/AIChatDrawer';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setMobileOpen(prev => !prev)} onOpenAiChat={() => setChatOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <button
        type="button"
        onClick={() => setChatOpen(prev => !prev)}
        aria-label="Toggle AI Academic Copilot"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md hover:bg-slate-800 dark:hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-xs font-semibold tracking-wide"
      >
        <Bot className="w-4 h-4 text-sky-400 dark:text-sky-600" />
        <span className="hidden sm:inline">AI Copilot</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
      </button>

      <AIChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};
