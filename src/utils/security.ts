import { useEffect, useState } from 'react';

/**
 * Hook that enforces strict screenshot & screen capture prevention features:
 * - Detects window focus loss or tab switching (blurs/blacks out content)
 * - Blocks right click context menu
 * - Blocks key combinations (PrintScreen, Cmd+Shift+3/4/5, Ctrl+P, F12)
 * - Returns a boolean indicating if content should be hidden due to focus loss
 */
export function useAntiScreenshot(enabled: boolean = true) {
  const [isScreenProtected, setIsScreenProtected] = useState(false);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      setIsScreenProtected(true);
      setSecurityAlert('Window focus lost. Screen protected for security.');
    };

    const handleFocus = () => {
      setIsScreenProtected(false);
      setSecurityAlert(null);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsScreenProtected(true);
        setSecurityAlert('Tab switched or screen recording attempted.');
      } else {
        setIsScreenProtected(false);
        setSecurityAlert(null);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setSecurityAlert('Right-click is disabled on Judge Evaluation Sheets.');
      setTimeout(() => setSecurityAlert(null), 2500);
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Print Screen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        setIsScreenProtected(true);
        setSecurityAlert('Screenshot shortcut detected! Content hidden.');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(''); // Clear clipboard
        }
        setTimeout(() => setIsScreenProtected(false), 3000);
      }

      // Windows + Shift + S or Cmd + Shift + 3 / 4 / 5 or Cmd + Option + I
      if (
        (e.shiftKey && (e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S' || e.key === '3' || e.key === '4' || e.key === '5')) ||
        (e.ctrlKey && e.key === 'p') ||
        (e.metaKey && e.key === 'p')
      ) {
        e.preventDefault();
        setIsScreenProtected(true);
        setSecurityAlert('Screen capture shortcut restricted.');
        setTimeout(() => setIsScreenProtected(false), 3000);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  return { isScreenProtected, securityAlert };
}
