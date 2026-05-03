import React, { useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  TextInput, StyleSheet, Dimensions 
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import exercisesData from '../../data/exercises.json';

import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Quick', 'Focus', 'Relax'];

export const ExercisesScreen = () => {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const { colors, theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = exercisesData.filter(ex => {
    const matchesCategory = activeCategory === 'All' || ex.category === activeCategory;
    const matchesSearch = ex.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ex.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderIcon = (ex: any) => {
    if (ex.iconLib === 'Feather') return <Feather name={ex.icon as any} size={24} color={colors.primary} />;
    if (ex.iconLib === 'Material') return <MaterialCommunityIcons name={ex.icon as any} size={24} color={colors.primary} />;
    return <Ionicons name={ex.icon as any} size={24} color={colors.primary} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Exercise Library</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Micro-habits for a balanced university life.</Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={20} color={colors.muted} style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search exercises..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryPill, 
                { backgroundColor: colors.surface, borderColor: colors.border },
                activeCategory === cat && { backgroundColor: colors.primary, borderColor: colors.secondary }
              ]}
            >
              <Text style={[
                styles.categoryText,
                { color: colors.muted },
                activeCategory === cat && { color: '#FFFFFF' }
              ]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Exercise Grid */}
        <View style={styles.grid}>
          {filteredExercises.map(ex => (
            <TouchableOpacity 
              key={ex.id} 
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ExercisePlayer', { exercise: ex })}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                {renderIcon(ex)}
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{ex.title}</Text>
              <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={2}>{ex.description}</Text>
              
              <View style={styles.cardFooter}>
                <View style={styles.durationTag}>
                  <Ionicons name="time-outline" size={12} color={colors.muted} />
                  <Text style={[styles.durationText, { color: colors.muted }]}>{ex.duration}</Text>
                </View>
                <View style={[styles.categoryTag, { backgroundColor: colors.background }]}>
                  <Text style={[styles.categoryTagText, { color: colors.secondary }]}>{ex.category}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: 24,
    paddingTop: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoryScroll: {
    marginBottom: 24,
  },
  categoryContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  categoryText: {
    fontWeight: '700',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 56) / 2,
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

export default ExercisesScreen;
