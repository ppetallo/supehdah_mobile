import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ClinicHomeScreen from '../screens/ClinicHomeScreen';
import ClinicAppointmentsScreen from '../screens/ClinicAppointmentsScreen';
import ClinicGalleryScreen from '../screens/ClinicGalleryScreen';
import ClinicSettingsScreen from '../screens/ClinicSettingsScreen';

const Tab = createBottomTabNavigator();

export default function ClinicTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'ClinicHome') iconName = 'business';
          else if (route.name === 'ClinicAppointments') iconName = 'calendar';
          else if (route.name === 'ClinicGallery') iconName = 'images';
          else if (route.name === 'ClinicSettings') iconName = 'settings';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFC1CC',
        tabBarInactiveTintColor: '#333',
      })}
    >
      <Tab.Screen name="ClinicHome" component={ClinicHomeScreen} />
      <Tab.Screen name="ClinicAppointments" component={ClinicAppointmentsScreen} />
      <Tab.Screen name="ClinicGallery" component={ClinicGalleryScreen} />
      <Tab.Screen name="ClinicSettings" component={ClinicSettingsScreen} />
    </Tab.Navigator>
  );
} 