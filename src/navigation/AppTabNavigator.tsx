import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { MoodTrackerScreen } from '../screens/mood/MoodTrackerScreen';
import { ExerciseListScreen } from '../screens/exercises/ExerciseListScreen';
import { ResourceDirectoryScreen } from '../screens/resources/ResourceDirectoryScreen';
import { CalendarScreen } from '../screens/exercises/CalendarScreen';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();

  return (
    <View style={[styles.tabBarContainer, { bottom: insets.bottom + 20 }]}>
      <BlurView 
        intensity={50} 
        tint={theme === 'dark' ? 'dark' : 'light'} 
        style={[
          styles.blurContainer, 
          { 
            backgroundColor: theme === 'dark' ? 'rgba(10, 15, 29, 0.7)' : 'rgba(241, 245, 249, 0.6)',
            borderColor: theme === 'dark' ? colors.border : 'rgba(15, 23, 42, 0.1)'
          }
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) { navigation.navigate(route.name); }
          };

          let iconName: any = '';
          let IconComp: any = Ionicons;

          switch (route.name) {
            case 'Home': iconName = 'grid-outline'; break;
            case 'Calendar': iconName = 'calendar-outline'; break;
            case 'Track': iconName = 'pulse'; break;
            case 'Exercises': iconName = 'dumbbell'; IconComp = MaterialCommunityIcons; break;
            case 'Support': iconName = 'headset-outline'; break;
          }

          const activeColor = theme === 'dark' ? colors.primary : '#7C6FEB'; 
          const inactiveColor = colors.muted;

          return (
            <TouchableOpacity key={index} onPress={onPress} style={styles.tabItem}>
              <View style={[
                styles.iconWrapper, 
                isFocused && { 
                  backgroundColor: theme === 'dark' ? activeColor + '30' : activeColor + '15', 
                  borderRadius: 20 
                }
              ]}>
                <IconComp 
                  name={iconName} 
                  size={isFocused ? 24 : 20} 
                  color={isFocused ? activeColor : inactiveColor} 
                />
              </View>
              <Text style={[
                styles.tabLabel, 
                { 
                  color: isFocused ? activeColor : inactiveColor,
                  fontWeight: isFocused ? '900' : '700',
                  fontSize: isFocused ? 10 : 9
                }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
};

import { useAuthStore } from '../store/authStore';

export const AppTabNavigator = () => {
  const { isGuest } = useAuthStore();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      {!isGuest && <Tab.Screen name="Calendar" component={CalendarScreen} />}
      <Tab.Screen name="Track" component={MoodTrackerScreen} />
      <Tab.Screen name="Exercises" component={ExerciseListScreen} />
      <Tab.Screen name="Support" component={ResourceDirectoryScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: { 
    position: 'absolute', 
    left: 12, 
    right: 12, 
    alignItems: 'center' 
  },
  blurContainer: { 
    flexDirection: 'row', 
    height: 75,
    borderRadius: 40, 
    borderWidth: 1, 
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      }
    })
  },
  tabItem: { 
    alignItems: 'center', 
    justifyContent: 'center',
    height: '100%',
    flex: 1,
    paddingTop: 4
  },
  iconWrapper: { 
    padding: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 2
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});
