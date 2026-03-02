import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';
import { useCouples } from '../contexts/CouplesContext';
import { SyncHistoryModal } from './SyncHistoryModal';

/**
 * Auto-prompt that appears after a fresh couple connection when no PIN backup exists.
 * Gentle nudge — user can dismiss or set up PIN immediately.
 */
export const PinSetupPrompt: React.FC = () => {
  const { isSyncRequired, notes, showPinSetup, setShowPinSetup, couple, hasCloudBackup } = useCouples();
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();

  // Only show on Love Lock / notes pages, not globally
  const isNotesPage = /\/(notes|admin\/notes|partner\/notes)/.test(location.pathname);

  // Separate visibility check for the banner vs the modal
  // Hide this nudge banner if the full-screen IdentityLockdownPrompt is active
  const hasLockedMessages = notes.some(n => n.content?.includes('\uD83D\uDD10 Message locked'));
  const isLockdownProminent = isSyncRequired || hasLockedMessages;

  const hideBanner = !isNotesPage || !showPinSetup || !couple || hasCloudBackup || isLockdownProminent;

  return (
    <>
      <AnimatePresence>
        {!hideBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-[100] mx-auto max-w-sm"
          >
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-white/10 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold dark:text-white">Secure your messages</p>
                <p className="text-xs text-gray-500 truncate">Set up a PIN to restore history across devices</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(true);
                  setShowPinSetup(false);
                }}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shrink-0"
              >
                Setup
              </button>
              <button
                onClick={() => setShowPinSetup(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SyncHistoryModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        initialTab="backup"
      />
    </>
  );
};
