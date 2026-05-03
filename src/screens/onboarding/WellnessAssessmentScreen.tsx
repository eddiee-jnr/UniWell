import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Dimensions, Animated, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { saveMoodEntry } from '../../services/storage';

const { width } = Dimensions.get('window');

const QUESTIONS = [
  {
    id: 'physical',
    title: 'Physical Vitality',
    question: 'How energized and physically rested do you feel today?',
    options: ['Exhausted', 'Tired', 'Average', 'Energized', 'Peak Power'],
    scores: [20, 40, 60, 80, 100]
  },
  {
    id: 'mental',
    title: 'Mental Clarity',
    question: 'How would you rate your current stress and anxiety levels?',
    options: ['Overwhelmed', 'High Stress', 'Moderate', 'Calm', 'Perfect Peace'],
    scores: [20, 40, 60, 80, 100] // Note: We'll map these to wellness scores
  },
  {
    id: 'academic',
    title: 'Academic Rhythm',
    question: 'How in control do you feel about your university workload?',
    options: ['Falling Behind', 'Struggling', 'Managing', 'Ahead', 'Commanding'],
    scores: [20, 40, 60, 80, 100]
  },
  {
    id: 'social',
    title: 'Social Harmony',
    question: 'Do you feel a sense of belonging and support in your community?',
    options: ['Isolated', 'Disconnected', 'Neutral', 'Connected', 'Deeply Rooted'],
    scores: [20, 40, 60, 80, 100]
  }
];

export const WellnessAssessmentScreen = () => {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [answers, setAnswers] = useState<any>({});
  const progress = new Animated.Value((step + 1) / QUESTIONS.length);

  const currentQuestion = QUESTIONS[step];

  const handleSelect = (index: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: currentQuestion.scores[index] };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      Animated.timing(progress, {
        toValue: (step + 2) / QUESTIONS.length,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      startCalculation(newAnswers);
    }
  };

  const startCalculation = (finalAnswers: any) => {
    setIsCalculating(true);
    setTimeout(() => {
      finishAssessment(finalAnswers);
    }, 2500);
  };

  const finishAssessment = async (finalAnswers: any) => {
    try {
      // Save an initial mood log to "unlock" the dashboard
      const mood = Math.max(1, Math.min(5, Math.ceil(finalAnswers.mental / 20)));
      const stress = Math.max(1, Math.min(10, Math.ceil((120 - finalAnswers.mental) / 10)));

      await saveMoodEntry({
        user_id: useAuthStore.getState().session?.user.id || 'guest',
        mood,
        stress,
        note: 'Initial Baseline Assessment',
        factors: ['assessment'],
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save assessment:', error);
    } finally {
      navigation.replace('App');
    }
  };

  if (isCalculating) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.loaderCircle}>
          <Ionicons name="analytics" size={50} color="#7C6FEB" />
        </View>
        <Text style={styles.loadingTitle}>Calculating Results...</Text>
        <Text style={styles.loadingSub}>Analyzing your university wellness rhythm</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Header */}
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBar, { width: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%']
          }) }]} />
        </View>
        <Text style={styles.stepText}>Step {step + 1} of {QUESTIONS.length}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.categoryTitle}>{currentQuestion.title}</Text>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity 
              key={option} 
              style={styles.optionBtn}
              onPress={() => handleSelect(index)}
            >
              <Text style={styles.optionText}>{option}</Text>
              <Ionicons name="chevron-forward" size={18} color="#7C6FEB" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => navigation.replace('App')} 
        style={styles.skipBtn}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: '#1F2D45',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7C6FEB',
  },
  stepText: {
    color: '#6B7A99',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  categoryTitle: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  questionText: {
    color: '#F0F4FF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 50,
  },
  optionsContainer: {
    gap: 16,
  },
  optionBtn: {
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2D45',
  },
  optionText: {
    color: '#F0F4FF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipBtn: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  skipText: {
    color: '#6B7A99',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loaderCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7C6FEB',
    marginBottom: 24,
  },
  loadingTitle: {
    color: '#F0F4FF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  loadingSub: {
    color: '#6B7A99',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default WellnessAssessmentScreen;
