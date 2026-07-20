import { useState, useEffect } from "react";

export function usePageLoading(delayMs = 1200) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return isLoading;
}
