import { 
  getLocalMoodEntries, 
  getLatestReportByType, 
  saveReportLocally, 
  getLocalCompletedExercises, 
  getLocalCalendarEvents, 
  getLatestDimensionRatings, 
  getLocalAcademicTasks 
} from './storage';
import { WellnessSummary } from '../hooks/useWellnessScore';
import { MoodEntry } from '../types';

const getAverage = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const getOverallScore = (dims: any) => {
  return Math.round((dims.physical + dims.emotional + dims.social + dims.intellectual + dims.occupational + dims.spiritual + dims.environmental + dims.financial) / 8);
};

// Helper: Check if there is a consecutive 7-day streak anywhere in the check-in history
const hasHistorical7DayStreak = (entries: MoodEntry[]): boolean => {
  if (!entries || entries.length < 7) return false;
  
  // Sort ascending by date
  const sorted = [...entries].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  // Get list of unique date strings in YYYY-MM-DD
  const uniqueDateStrings = Array.from(new Set(
    sorted.map(e => e.created_at.split('T')[0])
  ));
  
  if (uniqueDateStrings.length < 7) return false;
  
  const dates = uniqueDateStrings.map(dStr => {
    const [year, month, day] = dStr.split('-').map(Number);
    // Use local time construction to avoid timezone shifts
    return new Date(year, month - 1, day);
  });
  
  let consecutiveCount = 1;
  for (let i = 1; i < dates.length; i++) {
    const diffTime = dates[i].getTime() - dates[i - 1].getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      consecutiveCount++;
      if (consecutiveCount >= 7) return true;
    } else if (diffDays > 1) {
      consecutiveCount = 1;
    }
  }
  
  return consecutiveCount >= 7;
};

export const checkAndGenerateReports = async (userId: string, wellnessData: WellnessSummary): Promise<{ type: string; id: string } | null> => {
  if (userId === 'guest' || !wellnessData.hasBaseline) return null;

  // Run the exam countdown nudges check in background
  checkAndScheduleExamNudges(userId).catch(console.error);

  const now = new Date();
  const moodEntries = await getLocalMoodEntries(userId);
  if (moodEntries.length === 0) return null; // No usage data to report on

  // Oldest entry determines app usage start date
  const oldestEntryDate = new Date(moodEntries[moodEntries.length - 1].created_at);

  // 1. Check for Yearly Report (365 days of usage)
  const daysOfUsage = Math.floor((now.getTime() - oldestEntryDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysOfUsage >= 365) {
    const latestYearly = await getLatestReportByType(userId, 'yearly');
    const currentYear = now.getFullYear();
    if (!latestYearly || new Date(latestYearly.created_at).getFullYear() < currentYear) {
      return await generateYearlyReport(userId, wellnessData, now);
    }
  }

  // 2. Check for Monthly Report (End of Calendar Month)
  const latestMonthly = await getLatestReportByType(userId, 'monthly');
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const reportForMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  if (oldestEntryDate < startOfCurrentMonth) {
    let needsMonthly = false;
    if (!latestMonthly) {
      needsMonthly = true;
    } else {
      if (new Date(latestMonthly.created_at).getTime() < startOfCurrentMonth.getTime()) {
        needsMonthly = true;
      }
    }

    if (needsMonthly) {
      return await generateMonthlyReport(userId, wellnessData, now, reportForMonth);
    }
  }

  // 3. Check for Weekly Report
  const latestWeekly = await getLatestReportByType(userId, 'weekly');
  let needsWeekly = false;

  if (!latestWeekly) {
    // ENFORCE UNLOCK STRICTLY VIA CONSECUTIVE 7-DAY STREAK (ANYWHERE IN HISTORY)
    if (hasHistorical7DayStreak(moodEntries)) {
      needsWeekly = true;
    }
  } else {
    // After the first report, generate one every 7 days if there are new check-ins
    const lastWeeklyDate = new Date(latestWeekly.created_at);
    const daysSinceLastWeekly = Math.floor((now.getTime() - lastWeeklyDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const newEntries = moodEntries.filter(e => new Date(e.created_at) > lastWeeklyDate);
    if (daysSinceLastWeekly >= 7 && newEntries.length > 0) {
      needsWeekly = true;
    }
  }

  if (needsWeekly) {
    return await generateWeeklyReport(userId, wellnessData, now);
  }

  return null;
};

// --- Generation Logic ---

const generateWeeklyReport = async (userId: string, wellnessData: WellnessSummary, now: Date) => {
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateLabel = `Week of ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const moodEntries = await getLocalMoodEntries(userId);
  const weeklyMoods = moodEntries.filter(e => new Date(e.created_at) >= startDate);
  const avgWeeklyStress = weeklyMoods.length > 0 ? getAverage(weeklyMoods.map(e => e.stress)) : 0;

  // Calculate dimensions specifically for this week
  const baseline = await getLatestDimensionRatings(userId);
  const basePhys = baseline?.physical || 50;
  const baseEmo = baseline?.emotional || 50;
  const baseSoc = baseline?.social || 50;
  const baseInt = baseline?.intellectual || 50;
  const baseOcc = baseline?.occupational || 50;

  const weeklyEx = (await getLocalCompletedExercises(userId)).filter(ex => new Date(ex.completed_at) >= startDate);
  const weeklyTasks = (await getLocalAcademicTasks(userId)).filter(t => new Date(t.date) >= startDate);
  const completedTasks = weeklyTasks.filter(t => t.done).length;
  const totalTasks = weeklyTasks.length;
  const taskRatio = totalTasks > 0 ? (completedTasks / totalTasks) : 0;

  const dims = {
    physical: Math.min(100, Math.round(basePhys + (weeklyEx.length * 5))),
    emotional: Math.min(100, Math.max(0, Math.round(baseEmo + ((10 - avgWeeklyStress) * 2) + (weeklyMoods.length * 3)))),
    social: Math.min(100, Math.round(baseSoc + (wellnessData.tipsReadCount * 2))),
    intellectual: Math.min(100, Math.round(baseInt + (taskRatio * 20))),
    occupational: Math.min(100, Math.round(baseOcc + (taskRatio * 10))),
    spiritual: baseline?.spiritual || 50,
    environmental: baseline?.environmental || 50,
    financial: baseline?.financial || 50,
  };

  const overall = getOverallScore(dims);

  const dimsList = [
    { name: 'Physical', value: dims.physical },
    { name: 'Emotional', value: dims.emotional },
    { name: 'Social', value: dims.social },
    { name: 'Intellectual', value: dims.intellectual },
    { name: 'Occupational', value: dims.occupational },
    { name: 'Spiritual', value: dims.spiritual },
    { name: 'Environmental', value: dims.environmental },
    { name: 'Financial', value: dims.financial },
  ].sort((a, b) => b.value - a.value);

  const highest = dimsList[0];
  const lowest = dimsList[7];

  let summary = "You had a well-balanced week. Your consistency is paying off.";
  let recommendation = "This week focus on maintaining what is working and checking in on your lowest dimensions which have room to grow.";

  if (avgWeeklyStress >= 7 && (highest.name !== 'Emotional' || avgWeeklyStress >= 8)) {
    summary = "This was a tough week. Your mood and stress data suggest you were under significant pressure.";
    recommendation = "This week we recommend prioritising sleep, reducing unnecessary commitments, and trying at least one breathing exercise daily.";
  } else if (avgWeeklyStress <= 4 && lowest.name === 'Physical') {
    summary = "You had a positive emotional week but your physical wellness needs attention.";
    recommendation = "Try adding one short walk or stretch to your daily routine this week.";
  }

  const content = {
    mood_average: 10 - avgWeeklyStress,
    stress_average: avgWeeklyStress,
    highest_dimension: highest.name,
    lowest_dimension: lowest.name,
    dimensions: dims,
    recommendation
  };

  const reportId = Math.random().toString(36).substring(2, 15);
  await saveReportLocally({
    id: reportId,
    user_id: userId,
    type: 'weekly',
    date_label: dateLabel,
    overall_score: overall,
    summary,
    content_json: JSON.stringify(content),
    created_at: now.toISOString(),
    synced: 0
  });

  // Schedule weekly report notification alert
  import('./notificationService').then(({ scheduleWeeklyReportAlert }) => {
    scheduleWeeklyReportAlert().catch(console.error);
  });

  return { type: 'Weekly', id: reportId };
};

const generateMonthlyReport = async (userId: string, wellnessData: WellnessSummary, now: Date, reportForMonth: Date) => {
  const dateLabel = reportForMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const startOfMonth = new Date(reportForMonth.getFullYear(), reportForMonth.getMonth(), 1);
  const endOfMonth = new Date(reportForMonth.getFullYear(), reportForMonth.getMonth() + 1, 0, 23, 59, 59);

  const moodEntries = await getLocalMoodEntries(userId);
  const monthlyMoods = moodEntries.filter(e => {
    const d = new Date(e.created_at);
    return d >= startOfMonth && d <= endOfMonth;
  });

  const avgMonthlyStress = monthlyMoods.length > 0 ? getAverage(monthlyMoods.map(e => e.stress)) : 0;

  const monthlyEx = (await getLocalCompletedExercises(userId)).filter(ex => {
    const d = new Date(ex.completed_at);
    return d >= startOfMonth && d <= endOfMonth;
  });

  const baseline = await getLatestDimensionRatings(userId);
  const basePhys = baseline?.physical || 50;
  const baseEmo = baseline?.emotional || 50;
  const baseSoc = baseline?.social || 50;
  const baseInt = baseline?.intellectual || 50;
  const baseOcc = baseline?.occupational || 50;

  const monthlyTasks = (await getLocalAcademicTasks(userId)).filter(t => {
    const d = new Date(t.date);
    return d >= startOfMonth && d <= endOfMonth;
  });
  const completedTasks = monthlyTasks.filter(t => t.done).length;
  const totalTasks = monthlyTasks.length;
  const taskRatio = totalTasks > 0 ? (completedTasks / totalTasks) : 0;

  const dims = {
    physical: Math.min(100, Math.round(basePhys + (monthlyEx.length * 5))),
    emotional: Math.min(100, Math.max(0, Math.round(baseEmo + ((10 - avgMonthlyStress) * 2) + (monthlyMoods.length * 3)))),
    social: Math.min(100, Math.round(baseSoc + (wellnessData.tipsReadCount * 2))),
    intellectual: Math.min(100, Math.round(baseInt + (taskRatio * 20))),
    occupational: Math.min(100, Math.round(baseOcc + (taskRatio * 10))),
    spiritual: baseline?.spiritual || 50,
    environmental: baseline?.environmental || 50,
    financial: baseline?.financial || 50,
  };

  const overall = getOverallScore(dims);

  let summary = "This has been a strong month for your wellbeing.";
  if (overall < 40) {
    summary = "This month has been challenging for your wellness overall.";
  } else if (overall < 65) {
    summary = "Your month had real highs and some difficult stretches.";
  }

  const content = {
    mood_average: 10 - avgMonthlyStress,
    stress_average: avgMonthlyStress,
    exercises_completed: monthlyEx.length,
    dimensions: dims,
    support_message: overall < 40 
      ? "If this month showed persistent stress and low mood, please consider reaching out for professional support." 
      : "Keep up the great work and carry this momentum into the next month."
  };

  const reportId = Math.random().toString(36).substring(2, 15);
  await saveReportLocally({
    id: reportId,
    user_id: userId,
    type: 'monthly',
    date_label: dateLabel,
    overall_score: overall,
    summary,
    content_json: JSON.stringify(content),
    created_at: now.toISOString(),
    synced: 0
  });

  // Schedule monthly report notification alert
  import('./notificationService').then(({ scheduleMonthlyReportAlert }) => {
    scheduleMonthlyReportAlert().catch(console.error);
  });

  return { type: 'Monthly', id: reportId };
};

const generateYearlyReport = async (userId: string, wellnessData: WellnessSummary, now: Date) => {
  const dateLabel = now.getFullYear().toString();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  const moodEntries = await getLocalMoodEntries(userId);
  const yearlyMoods = moodEntries.filter(e => {
    const d = new Date(e.created_at);
    return d >= startOfYear && d <= endOfYear;
  });

  const avgYearlyStress = yearlyMoods.length > 0 ? getAverage(yearlyMoods.map(e => e.stress)) : 0;

  const baseline = await getLatestDimensionRatings(userId);
  const basePhys = baseline?.physical || 50;
  const baseEmo = baseline?.emotional || 50;
  const baseSoc = baseline?.social || 50;
  const baseInt = baseline?.intellectual || 50;
  const baseOcc = baseline?.occupational || 50;

  const yearlyEx = (await getLocalCompletedExercises(userId)).filter(ex => {
    const d = new Date(ex.completed_at);
    return d >= startOfYear && d <= endOfYear;
  });

  const yearlyTasks = (await getLocalAcademicTasks(userId)).filter(t => {
    const d = new Date(t.date);
    return d >= startOfYear && d <= endOfYear;
  });
  const completedTasks = yearlyTasks.filter(t => t.done).length;
  const totalTasks = yearlyTasks.length;
  const taskRatio = totalTasks > 0 ? (completedTasks / totalTasks) : 0;

  const dims = {
    physical: Math.min(100, Math.round(basePhys + (yearlyEx.length * 5))),
    emotional: Math.min(100, Math.max(0, Math.round(baseEmo + ((10 - avgYearlyStress) * 2) + (yearlyMoods.length * 3)))),
    social: Math.min(100, Math.round(baseSoc + (wellnessData.tipsReadCount * 2))),
    intellectual: Math.min(100, Math.round(baseInt + (taskRatio * 20))),
    occupational: Math.min(100, Math.round(baseOcc + (taskRatio * 10))),
    spiritual: baseline?.spiritual || 50,
    environmental: baseline?.environmental || 50,
    financial: baseline?.financial || 50,
  };

  const overall = getOverallScore(dims);

  let summary = "This has been a year of real consistency.";
  if (overall < 40) {
    summary = "This was a hard year and your data reflects that. But you were here, tracking, trying.";
  } else if (overall < 65) {
    summary = "Your year had real highs and some difficult stretches. That is an honest reflection of student life.";
  }

  const content = {
    dimensions: dims,
    reflection_message: summary
  };

  const reportId = Math.random().toString(36).substring(2, 15);
  await saveReportLocally({
    id: reportId,
    user_id: userId,
    type: 'yearly',
    date_label: dateLabel,
    overall_score: overall,
    summary,
    content_json: JSON.stringify(content),
    created_at: now.toISOString(),
    synced: 0
  });

  return { type: 'Yearly', id: reportId };
};

export const checkAndScheduleExamNudges = async (userId: string) => {
  if (userId === 'guest') return;
  try {
    const events = await getLocalCalendarEvents(userId);
    const now = new Date();
    const threeDaysAway = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const upcomingExams = events.filter(e => {
      if (e.type !== 'exam' && e.type !== 'deadline') return false;
      const eventDate = new Date(e.date + 'T00:00:00');
      return eventDate >= now && eventDate <= threeDaysAway;
    });

    if (upcomingExams.length > 0) {
      const { scheduleExamCountdownNudge } = require('./notificationService');
      for (const exam of upcomingExams) {
        await scheduleExamCountdownNudge(exam.title, exam.date);
      }
    }
  } catch (err) {
    console.error('Error running exam nudges check:', err);
  }
};
