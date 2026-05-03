import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const stats = [
  { icon: 'meditation', value: '128', label: 'TOTAL SESSIONS', lib: 'MaterialCommunityIcons' },
  { icon: 'time-outline', value: '56.4', label: 'HOURS MINDFUL', lib: 'Ionicons' },
  { icon: 'footsteps-outline', value: '8.2k', label: 'DAILY STEPS', lib: 'Ionicons' },
  { icon: 'moon-outline', value: '7.5h', label: 'AVG SLEEP', lib: 'Ionicons' },
];

const settings = [
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'shield-checkmark-outline', label: 'Privacy & Security' },
  { icon: 'sync-outline', label: 'Data Integration' },
];

export const ProfileScreen = () => {
  const { signOut, isGuest, userProfile, updateProfile } = useAuthStore();
  const { theme, setTheme, colors } = useTheme();

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState(userProfile.name);
  const [editedBio, setEditedBio] = useState(userProfile.bio);

  const handleSaveProfile = () => {
    updateProfile({ name: editedName, bio: editedBio });
    setEditModalVisible(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontWeight: '700' }}>UniWell Account</Text>
          </View>
          <TouchableOpacity onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
             <Ionicons name={theme === 'dark' ? "moon" : "sunny"} size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Avatar + Name */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <TouchableOpacity 
            onPress={() => !isGuest && setEditModalVisible(true)}
            style={{ position: 'relative', marginBottom: 14 }}
          >
            <View style={{ 
              width: 90, height: 90, borderRadius: 45, 
              backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', 
              borderWidth: 3, borderColor: colors.secondary 
            }}>
              <Ionicons name="person" size={50} color={colors.primary} />
            </View>
            {!isGuest && (
              <View style={{ position: 'absolute', right: 0, bottom: 0, backgroundColor: colors.primary, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background }}>
                <Ionicons name="pencil" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
            {isGuest ? 'Guest User' : userProfile.name}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>{isGuest ? 'Limited Access Mode' : userProfile.bio}</Text>
        </View>

        {/* Theme Setting Row */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 14 }}>PREFERENCES</Text>
          <TouchableOpacity 
            onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name={theme === 'dark' ? "moon-outline" : "sunny-outline"} size={20} color={colors.primary} style={{ marginRight: 14 }} />
            <Text style={{ color: colors.text, fontWeight: '600', flex: 1 }}>Display Theme</Text>
            <View style={{ backgroundColor: colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>{theme}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 14 }}>ACCOUNT SETTINGS</Text>
          {[
            { icon: 'notifications-outline', label: 'Notifications' },
            { icon: 'shield-checkmark-outline', label: 'Privacy & Security' },
            { icon: 'sync-outline', label: 'Data Integration' },
          ].map((s) => (
            <TouchableOpacity key={s.label} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name={s.icon as any} size={20} color={colors.primary} style={{ marginRight: 14 }} />
              <Text style={{ color: colors.text, fontWeight: '600', flex: 1 }}>{s.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={signOut} style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F8717140', backgroundColor: '#F8717110' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="log-out-outline" size={20} color="#F87171" style={{ marginRight: 8 }} />
              <Text style={{ color: '#F87171', fontWeight: '700', fontSize: 16 }}>{isGuest ? 'Exit Guest Mode' : 'Logout'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 20 }}>Edit Profile</Text>
            
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>FULL NAME</Text>
            <TextInput
              style={{ backgroundColor: colors.background, color: colors.text, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Your Name"
              placeholderTextColor={colors.muted}
            />

            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>BIO / STATUS</Text>
            <TextInput
              style={{ backgroundColor: colors.background, color: colors.text, borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}
              value={editedBio}
              onChangeText={setEditedBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.muted}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveProfile}
                style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 14, alignItems: 'center', borderRadius: 12 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default ProfileScreen;
