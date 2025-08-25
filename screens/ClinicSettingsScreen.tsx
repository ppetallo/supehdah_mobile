import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';
import { API } from '../src/api';

// Professional color scheme
const PRIMARY = '#4A6FA5';
const SECONDARY = '#FF6B6B';
const WHITE = '#FFFFFF';
const DARK = '#2D3142';
const LIGHT = '#F6F8FF';
const GRAY = '#9DA3B4';
const SHADOW = 'rgba(0, 0, 0, 0.1)';

type Clinic = {
  id: number;
  clinic_name: string;
  name?: string;  // Keep old field for compatibility
  address?: string;
  logo?: string | null;
  image_url?: string | null;
  profile_picture?: string | null;
  logo_url?: string | null;
  phone?: string;
  contact_number?: string | null;
  email?: string;
  created_at?: string;
  is_open?: boolean;
};

type HistoryItem = {
  id: number;
  type: 'appointment' | 'visit' | 'prescription' | 'payment';
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'upcoming' | 'cancelled';
  amount?: number;
  pet_name?: string;
};

export default function ClinicSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Base URL (without /api suffix)
  const hostBase = React.useMemo(() => {
    const base = API.defaults.baseURL || '';
    return base.replace(/\/$/, '').replace(/\/(api)?$/, '');
  }, []);

  // Convert Laravel paths into absolute URLs
  const toAbsoluteUrl = (maybePath?: string | null): string | undefined => {
    if (!maybePath) return undefined;

    // Already full URL
    if (/^https?:\/\//i.test(maybePath)) return maybePath;

    // Laravel asset('storage/...') returns `/storage/...`
    const path = maybePath.startsWith('/') ? maybePath : `/storage/${maybePath}`;
    return `${hostBase}${path}`;
  };

  // Fetch clinic details
  useEffect(() => {
    fetchClinicData();
  }, []);

  const fetchClinicData = async () => {
    try {
      setLoading(true);
      // Get clinic ID from storage
      const storedClinic = await AsyncStorage.getItem('selectedClinic');
      if (!storedClinic) return;
      
      const clinicData = JSON.parse(storedClinic);
      console.log('Clinic data from storage:', clinicData);
      
      // Convert field names if needed for compatibility
      const processedClinic = {
        ...clinicData,
        // Make sure we have both clinic_name and name available
        clinic_name: clinicData.clinic_name || clinicData.name,
        name: clinicData.name || clinicData.clinic_name,
      };
      
      setClinic(processedClinic);
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    fetchClinicData();
  };

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
      <StatusBar backgroundColor={LIGHT} barStyle="dark-content" />
      
      {/* Header with Clinic Info */}
      <LinearGradient
        colors={[WHITE, LIGHT]}
        style={styles.headerContainer}
      >
        <Text style={styles.title}>Clinic Settings</Text>
        {clinic ? (
          <View style={styles.clinicInfo}>
            <View style={styles.clinicImageContainer}>
              {/* Get image from any available source, similar to AppointmentsScreen */}
              {(() => {
                const remoteUri = 
                  toAbsoluteUrl(clinic.image_url) || 
                  toAbsoluteUrl(clinic.logo) || 
                  toAbsoluteUrl(clinic.logo_url) || 
                  toAbsoluteUrl(clinic.profile_picture);
                  
                return remoteUri ? (
                  <Image 
                    source={{ uri: remoteUri }} 
                    style={styles.clinicImage}
                    resizeMode="cover" 
                  />
                ) : (
                  <View style={[styles.clinicImage, styles.placeholderImage]}>
                    <FontAwesome5 name="hospital" size={24} color={GRAY} />
                  </View>
                );
              })()}
            </View>
            <View style={styles.clinicDetails}>
              <Text style={styles.clinicName}>{clinic.clinic_name || clinic.name}</Text>
              {clinic.address && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="location-on" size={14} color={GRAY} />
                  <Text style={styles.infoText}>{clinic.address}</Text>
                </View>
              )}
              {(clinic.phone || clinic.contact_number) && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="phone" size={14} color={GRAY} />
                  <Text style={styles.infoText}>{clinic.phone || clinic.contact_number}</Text>
                </View>
              )}
              {clinic.email && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="email" size={14} color={GRAY} />
                  <Text style={styles.infoText}>{clinic.email}</Text>
                </View>
              )}
            </View>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color={PRIMARY} style={{ marginVertical: 20 }} />
        ) : (
          <Text style={styles.text}>No clinic information available</Text>
        )}
      </LinearGradient>

      {/* Exit Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={styles.exitButton} 
          onPress={handleExitClinic}
          activeOpacity={0.8}
        >
          <MaterialIcons name="exit-to-app" size={18} color={WHITE} style={styles.exitIcon} />
          <Text style={styles.exitText}>Exit Clinic View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: LIGHT 
  },
  headerContainer: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: DARK,
    marginBottom: 15
  },
  text: { 
    fontSize: 15, 
    color: GRAY, 
    marginBottom: 20 
  },
  clinicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  clinicImageContainer: {
    marginRight: 15,
  },
  clinicImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: WHITE,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  clinicDetails: {
    flex: 1,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK,
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    color: GRAY,
    marginLeft: 5,
    flex: 1,
  },
  
  // Settings section
  settingsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK,
    marginBottom: 15,
  },
  
  // Profile card styles
  profileCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 25,
    marginBottom: 20,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: LIGHT,
  },
  placeholderProfileImage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: '#E5E8EC',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: DARK,
    marginBottom: 5,
    textAlign: 'center',
  },
  memberSince: {
    fontSize: 14,
    color: GRAY,
    marginBottom: 15,
    textAlign: 'center',
  },
  profileAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  profileAddress: {
    fontSize: 14,
    color: GRAY,
    textAlign: 'center',
  },
  // Additional styles for the loader
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: GRAY,
    fontSize: 16,
  },
  
  // Footer and exit button
  footerContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  exitButton: {
    backgroundColor: SECONDARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  exitIcon: {
    marginRight: 8,
  },
  exitText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 30,
  },
}); 