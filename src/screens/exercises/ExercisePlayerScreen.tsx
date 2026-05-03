import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Dimensions, Animated, Share, ScrollView
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

export const ExercisePlayerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { colors, theme } = useTheme();
  const { exercise } = route.params;

  const [isPlaying, setIsPlaying] = useState(false);
  const [breathText, setBreathText] = useState('Ready?');
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && exercise.title === 'Box Breathing') {
      let step = 0;
      const steps = [
        { text: 'Inhale', scale: 1.5, opacity: 0.8 },
        { text: 'Hold', scale: 1.5, opacity: 0.8 },
        { text: 'Exhale', scale: 1.0, opacity: 0.3 },
        { text: 'Hold', scale: 1.0, opacity: 0.3 }
      ];

      const runStep = () => {
        const current = steps[step];
        setBreathText(current.text);
        
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: current.scale,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: current.opacity,
            duration: 4000,
            useNativeDriver: true,
          })
        ]).start();

        step = (step + 1) % 4;
      };

      runStep();
      interval = setInterval(runStep, 4000);
    } else {
      setBreathText('Ready?');
      scaleAnim.setValue(1);
      opacityAnim.setValue(0.3);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

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
            {exercise.title === 'Box Breathing' ? (
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
                    <View style={[styles.breathCircle, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                        <Text style={[styles.breathStatus, { color: colors.text }]}>{breathText}</Text>
                    </View>
                </View>
              </View>
            ) : (
              <View style={[styles.placeholderCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Feather name={exercise.icon as any} size={60} color={colors.primary} />
              </View>
            )}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={20} color={colors.muted} />
              <Text style={[styles.durationText, { color: colors.muted }]}>{exercise.duration} Session</Text>
            </View>

            <TouchableOpacity 
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsPlaying(!isPlaying)}
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
  placeholderCircle: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
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
});

export default ExercisePlayerScreen;
