"use client";

import { useState } from "react";

interface Props {
  messageIndex: number;
  messageText: string;
}

export function FeedbackButtons({ messageIndex, messageText }: Props) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type);

    // Store feedback in localStorage for self-learning
    try {
      const feedbackData = JSON.parse(localStorage.getItem("aurum_feedback") || "[]");
      feedbackData.push({
        messageIndex,
        messagePreview: messageText.slice(0, 100),
        feedback: type,
        timestamp: Date.now(),
      });
      // Keep only last 100 feedbacks
      if (feedbackData.length > 100) feedbackData.splice(0, feedbackData.length - 100);
      localStorage.setItem("aurum_feedback", JSON.stringify(feedbackData));
    } catch {}
  };

  if (feedback) {
    return (
      <span className="text-[10px] text-white/20">
        {feedback === "up" ? "👍" : "👎"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => handleFeedback("up")}
        className="rounded p-0.5 text-[10px] text-white/20 hover:text-green-400 hover:bg-green-500/10 transition-colors"
        title="Boa resposta"
      >
        👍
      </button>
      <button
        onClick={() => handleFeedback("down")}
        className="rounded p-0.5 text-[10px] text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        title="Resposta ruim"
      >
        👎
      </button>
    </div>
  );
}
