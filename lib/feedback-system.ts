// ─────────────────────────────────────────────
// Aurum Feedback System
// Collects user feedback, tracks patterns, drives self-improvement
// Persists to localStorage
// ─────────────────────────────────────────────

export interface Feedback {
  id: string;
  messageId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  category: 'accuracy' | 'speed' | 'relevance' | 'tone' | 'general';
  comment?: string;
  context: {
    userMessage: string;
    aiResponse: string;
    provider: string;
    model: string;
    responseTime: number;
  };
  timestamp: number;
}

export interface FeedbackInsights {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  categoryScores: Record<string, { avg: number; count: number }>;
  commonIssues: string[];
  improvementAreas: string[];
  trend: 'improving' | 'declining' | 'stable';
  providerPerformance: Record<string, { avg: number; count: number }>;
}

const FEEDBACK_KEY = 'aurum_feedback';
const MAX_FEEDBACK = 500;

function loadFeedback(): Feedback[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FEEDBACK_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFeedback(feedbacks: Feedback[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks.slice(0, MAX_FEEDBACK)));
}

let feedbackList: Feedback[] = loadFeedback();

/**
 * Submit feedback for an AI response
 */
export function submitFeedback(
  feedback: Omit<Feedback, 'id' | 'timestamp'>
): Feedback {
  const entry: Feedback = {
    ...feedback,
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  };

  feedbackList.unshift(entry);
  if (feedbackList.length > MAX_FEEDBACK) {
    feedbackList = feedbackList.slice(0, MAX_FEEDBACK);
  }
  saveFeedback(feedbackList);

  console.log(`[Feedback] Rating: ${entry.rating}/5 | Category: ${entry.category}`);
  return entry;
}

/**
 * Get all feedback entries
 */
export function getFeedbackList(limit = 50): Feedback[] {
  return feedbackList.slice(0, limit);
}

/**
 * Generate insights from collected feedback
 */
export function getImprovementInsights(): FeedbackInsights {
  if (feedbackList.length === 0) {
    return {
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      categoryScores: {},
      commonIssues: [],
      improvementAreas: [],
      trend: 'stable',
      providerPerformance: {},
    };
  }

  // Average rating
  const totalRating = feedbackList.reduce((sum, f) => sum + f.rating, 0);
  const averageRating = totalRating / feedbackList.length;

  // Rating distribution
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbackList.forEach(f => { ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1; });

  // Category scores
  const categoryScores: Record<string, { avg: number; count: number; total: number }> = {};
  feedbackList.forEach(f => {
    if (!categoryScores[f.category]) {
      categoryScores[f.category] = { avg: 0, count: 0, total: 0 };
    }
    categoryScores[f.category].total += f.rating;
    categoryScores[f.category].count += 1;
  });
  for (const cat of Object.keys(categoryScores)) {
    categoryScores[cat].avg = categoryScores[cat].total / categoryScores[cat].count;
  }

  // Provider performance
  const providerPerformance: Record<string, { avg: number; count: number; total: number }> = {};
  feedbackList.forEach(f => {
    const provider = f.context.provider;
    if (!providerPerformance[provider]) {
      providerPerformance[provider] = { avg: 0, count: 0, total: 0 };
    }
    providerPerformance[provider].total += f.rating;
    providerPerformance[provider].count += 1;
  });
  for (const p of Object.keys(providerPerformance)) {
    providerPerformance[p].avg = providerPerformance[p].total / providerPerformance[p].count;
  }

  // Identify improvement areas (categories with avg < 3.5)
  const improvementAreas = Object.entries(categoryScores)
    .filter(([, v]) => v.avg < 3.5)
    .map(([k]) => k);

  // Common issues from comments
  const commonIssues: string[] = [];
  const lowRated = feedbackList.filter(f => f.rating <= 2 && f.comment);
  if (lowRated.length > 0) {
    const issueWords: Record<string, number> = {};
    lowRated.forEach(f => {
      const words = (f.comment ?? '').toLowerCase().split(/\s+/);
      words.forEach(w => {
        if (w.length > 3) issueWords[w] = (issueWords[w] || 0) + 1;
      });
    });
    const sorted = Object.entries(issueWords).sort((a, b) => b[1] - a[1]);
    commonIssues.push(...sorted.slice(0, 5).map(([word, count]) => `"${word}" (${count}x)`));
  }

  // Trend: compare last 10 vs previous 10
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (feedbackList.length >= 20) {
    const recent = feedbackList.slice(0, 10).reduce((s, f) => s + f.rating, 0) / 10;
    const older = feedbackList.slice(10, 20).reduce((s, f) => s + f.rating, 0) / 10;
    if (recent > older + 0.3) trend = 'improving';
    else if (recent < older - 0.3) trend = 'declining';
  }

  return {
    totalFeedback: feedbackList.length,
    averageRating: Math.round(averageRating * 100) / 100,
    ratingDistribution,
    categoryScores: Object.fromEntries(
      Object.entries(categoryScores).map(([k, v]) => [k, { avg: Math.round(v.avg * 100) / 100, count: v.count }])
    ),
    commonIssues,
    improvementAreas,
    trend,
    providerPerformance: Object.fromEntries(
      Object.entries(providerPerformance).map(([k, v]) => [k, { avg: Math.round(v.avg * 100) / 100, count: v.count }])
    ),
  };
}

/**
 * Clear all feedback data
 */
export function clearFeedback(): void {
  feedbackList = [];
  saveFeedback([]);
}
