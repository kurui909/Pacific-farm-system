// src/components/common/ConfirmDialog.jsx
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmDialog - Modern, accessible confirmation modal
 * Styling aligned with Settings page (gradient modal header, consistent buttons)
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  icon: Icon = AlertTriangle,
  confirmLoading = false,
}) {
  const modalRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      const timer = setTimeout(() => {
        if (isDestructive && cancelButtonRef.current) {
          cancelButtonRef.current.focus();
        } else if (confirmButtonRef.current) {
          confirmButtonRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen, isDestructive]);

  // Keyboard: Escape closes, Enter confirms (if not inside input)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        const activeEl = document.activeElement;
        const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
        if (!isInput) {
          e.preventDefault();
          onConfirm();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  // Focus trapping
  useEffect(() => {
    if (!isOpen) return;
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop (matches Settings modal) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={confirmLoading ? undefined : onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal panel (same as password modal in Settings) */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role={isDestructive ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-800 overflow-hidden"
          >
            {/* Destructive top bar */}
            {isDestructive && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />}

            <div className="p-6">
              {/* Icon + Title (same layout as Settings modals) */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isDestructive
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <h2 id="confirm-dialog-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {title || 'Confirm Action'}
                </h2>
              </div>

              {/* Message */}
              <p id="confirm-dialog-message" className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {message || 'Are you sure you want to continue?'}
              </p>

              {/* Buttons (match Settings button styles) */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  ref={cancelButtonRef}
                  onClick={onClose}
                  disabled={confirmLoading}
                  className="inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {cancelText}
                </button>
                <button
                  ref={confirmButtonRef}
                  onClick={onConfirm}
                  disabled={confirmLoading}
                  className={`inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDestructive
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {confirmLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{confirmText}</span>
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>

            {/* Close button (X) */}
            <button
              onClick={onClose}
              disabled={confirmLoading}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}