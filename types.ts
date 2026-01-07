
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface DayData {
  date: string; // ISO string or YYYY-MM-DD
  completions: Record<string, boolean>; // habitId -> completed
}

export interface Stats {
  streak: number;
  prevStreak: number;
  sevenDayAvg: number;
  prevSevenDayAvg: number;
  consistencyScore: number;
  consistencyDelta: number;
  trend: 'up' | 'down' | 'stable';
  trendDelta: number;
  completionRate: number;
  prevCompletionRate: number;
}

export interface LongTermGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  color: string;
}
