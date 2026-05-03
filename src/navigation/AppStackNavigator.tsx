import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { AppTabNavigator } from './AppTabNavigator';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ExercisePlayerScreen } from '../screens/exercises/ExercisePlayerScreen';
import { WellnessAssessmentScreen } from '../screens/onboarding/WellnessAssessmentScreen';

const Stack = createStackNavigator();

export const AppStackNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Tabs" component={AppTabNavigator} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ExercisePlayer" component={ExercisePlayerScreen} />
      <Stack.Screen name="WellnessAssessment" component={WellnessAssessmentScreen} />
    </Stack.Navigator>
  );
};
