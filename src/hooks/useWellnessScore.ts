import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import { getLocalMoodEntries, initDatabase } from '../services/storage';
import { MoodEntry } from '../types';

export interface WellnessDimensions {
  mental: number;   // 0-100
  physical: number; // 0-100
  academic: number; // 0-100
  social: number;   // 0-100
}

export interface WellnessSummary {
  last7Days: MoodEntry[];
  avgStress: number;
  tipsReadCount: number;
  streakCount: number;
  dimensions: WellnessDimensions;
  loading: boolean;
  error: string | null;
}

export const useWellnessScore = (): WellnessSummary => {
  const { session, isGuest } = useAuthStore();
  const [last7Days, setLast7Days] = useState<MoodEntry[]>([]);
  const [avgStress, setAvgStress] = useState(0);
  const [tipsReadCount, setTipsReadCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [dimensions, setDimensions] = useState<WellnessDimensions>({
    mental: 65,
    physical: 40,
    academic: 55,
    social: 30
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        let currentRecent: MoodEntry[] = [];
        let currentTips = 0;
        let currentStreak = 0;

        if (isGuest || !session) {
          await initDatabase();
          const allLocal = await getLocalMoodEntries();
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          currentRecent = allLocal.filter(
            (e) => new Date(e.created_at) >= sevenDaysAgo
          );
          currentStreak = currentRecent.length;
          currentTips = 0;
        } else {
          const { data, error: rpcError } = await supabase.rpc(
            'get_mood_summary',
            { p_user_id: session.user.id }
          );
          if (rpcError) throw rpcError;

          currentRecent = data?.last_7_days ?? [];
          currentTips = data?.tips_read_count ?? 0;
          currentStreak = data?.streak_count ?? 0;
        }

        setLast7Days(currentRecent);
        const avg = currentRecent.length > 0
            ? currentRecent.reduce((sum, e) => sum + e.stress, 0) / currentRecent.length
            : 0;
        setAvgStress(parseFloat(avg.toFixed(1)));
        setStreakCount(currentStreak);
        setTipsReadCount(currentTips);

        // --- Calculate Dimensions ---
        if (currentRecent.length === 0 && currentTips === 0) {
          setDimensions({ mental: 0, physical: 0, academic: 0, social: 0 });
        } else {
          // Mental: Inverted stress (10 -> 0, 0 -> 10) + log frequency
          const mentalScore = Math.min(100, Math.max(0, (10 - avg) * 8 + (currentRecent.length * 4)));
          
          // Physical: Mocked based on streak for now, can be linked to exercises later
          const physicalScore = Math.min(100, (currentStreak * 12));

          // Academic: Mocked based on log frequency for now
          const academicScore = Math.min(100, 40 + (currentStreak * 10));

          // Social: Linked to tips read
          const socialScore = Math.min(100, 10 + (currentTips * 15));

          setDimensions({
            mental: Math.round(mentalScore),
            physical: Math.round(physicalScore),
            academic: Math.round(academicScore),
            social: Math.round(socialScore)
          });
        }

      } catch (err: any) {
        console.error('useWellnessScore error:', err);
        setError(err.message ?? 'Failed to load wellness data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, isGuest]);

  return { 
    last7Days, 
    avgStress, 
    tipsReadCount, 
    streakCount, 
    dimensions: dimensions || { mental: 0, physical: 0, academic: 0, social: 0 }, 
    loading, 
    error 
  };
};
