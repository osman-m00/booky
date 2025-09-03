import { useEffect, useRef } from "react";

export default function useInfiniteScroll(callback) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback(); // user reached sentinel → load more
        }
      },
      { threshold: 1.0 } // fully in view
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [callback]);

  return sentinelRef; // we attach this to the sentinel div
}
