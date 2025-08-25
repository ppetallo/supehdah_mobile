import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import PersonalTabs from './navigation/PersonalTabs';
import EditProfileScreen from './screens/EditProfileScreen';
import ClinicTabs from './navigation/ClinicTabs';
import RegisterScreen from './screens/RegisterScreen';

export type RootStackParamList = {
  Login: undefined;
  PersonalTabs: undefined;
  EditProfile: undefined;
  Register: undefined;
  ClinicTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PersonalTabs" component={PersonalTabs} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ClinicTabs" component={ClinicTabs} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


// import React, { useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import LoginScreen from './supehdah/screens/LoginScreen';
// import HomeScreen from './supehdah/screens/HomeScreen';
// // ...import other screens...

// const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();

// function PersonalTabs() {
//   return (
//     <Tab.Navigator>
//       <Tab.Screen name="Home" component={HomeScreen} />
//       <Tab.Screen name="Appointments" component={AppointmentsScreen} />
//       <Tab.Screen name="Settings" component={SettingsScreen} />
//     </Tab.Navigator>
//   );
// }

// function ClinicTabs() {
//   return (
//     <Tab.Navigator>
//       <Tab.Screen name="ClinicHome" component={ClinicHomeScreen} />
//       <Tab.Screen name="ClinicAppointments" component={ClinicAppointmentsScreen} />
//       <Tab.Screen name="Gallery" component={GalleryScreen} />
//       <Tab.Screen name="Settings" component={ClinicSettingsScreen} />
//     </Tab.Navigator>
//   );
// }

// export default function App() {
//   const [mode, setMode] = useState<'personal' | 'clinic'>('personal');
//   // ...manage selectedClinic state...

//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="Login" component={LoginScreen} />
//         {mode === 'personal' ? (
//           <Stack.Screen name="PersonalTabs" component={PersonalTabs} />
//         ) : (
//           <Stack.Screen name="ClinicTabs" component={ClinicTabs} />
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }