import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import { 
  getLocalMoodEntries, 
  getLocalCompletedExercises, 
  getLocalAcademicTasks, 
  getLatestDimensionRatings,
  initDatabase 
} from '../services/storage';
import { MoodEntry, CompletedExercise, AcademicTask } from '../types';
import { useTipsStore } from '../store/tipsStore';

const calculateStreak = (entries: MoodEntry[]): number => {
  if (!entries || entries.length === 0) return 0;
  
  const sorted = [...entries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const uniqueDates = new Set<string>();
  sorted.forEach(e => {
    if (e.created_at) {
      const d = new Date(e.created_at);
      uniqueDates.add(d.toISOString().split('T')[0]);
    }
  });
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (!uniqueDates.has(todayStr) && !uniqueDates.has(yesterdayStr)) {
    return 0;
  }
  
  let streak = 0;
  let checkDate = uniqueDates.has(todayStr) ? today : yesterday;
  
  while (true) {
    const checkDateStr = checkDate.toISOString().split('T')[0];
    if (uniqueDates.has(checkDateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

const calculateDimensionsForPeriod = (
  baseline: any,
  moods: MoodEntry[],
  exercises: CompletedExercise[],
  tasks: AcademicTask[],
  tipsCount: number,
  streak: number
) => {
  const basePhys = baseline?.physical || 50;
  const baseEmo = baseline?.emotional || 50;
  const baseSoc = baseline?.social || 50;
  const baseInt = baseline?.intellectual || 50;
  const baseOcc = baseline?.occupational || 50;

  const completedTasks = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const taskRatio = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
  
  const avgStress = moods.length > 0
    ? moods.reduce((sum, e) => sum + e.stress, 0) / moods.length
    : 0;

  const physicalScore = Math.min(100, basePhys + (exercises.length * 5) + (streak * 2));
  const emotionalScore = Math.min(100, Math.max(0, baseEmo + ((10 - avgStress) * 2) + (moods.length * 3)));
  const socialScore = Math.min(100, baseSoc + (tipsCount * 5));
  const intellectualScore = Math.min(100, baseInt + (taskRatio * 20));
  const occupationalScore = Math.min(100, baseOcc + (taskRatio * 10) + (streak * 2));

  return {
    physical: Math.round(physicalScore),
    emotional: Math.round(emotionalScore),
    social: Math.round(socialScore),
    intellectual: Math.round(intellectualScore),
    occupational: Math.round(occupationalScore),
    spiritual: baseline?.spiritual || 0,
    environmental: baseline?.environmental || 0,
    financial: baseline?.financial || 0,
  };
};

export interface WellnessDimensions {
  physical: number;      // 0-100
  emotional: number;     // 0-100
  social: number;        // 0-100
  intellectual: number;  // 0-100
  occupational: number;  // 0-100
  spiritual: number;     // 0-100
  environmental: number; // 0-100
  financial: number;     // 0-100
}

export interface WellnessSummary {
  last7Days: MoodEntry[];
  allEntries: MoodEntry[];
  allExercises: CompletedExercise[];
  avgStress: number;
  tipsReadCount: number;
  streakCount: number;
  completedExercisesCount: number;
  dimensions: WellnessDimensions;
  dimensions7Days: WellnessDimensions;
  dimensions30Days: WellnessDimensions;
  dimensionsAllTime: WellnessDimensions;
  hasBaseline: boolean;
  showAssessmentCTA: boolean;
  loading: boolean;
  error: string | null;
}

export const useWellnessScore = (): WellnessSummary => {
  const { session, isGuest, isRehydrating } = useAuthStore();
  const readTips = useTipsStore((state) => state.readTips);
  const [last7Days, setLast7Days] = useState<MoodEntry[]>([]);
  const [allEntries, setAllEntries] = useState<MoodEntry[]>([]);
  const [allExercises, setAllExercises] = useState<CompletedExercise[]>([]);
  const [avgStress, setAvgStress] = useState(0);
  const [tipsReadCount, setTipsReadCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [completedExercisesCount, setCompletedExercisesCount] = useState(0);
  const [dimensions, setDimensions] = useState<WellnessDimensions>({
    physical: 0,
    emotional: 0,
    social: 0,
    intellectual: 0,
    occupational: 0,
    spiritual: 0,
    environmental: 0,
    financial: 0
  });
  const [dimensions7Days, setDimensions7Days] = useState<WellnessDimensions>({
    physical: 0, emotional: 0, social: 0, intellectual: 0, occupational: 0, spiritual: 0, environmental: 0, financial: 0
  });
  const [dimensions30Days, setDimensions30Days] = useState<WellnessDimensions>({
    physical: 0, emotional: 0, social: 0, intellectual: 0, occupational: 0, spiritual: 0, environmental: 0, financial: 0
  });
  const [dimensionsAllTime, setDimensionsAllTime] = useState<WellnessDimensions>({
    physical: 0, emotional: 0, social: 0, intellectual: 0, occupational: 0, spiritual: 0, environmental: 0, financial: 0
  });
  const [hasBaseline, setHasBaseline] = useState(false);
  const [showAssessmentCTA, setShowAssessmentCTA] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);

    try {
      let currentRecent: MoodEntry[] = [];
      let currentTips = 0;
      let currentStreak = 0;

      await initDatabase();

      const userId = session?.user.id || 'guest';
      
      // 1. Fetch Mood Logs and Streak
      const allLocal = await getLocalMoodEntries(userId);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const localRecent = allLocal.filter(e => new Date(e.created_at) >= sevenDaysAgo);

      // Fetch completed exercises
      const localExercises = await getLocalCompletedExercises(userId);
      let completedCount = localExercises.length;
      let finalExercises = [...localExercises];

      if (isGuest || !session) {
        currentRecent = localRecent;
        currentStreak = calculateStreak(allLocal);
        currentTips = readTips.length;
        setAllEntries(allLocal);
        setAllExercises(localExercises);
      } else {
        try {
          const { data, error: rpcError } = await supabase.rpc(
            'get_mood_summary',
            { p_user_id: session.user.id }
          );
          if (rpcError) throw rpcError;

          // Merge server recent entries with local for the chart
          const serverRecent = data?.last_7_days ?? [];
          const mergedRecent = [...localRecent];
          serverRecent.forEach((se: MoodEntry) => {
            if (!mergedRecent.some(le => le.id === se.id)) {
              mergedRecent.push(se);
            }
          });
          mergedRecent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          currentRecent = mergedRecent;

          // ── STREAK FIX ──────────────────────────────────────────────────────
          const { data: allServerEntries } = await supabase
            .from('mood_logs')
            .select('id, user_id, mood, stress, note, created_at')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          const allMerged = [...allLocal];
          (allServerEntries ?? []).forEach((se: MoodEntry) => {
            if (!allMerged.some(le => le.id === se.id)) {
              allMerged.push(se);
            }
          });
          allMerged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setAllEntries(allMerged);

          currentStreak = calculateStreak(allMerged);
          console.log(`[WellnessScore] Streak computed from ${allMerged.length} total entries (${allLocal.length} local + ${(allServerEntries ?? []).length - allLocal.length} server-only) → ${currentStreak} days`);

          // ── TIPS FIX ─────────────────────────────────────────────────────────
          const rpcTips = data?.tips_read_count ?? 0;
          if (rpcTips > 0) {
            currentTips = rpcTips;
          } else if (readTips.length > 0) {
            currentTips = readTips.length;
          } else {
            // Direct Supabase count as final fallback
            const { count } = await supabase
              .from('tip_engagements')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', session.user.id);
            currentTips = count ?? 0;
          }
          console.log(`[WellnessScore] Tips: rpc=${rpcTips}, inMemory=${readTips.length}, final=${currentTips}`);

          // Fetch all completed exercises from Supabase to merge
          const { data: serverEx } = await supabase
            .from('completed_exercises')
            .select('*')
            .eq('user_id', session.user.id)
            .order('completed_at', { ascending: false });
            
          (serverEx ?? []).forEach((se: CompletedExercise) => {
            if (!finalExercises.some(le => le.id === se.id)) {
              finalExercises.push(se);
            }
          });
          finalExercises.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
          completedCount = finalExercises.length;
          setAllExercises(finalExercises);

        } catch (rpcErr) {
          console.warn('[WellnessScore] Supabase RPC failed, falling back to local SQLite data:', rpcErr);
          currentRecent = localRecent;
          currentStreak = calculateStreak(allLocal);
          currentTips = readTips.length;
          setAllEntries(allLocal);
          setAllExercises(localExercises);
        }
      }

      setLast7Days(currentRecent);
      const avg = currentRecent.length > 0
          ? currentRecent.reduce((sum, e) => sum + e.stress, 0) / currentRecent.length
          : 0;
      setAvgStress(parseFloat(avg.toFixed(1)));
      setStreakCount(currentStreak);
      setTipsReadCount(currentTips);
      setCompletedExercisesCount(completedCount);

      // 3. Fetch academic tasks for score calculation
      const localTasks = await getLocalAcademicTasks(userId);
      const completedTasksCount = localTasks.filter(t => t.done).length;
      const totalTasksCount = localTasks.length;

      // --- Calculate Dimensions Dynamically ---
      const baseline = await getLatestDimensionRatings(userId);
      setHasBaseline(!!baseline);
      
      if (!baseline) {
        setShowAssessmentCTA(true);
      } else {
        const lastAssessmentTime = new Date(baseline.created_at).getTime();
        const hoursSinceLast = (new Date().getTime() - lastAssessmentTime) / (1000 * 60 * 60);
        setShowAssessmentCTA(hoursSinceLast >= 24);
      }
      
      if (!baseline) {
        setDimensions({ physical: 0, emotional: 0, social: 0, intellectual: 0, occupational: 0, spiritual: 0, environmental: 0, financial: 0 });
        setDimensions7Days({ physical: 0, emotional: 0, social: 0, intellectual: 0, occupational: 0, spiritual: 0, environmental: 0, financial: 0 });
        setDimensions30Days({ physical: 0, emotional: 0, social: 0, intellectual: 0, occupational: 0, spiritual: 0, environmental: 0, financial: 0 });
        setDimensionsAllTime({ physical: 0, emotional: 0, social: 0, intellectual: 0, occupational: 0, spiritual: 0, environmental: 0, financial: 0 });
      } else {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // 7 Days subsets
        const mood7 = allLocal.filter(e => new Date(e.created_at) >= sevenDaysAgo);
        const ex7 = finalExercises.filter(ex => new Date(ex.completed_at) >= sevenDaysAgo);
        const tasks7 = localTasks.filter(t => new Date(t.date) >= sevenDaysAgo);

        // 30 Days subsets
        const mood30 = allLocal.filter(e => new Date(e.created_at) >= thirtyDaysAgo);
        const ex30 = finalExercises.filter(ex => new Date(ex.completed_at) >= thirtyDaysAgo);
        const tasks30 = localTasks.filter(t => new Date(t.date) >= thirtyDaysAgo);

        const dims7 = calculateDimensionsForPeriod(baseline, mood7, ex7, tasks7, currentTips, currentStreak);
        const dims30 = calculateDimensionsForPeriod(baseline, mood30, ex30, tasks30, currentTips, currentStreak);
        const dimsAll = calculateDimensionsForPeriod(baseline, allLocal, finalExercises, localTasks, currentTips, currentStreak);

        setDimensions(dims7);
        setDimensions7Days(dims7);
        setDimensions30Days(dims30);
        setDimensionsAllTime(dimsAll);
      }

    } catch (err: any) {
      console.error('useWellnessScore error:', err);
      setError(err.message ?? 'Failed to load wellness data');
    } finally {
      setLoading(false);
    }
  }, [session, isGuest, readTips.length]);

  // Re-fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    if (!isRehydrating) {
      fetchData();
    }
  }, [isRehydrating, fetchData]);

  return { 
    last7Days, 
    allEntries,
    allExercises,
    avgStress, 
    tipsReadCount, 
    streakCount, 
    completedExercisesCount,
    dimensions: dimensions || { physical: 0, emotional: 0, social: 0, intellectual: 0, occupational: 0, spiritual: 0, environmental: 0, financial: 0 }, 
    dimensions7Days: dimensions7Days || { physical: 0, emotional: 0, social: 0, intellectual: 0, occupational: 0, spiritual: 0, environmental: 0, financial: 0 },
    dimensions30Days: dimensions30Days || { physical: 0, emotional: 0, social: 0, intellectual: 0, occupational: 0, spiritual: 0, environmental: 0, financial: 0 },
    dimensionsAllTime: dimensionsAllTime || { physical: 0, emotional: 0, social: 0, intellectual: 0, occupational: 0, spiritual: 0, environmental: 0, financial: 0 },
    hasBaseline,
    showAssessmentCTA,
    loading, 
    error 
  };
};
