"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export default function TypingEffect({ text, speed = 18, onComplete }: Props) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const completedRef = useRef(false);

  useEffect(() => {
    indexRef.current = 0;
    completedRef.current = false;
    setDisplayed("");

    const interval = setInterval(() => {
      indexRef.current++;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(interval);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
        return;
      }
      setDisplayed(text.slice(0, indexRef.current));
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className="whitespace-pre-wrap">
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block h-4 w-0.5 animate-pulse bg-cyan-400/60 ml-0.5" />
      )}
    </span>
  );
}
