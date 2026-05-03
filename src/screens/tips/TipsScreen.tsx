import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { TipCard } from '../../components/ui/TipCard';
import { WellnessTip } from '../../types';
import { supabase } from '../../services/supabase';
import localTips from '../../data/tips.json';

type FilterCategory = 'all' | 'academic' | 'sleep' | 'social';

const FILTERS: { label: string; value: FilterCategory }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Academic', value: 'academic' },
  { label: 'Sleep',    value: 'sleep' },
  { label: 'Social',   value: 'social' },
];

export const TipsScreen: React.FC = () => {
  const [tips, setTips] = useState<WellnessTip[]>([]);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  const fetchTips = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wellness_tips')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // Fallback to local JSON
        setTips(localTips as WellnessTip[]);
        setIsOffline(true);
      } else {
        setTips(data as WellnessTip[]);
        setIsOffline(false);
      }
    } catch (_) {
      // Network error — use local fallback
      setTips(localTips as WellnessTip[]);
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTips();
  };

  const handleMarkRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  const filteredTips =
    filter === 'all' ? tips : tips.filter((t) => t.category === filter);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0F1E', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#7C6FEB" />
        <Text style={{ color: '#6B7A99', marginTop: 16, fontSize: 14 }}>Loading wellness tips...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0A0F1E' }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C6FEB" />
      }
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 }}>
        <Text style={{ color: '#F0F4FF', fontSize: 26, fontWeight: '800', marginBottom: 4 }}>
          Wellness Tips
        </Text>
        <Text style={{ color: '#6B7A99', fontSize: 13, marginBottom: 16 }}>
          Evidence-based advice for university life.
        </Text>

        {/* Offline Banner */}
        {isOffline && (
          <View style={{
            backgroundColor: '#FBBF2415', borderRadius: 12, padding: 12,
            flexDirection: 'row', alignItems: 'center', marginBottom: 16,
            borderWidth: 1, borderColor: '#FBBF2440',
          }}>
            <Text style={{ color: '#FBBF24', fontSize: 12, flex: 1 }}>
              📴 Showing offline tips. Pull to refresh when connected.
            </Text>
          </View>
        )}

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
            {FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  style={{
                    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 50,
                    backgroundColor: active ? '#7C6FEB' : '#111827',
                    borderWidth: 1,
                    borderColor: active ? '#A78BFA' : '#1F2D45',
                  }}
                >
                  <Text style={{
                    color: active ? '#fff' : '#6B7A99',
                    fontWeight: '700', fontSize: 13,
                  }}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Tips Count */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ color: '#4D5F7A', fontSize: 12 }}>
          {filteredTips.length} tip{filteredTips.length !== 1 ? 's' : ''} •{' '}
          {readIds.size} read
        </Text>
      </View>

      {/* Tips List */}
      <View style={{ paddingHorizontal: 20 }}>
        {filteredTips.length === 0 ? (
          <View style={{
            alignItems: 'center', justifyContent: 'center',
            padding: 40, backgroundColor: '#111827', borderRadius: 20,
            borderWidth: 1, borderColor: '#1F2D45',
          }}>
            <Text style={{ color: '#4D5F7A', fontSize: 14 }}>No tips in this category yet.</Text>
          </View>
        ) : (
          filteredTips.map((tip) => (
            <TipCard
              key={tip.id}
              tip={tip}
              isRead={readIds.has(tip.id)}
              onMarkRead={handleMarkRead}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default TipsScreen;
