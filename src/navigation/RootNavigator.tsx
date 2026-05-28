import React, { useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { AppStackNavigator } from './AppStackNavigator';
import { AuthStackNavigator } from './AuthStackNavigator';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

const Stack = createStackNavigator();
export const navigationRef = createNavigationContainerRef();

export const RootNavigator = () => {
  const { session, isGuest, setSession, signOut } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data && data.type) {
        const navigateWhenReady = () => {
          if (navigationRef.isReady()) {
            const nav = navigationRef as any;
            if (data.type === 'deadline') {
              nav.navigate('Tabs', { screen: 'Calendar' });
            } else if (data.type === 'wellness_checkin') {
              nav.navigate('Tabs', { screen: 'Track' });
            } else if (data.type === 'weekly_report' || data.type === 'monthly_report') {
              nav.navigate('ReportsList');
            } else if (data.type === 'exam_nudge') {
              nav.navigate('Tabs', { screen: 'Exercises' });
            }
          } else {
            setTimeout(navigateWhenReady, 200);
          }
        };
        navigateWhenReady();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <View style={{ flex: 1 }}>
        {isGuest && (
          <SafeAreaView style={{ 
            backgroundColor: '#1E293B', 
            borderBottomWidth: 1, 
            borderBottomColor: '#334155',
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 0
          }}>
            <View style={{ 
              paddingVertical: 10,
              paddingHorizontal: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 14, marginRight: 6 }}>💡</Text>
                <Text style={{ color: '#E2E8F0', fontSize: 11, fontWeight: '500', flex: 1, lineHeight: 15 }}>
                  You are in Guest Mode. To save your progress and unlock streaks, create an account.
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => signOut()}
                style={{ 
                  backgroundColor: '#F59E0B', 
                  paddingHorizontal: 10, 
                  paddingVertical: 5, 
                  borderRadius: 6 
                }}
              >
                <Text style={{ color: '#1E293B', fontSize: 11, fontWeight: '700' }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
        
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {(session || isGuest) ? (
            <Stack.Screen name="App" component={AppStackNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthStackNavigator} />
          )}
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
};
