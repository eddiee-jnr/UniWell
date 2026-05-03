import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppStackNavigator } from './AppStackNavigator';
import { AuthStackNavigator } from './AuthStackNavigator';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  const { session, isGuest, setSession } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {(session || isGuest) ? (
          <Stack.Screen name="App" component={AppStackNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
