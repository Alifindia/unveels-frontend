import { useState, useRef, useEffect, MouseEvent } from "react";

export const useScrollContainer = () => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startX = useRef<number>(0);
  const scrollLeft = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent<Document>) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - startX.current;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollLeft.current - x;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove as any);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove as any);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    startX.current = e.pageX;
    if (scrollContainerRef.current) {
      scrollLeft.current = scrollContainerRef.current.scrollLeft;
    }
  };

  return { scrollContainerRef, handleMouseDown };
};
