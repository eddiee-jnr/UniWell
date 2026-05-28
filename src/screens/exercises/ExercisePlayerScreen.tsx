import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Dimensions, Animated, Share, ScrollView, Modal,
  Vibration
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';
import { saveCompletedExerciseLocally } from '../../services/storage';
import { syncPendingEntries } from '../../services/syncService';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

const parseDurationToSeconds = (durationStr: string): number => {
  const match = durationStr.match(/(\d+)\s*min/);
  if (match) {
    return parseInt(match[1], 10) * 60;
  }
  return 60; // fallback to 1 minute
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const ExercisePlayerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { colors, theme } = useTheme();
  const { exercise } = route.params;

  const [isPlaying, setIsPlaying] = useState(false);
  const [breathText, setBreathText] = useState('Ready?');
  const [timeLeft, setTimeLeft] = useState(parseDurationToSeconds(exercise.duration));
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  // Sound & Vibration support
  const [sound, setSound] = useState<any>();
  
  // Trigger sound completion alert
  const playSoundAndVibrate = async () => {
    try {
      const { Audio } = require('expo-av');
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldRouteThroughReceiverIOS: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/chime.ogg')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (e) {
      console.log('Audio play failed', e);
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Timer countdown hook
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            handleCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isPlaying, timeLeft]);

  // Determine interactive steps for current exercise
  const getExerciseSteps = () => {
    if (exercise.title === 'Box Breathing') return [
      { text: 'Inhale', scale: 1.5, opacity: 0.8, duration: 4000 },
      { text: 'Hold', scale: 1.5, opacity: 0.8, duration: 4000 },
      { text: 'Exhale', scale: 1.0, opacity: 0.3, duration: 4000 },
      { text: 'Hold', scale: 1.0, opacity: 0.3, duration: 4000 }
    ];
    if (exercise.title.includes('5-4-3-2-1')) return [
      { text: '5 things you can see', scale: 1.3, opacity: 0.7, duration: 8000 },
      { text: '4 things you can touch', scale: 1.2, opacity: 0.6, duration: 8000 },
      { text: '3 things you can hear', scale: 1.1, opacity: 0.5, duration: 8000 },
      { text: '2 things you can smell', scale: 1.1, opacity: 0.4, duration: 8000 },
      { text: '1 thing you can taste', scale: 1.0, opacity: 0.3, duration: 8000 }
    ];
    if (exercise.title.includes('Neck')) return [
      { text: 'Drop chin to chest', scale: 1.2, opacity: 0.6, duration: 6000 },
      { text: 'Roll head to the left', scale: 1.2, opacity: 0.6, duration: 6000 },
      { text: 'Roll head to the right', scale: 1.2, opacity: 0.6, duration: 6000 },
      { text: 'Shrug shoulders to ears', scale: 1.3, opacity: 0.7, duration: 6000 },
      { text: 'Release shoulders down', scale: 1.0, opacity: 0.3, duration: 6000 }
    ];
    if (exercise.title.includes('Relaxation')) return [
      { text: 'Relax your toes and feet', scale: 1.1, opacity: 0.4, duration: 10000 },
      { text: 'Relax your legs and knees', scale: 1.1, opacity: 0.4, duration: 10000 },
      { text: 'Relax your stomach and chest', scale: 1.2, opacity: 0.5, duration: 10000 },
      { text: 'Relax your arms and hands', scale: 1.2, opacity: 0.5, duration: 10000 },
      { text: 'Relax your neck and jaw', scale: 1.1, opacity: 0.4, duration: 10000 }
    ];
    if (exercise.title.includes('Gratitude')) return [
      { text: 'Think of a small win today', scale: 1.2, opacity: 0.6, duration: 15000 },
      { text: 'Someone you appreciate', scale: 1.2, opacity: 0.6, duration: 15000 },
      { text: 'Something you look forward to', scale: 1.2, opacity: 0.6, duration: 15000 }
    ];
    // Default ambient pulsing
    return [
      { text: 'Focus...', scale: 1.25, opacity: 0.6, duration: 3000 },
      { text: 'Breathe...', scale: 1.0, opacity: 0.3, duration: 3000 }
    ];
  };

  // Interactive animation loop for all exercises
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isPlaying) {
      const steps = getExerciseSteps();
      let stepIndex = 0;

      const runStep = () => {
        const current = steps[stepIndex];
        setBreathText(current.text);
        
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: current.scale,
            duration: current.duration,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: current.opacity,
            duration: current.duration,
            useNativeDriver: true,
          })
        ]).start();

        stepIndex = (stepIndex + 1) % steps.length;
        timeoutId = setTimeout(runStep, current.duration);
      };

      runStep();
    } else {
      setBreathText('Ready?');
      scaleAnim.setValue(1);
      opacityAnim.setValue(0.3);
    }

    return () => clearTimeout(timeoutId);
  }, [isPlaying]);

  const handleCompletion = async () => {
    setIsPlaying(false);
    Vibration.vibrate([0, 500, 200, 500]);
    playSoundAndVibrate();
    
    // Log completion
    const session = useAuthStore.getState().session;
    const userId = session?.user.id || 'guest';
    const entryId = Math.random().toString(36).substring(2, 15);
    
    try {
      await saveCompletedExerciseLocally({
        id: entryId,
        user_id: userId,
        exercise_id: exercise.id,
        exercise_title: exercise.title,
        category: exercise.category,
        duration_seconds: parseDurationToSeconds(exercise.duration),
        completed_at: new Date().toISOString(),
      });
      
      // Attempt syncing to cloud
      await syncPendingEntries();
    } catch (error) {
      console.error('Failed to log exercise completion:', error);
    }
    
    setShowCompletionModal(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm practicing ${exercise.title} on UniWell. Join me!`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleShare} 
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Category Tag */}
          <View style={[styles.categoryTag, { backgroundColor: colors.surface }]}>
            <Text style={[styles.categoryText, { color: colors.secondary }]}>{exercise.category.toUpperCase()}</Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{exercise.title}</Text>
          <Text style={[styles.description, { color: colors.muted }]}>{exercise.description}</Text>

          {/* Animation Area */}
          <View style={styles.animationArea}>
            <View style={styles.pacerContainer}>
              <Animated.View 
                style={[
                  styles.breathAura,
                  {
                    backgroundColor: colors.primary,
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                  }
                ]} 
              />
              <View style={{ position: 'relative', width: width * 0.45, height: width * 0.45, alignItems: 'center', justifyContent: 'center' }}>
                <View style={[styles.breathCircle, { backgroundColor: colors.surface, borderColor: colors.primary, paddingHorizontal: 10 }]}>
                    <Text style={[styles.breathStatus, { color: colors.text, textAlign: 'center', fontSize: 18 }]} numberOfLines={3}>{breathText}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={20} color={colors.muted} />
              <Text style={[styles.durationText, { color: colors.muted }]}>
                {formatTime(timeLeft)} / {exercise.duration}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (timeLeft <= 0) {
                  setTimeLeft(parseDurationToSeconds(exercise.duration));
                }
                setIsPlaying(!isPlaying);
              }}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
            
            <Text style={[styles.instruction, { color: colors.muted }]}>
              {isPlaying ? "Stay focused on your rhythm" : "Tap play to begin your session"}
            </Text>
          </View>

          {/* Quick Tips */}
          <BlurView 
            intensity={20} 
            tint={theme === 'dark' ? 'dark' : 'light'} 
            style={[styles.tipCard, { backgroundColor: colors.surface + '80', borderColor: colors.border }]}
          >
            <Feather name="info" size={20} color={colors.secondary} style={{ marginRight: 12 }} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              {exercise.tip || "Focus on deep, rhythmic breaths. Let your shoulders drop and jaw relax."}
            </Text>
          </BlurView>
        </View>
      </ScrollView>

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView 
            intensity={40} 
            tint={theme === 'dark' ? 'dark' : 'light'}
            style={[
              styles.modalContainer,
              { 
                backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(248, 250, 252, 0.95)', 
                borderColor: colors.border,
              }
            ]}
          >
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle" size={44} color="#4ADE80" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Session Completed!
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
              Great job! You have completed the {exercise.title} session ({exercise.duration}). Keep up the mindful momentum.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowCompletionModal(false);
                navigation.goBack();
              }}
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.modalButtonText}>
                Back to Library
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  animationArea: {
    width: width * 0.8,
    height: width * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  pacerContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathAura: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
  },
  breathCircle: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: (width * 0.45) / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathStatus: {
    fontSize: 24,
    fontWeight: '800',
  },
  controls: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  instruction: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    borderRadius: 28,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  successIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  modalButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ExercisePlayerScreen;
