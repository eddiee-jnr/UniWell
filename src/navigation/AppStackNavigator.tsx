import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { AppTabNavigator } from './AppTabNavigator';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ExercisePlayerScreen } from '../screens/exercises/ExercisePlayerScreen';
import { WellnessAssessmentScreen } from '../screens/onboarding/WellnessAssessmentScreen';
import { WeeklyRefreshScreen } from '../screens/onboarding/WeeklyRefreshScreen';
import { TipsScreen } from '../screens/tips/TipsScreen';
import { ReportsListScreen } from '../screens/reports/ReportsListScreen';
import { ReportDetailScreen } from '../screens/reports/ReportDetailScreen';
import { NotificationsSettingsScreen } from '../screens/profile/NotificationsSettingsScreen';
import { PrivacySecurityScreen } from '../screens/profile/PrivacySecurityScreen';
import { DataIntegrationScreen } from '../screens/profile/DataIntegrationScreen';

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
      <Stack.Screen name="WeeklyRefresh" component={WeeklyRefreshScreen} />
      <Stack.Screen name="Tips" component={TipsScreen} />
      <Stack.Screen name="ReportsList" component={ReportsListScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="DataIntegration" component={DataIntegrationScreen} />
    </Stack.Navigator>
  );
};
