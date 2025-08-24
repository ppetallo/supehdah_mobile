import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

const PINK = '#FFC1CC';
const WHITE = '#FFFFFF';
const DARK = '#333';
const LIGHT = '#F8F6FF';

export default function ClinicSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleExitClinic = async () => {
    Alert.alert('Exit Clinic View', 'Return to Personal Mode?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Exit',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('selectedClinic');
          navigation.reset({ index: 0, routes: [{ name: 'PersonalTabs' }] });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clinic Settings</Text>
      <Text style={styles.text}>Only appointments and preferences for this clinic are shown here.</Text>
      <TouchableOpacity style={styles.exitButton} onPress={handleExitClinic}>
        <Text style={styles.exitText}>Exit Clinic View</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: LIGHT, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: DARK, marginBottom: 10 },
  text: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  exitButton: { backgroundColor: PINK, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  exitText: { color: WHITE, fontWeight: 'bold' },
}); 