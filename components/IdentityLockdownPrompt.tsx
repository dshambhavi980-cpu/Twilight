import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, QrCode, Smartphone, ArrowRight, Lock, AlertCircle, X } from 'lucide-react';
import { useCouples } from '../contexts/CouplesContext';
import { SyncHistoryModal } from './SyncHistoryModal';

export const IdentityLockdownPrompt: React.FC = () => {
  const { isSyncRequired, notes, hasCloudBackup, showPinSetup } = useCouples();
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [initialTab, setInitialTab] = useState<'sync' | 'backup'>('sync');
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();

  // Only show on Love Lock / notes pages, not globally
  const isNotesPage = /\/(notes|admin\/notes|partner\/notes)/.test(location.pathname);

  // Auto-reset or auto-dismiss based on sync requirement
  useEffect(() => {
    if (isSyncRequired) {
      console.log('[IdentityLockdownPrompt] Sync required detected, resetting dismissal.');
      setIsDismissed(false);
    } else if (hasCloudBackup) {
      // If sync WAS required but is now FALSE, it means we just restored/synced
      // We should auto-dismiss the prompt to give a smooth UX
      console.log('[IdentityLockdownPrompt] Sync requirement cleared, auto-dismissing.');
      setIsDismissed(true);
    }
  }, [isSyncRequired, hasCloudBackup]);

  // Manual trigger listener
  useEffect(() => {
    const handleRecheck = () => {
      console.log('[IdentityLockdownPrompt] Manual recheck triggered.');
      setIsDismissed(false);
    };
    window.addEventListener('recheck-lockdown', handleRecheck);
    return () => window.removeEventListener('recheck-lockdown', handleRecheck);
  }, []);

  // Show if sync is required OR we have locked messages needing the original identity
  const hasLockedMessages = notes.some(n => n.content?.includes('🔐 Message locked'));
  
  // Decide flow: Restore vs Setup
  const isRestoreFlow = isSyncRequired || hasLockedMessages;
  const isSetupFlow = !hasCloudBackup && showPinSetup;

  if (isDismissed) return null;
  if (!isNotesPage) return null;
  if (!isRestoreFlow && !isSetupFlow) return null;

  const openSync = (tab: 'sync' | 'backup') => {
    setInitialTab(tab);
    setShowSyncModal(true);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 relative"
          >
            {/* Close button */}
            <button 
                onClick={() => setIsDismissed(true)}
                className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors z-10"
            >
                <X size={20} />
            </button>
            <div className="p-8 flex flex-col items-center text-center">
              {/* Icon Section */}
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center rotate-3">
                   <Shield className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-pink-500 rounded-2xl flex items-center justify-center -rotate-3 shadow-lg border-2 border-white dark:border-[#1C1C1E]">
                   <Lock className="w-5 h-5 text-white" />
                </div>
              </div>

              {isRestoreFlow ? (
                <>
                  <h2 className="text-2xl font-black tracking-tight dark:text-white mb-2">
                    Identity Locked
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 px-4">
                    You're logged in on a new device. To read your encrypted messages, you need to sync your identity from a trusted device.
                  </p>

                  <div className="w-full space-y-3">
                    <button
                      onClick={() => openSync('sync')}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                    >
                      <QrCode size={20} />
                      <span>Sync via QR or Code</span>
                      <ArrowRight size={18} />
                    </button>

                    <button
                      onClick={() => openSync('backup')}
                      className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all"
                    >
                      <Key size={20} />
                      <span>Restore with PIN</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-black tracking-tight dark:text-white mb-2">
                    Secure Your History
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 px-4">
                    Protect your messages with a Security PIN. This allows you to restore your chat history if you log in on a new device.
                  </p>

                  <div className="w-full space-y-3">
                    <button
                      onClick={() => openSync('backup')}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                    >
                      <Shield size={20} />
                      <span>Create Security PIN</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </>
              )}

              {/* Footer Info */}
              <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/20">
                <AlertCircle size={14} className="text-amber-500" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                  Secure Identity Lockdown
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <SyncHistoryModal 
        isOpen={showSyncModal} 
        onClose={() => setShowSyncModal(false)} 
        initialTab={initialTab}
      />
    </>
  );
};
