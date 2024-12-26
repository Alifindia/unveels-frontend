// src/hooks/useCountdown.ts

import { useState, useRef, useEffect, useCallback } from "react";

interface UseCountdownOptions {
  initialCount: number;
  onComplete: () => void;
  interval?: number; // Interval in milliseconds, default is 1000ms
}

interface UseCountdownReturn {
  count: number | null;
  start: () => void;
  cancel: () => void;
  isActive: boolean;
}

export function useCountdown({
  initialCount,
  onComplete,
  interval = 1000,
}: UseCountdownOptions): UseCountdownReturn {
  const [count, setCount] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null); // Changed to number
  const onCompleteRef = useRef<() => void>(onComplete);

  // Update onCompleteRef if onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const start = useCallback(() => {
    if (count !== null) return; // Prevent multiple starts
    setCount(initialCount);
    intervalRef.current = window.setInterval(() => {
      setCount((prevCount) => {
        if (prevCount === null) return null;
        if (prevCount <= 1) {
          // Countdown complete
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setCount(null);
          onCompleteRef.current();
          return null;
        }
        return prevCount - 1;
      });
    }, interval);
  }, [initialCount, interval, count]);

  const cancel = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCount(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const isActive = count !== null;

  return { count, start, cancel, isActive };
}
