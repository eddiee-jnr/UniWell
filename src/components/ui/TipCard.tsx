import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { WellnessTip } from '../../types';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

interface TipCardProps {
  tip: WellnessTip;
  onMarkRead: (id: string) => void;
  isRead: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  academic: { bg: '#38BDF822', text: '#38BDF8' },
  sleep:    { bg: '#A78BFA22', text: '#A78BFA' },
  social:   { bg: '#4ADE8022', text: '#4ADE80' },
};

export const TipCard: React.FC<TipCardProps> = ({ tip, onMarkRead, isRead }) => {
  const [expanded, setExpanded] = useState(false);
  const [marking, setMarking] = useState(false);
  const { session, isGuest } = useAuthStore();
  const cat = CATEGORY_COLORS[tip.category] ?? { bg: '#6B7A9922', text: '#6B7A99' };

  const handleMarkRead = async () => {
    if (isRead) return;
    setMarking(true);
    try {
      const userId = session?.user?.id || 'guest';
      const readAt = new Date().toISOString();

      // 1. Save locally to SQLite first (synced = 0)
      const { saveTipEngagementLocally, markTipEngagementAsSynced } = await import('../../services/storage');
      await saveTipEngagementLocally(userId, tip.id, readAt, 0);

      // 2. Update UI/Zustand store immediately
      onMarkRead(tip.id);
      setMarking(false);

      // 3. Sync to Supabase in the background if not a guest
      if (!isGuest && session) {
        (async () => {
          try {
            const { error } = await supabase.from('tip_engagements').upsert({
              user_id: userId,
              tip_id: tip.id,
              read_at: readAt,
            });
            if (!error) {
              await markTipEngagementAsSynced(userId, tip.id);
            } else {
              console.warn('[TipCard] Failed to sync tip_engagements to Supabase:', error.message);
            }
          } catch (err) {
            console.error('[TipCard] Network error syncing tip engagement:', err);
          }
        })();
      }
    } catch (err) {
      console.error('Failed to mark tip as read:', err);
      setMarking(false);
    }
  };

  return (
    <View style={{
      backgroundColor: '#111827', borderRadius: 20, padding: 20,
      borderWidth: 1, borderColor: isRead ? '#7C6FEB40' : '#1F2D45',
      marginBottom: 14,
    }}>
      <TouchableOpacity 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        {/* Category badge + read indicator */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            backgroundColor: cat.bg, borderRadius: 8,
            paddingHorizontal: 10, paddingVertical: 4,
          }}>
            <Text style={{ color: cat.text, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {tip.category}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isRead && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={16} color="#4ADE80" style={{ marginRight: 4 }} />
                <Text style={{ color: '#4ADE80', fontSize: 11, fontWeight: '600' }}>Read</Text>
              </View>
            )}
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#8899AA" />
          </View>
        </View>

        {/* Title */}
        <Text style={{ color: '#F0F4FF', fontSize: 16, fontWeight: '800', marginBottom: expanded ? 10 : 0, lineHeight: 22 }}>
          {tip.title}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={{ marginTop: 10 }}>
          {/* Body */}
          <Text style={{ color: '#8899AA', fontSize: 13, lineHeight: 21, marginBottom: 18 }}>
            {tip.body}
          </Text>

          {/* Done button */}
          <TouchableOpacity
            onPress={handleMarkRead}
            disabled={isRead || marking}
            style={{
              borderRadius: 12, paddingVertical: 13, alignItems: 'center',
              backgroundColor: isRead ? '#4ADE8015' : '#7C6FEB',
              borderWidth: isRead ? 1 : 0,
              borderColor: '#4ADE8040',
              opacity: marking ? 0.6 : 1,
            }}
          >
            <Text style={{ color: isRead ? '#4ADE80' : '#fff', fontWeight: '700', fontSize: 14 }}>
              {isRead ? '✓ Done' : marking ? 'Saving...' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TipCard;
