import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSessionTimeoutOptions {
  inactivityTimeoutMs?: number; // Default 15 minutes (900,000 ms)
  warningDurationSeconds?: number; // Default 60 seconds
  onTimeoutLogout: () => void;
  enabled?: boolean;
}

export function useSessionTimeout({
  inactivityTimeoutMs = 15 * 60 * 1000, // 15 minutes default
  warningDurationSeconds = 60,
  onTimeoutLogout,
  enabled = true
}: UseSessionTimeoutOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(warningDurationSeconds);
  const lastActivityRef = useRef<number>(Date.now());
  const warningOpenRef = useRef<boolean>(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync ref for callback handlers
  useEffect(() => {
    warningOpenRef.current = isWarningOpen;
  }, [isWarningOpen]);

  // Reset activity timestamp
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isWarningOpen) {
      setIsWarningOpen(false);
      setCountdownSeconds(warningDurationSeconds);
    }
  }, [isWarningOpen, warningDurationSeconds]);

  // User explicit "Stay Logged In" click
  const handleStayLoggedIn = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarningOpen(false);
    setCountdownSeconds(warningDurationSeconds);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, [warningDurationSeconds]);

  // Listen for user activity
  useEffect(() => {
    if (!enabled) return;

    let lastThrottleTime = 0;
    const handleUserActivity = () => {
      // Do not auto-reset if the modal is currently asking the user to confirm "Stay Logged In"
      if (warningOpenRef.current) return;

      const now = Date.now();
      if (now - lastThrottleTime > 1000) {
        lastThrottleTime = now;
        lastActivityRef.current = now;
      }
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'wheel', 'click'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
    };
  }, [enabled]);

  // Check inactivity periodically
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (warningOpenRef.current) return; // Warning already active

      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= inactivityTimeoutMs) {
        // Trigger 15-minute passive warning modal
        setIsWarningOpen(true);
        setCountdownSeconds(warningDurationSeconds);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [enabled, inactivityTimeoutMs, warningDurationSeconds]);

  // Countdown timer when warning modal is open
  useEffect(() => {
    if (!isWarningOpen) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setIsWarningOpen(false);
          onTimeoutLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [isWarningOpen, onTimeoutLogout]);

  // Dev helper to trigger timeout modal immediately for testing
  const triggerTestWarning = useCallback(() => {
    setIsWarningOpen(true);
    setCountdownSeconds(warningDurationSeconds);
  }, [warningDurationSeconds]);

  return {
    isWarningOpen,
    countdownSeconds,
    handleStayLoggedIn,
    resetInactivityTimer,
    triggerTestWarning
  };
}
