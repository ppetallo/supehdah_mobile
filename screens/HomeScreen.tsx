import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import { API } from '../src/api';
import { useNavigation } from '@react-navigation/native';

const PINK = '#FF6B8A';
const PURPLE = '#6C5CE7';
const WHITE = '#FFFFFF';
const DARK = '#2E2E36';
const LIGHT = '#F6F7FB';
const MUTED = '#7B7B8C';

type Appointment = {
  id: string;
  pet: string;
  what: string;
  when: string; // format: 'YYYY-MM-DD HH:mm' (we extract date part)
  clinic: string;
};

type Pet = {
  id: string;
  name: string;
  type: string;
  breed?: string;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = React.useState<boolean>(false);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [loadingUser, setLoadingUser] = React.useState<boolean>(false);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [pets, setPets] = React.useState<Pet[]>([]);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  const getTimeBasedGreeting = React.useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  }, []);

  const fetchUserData = React.useCallback(async () => {
    try {
      setLoadingUser(true);
      const res = await API.get('/me');
      setUserName(res.data?.name ?? null);
    } catch (e) {
      console.error('Failed to fetch user:', e);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // *** TEMP: use mock appointment data instead of fetching from API ***
  const fetchAppointments = React.useCallback(async () => {
    try {
      // Temporary hard-coded appointments
      const mock: Appointment[] = [
        { id: 'a1', pet: 'Bella', what: 'Vaccination', when: '2025-08-28 10:00', clinic: 'Happy Paws Clinic' },
        { id: 'a2', pet: 'Max', what: 'Check-up', when: '2025-09-02 14:00', clinic: 'City Vet' },
        { id: 'a3', pet: 'Luna', what: 'Grooming', when: '2025-09-10 09:00', clinic: 'Pet Styles' },
      ];

      // keep same logic as before (max 3)
      setAppointments(mock.slice(0, 3));
    } catch (e) {
      console.error('Failed to set mock appointments:', e);
      setAppointments([]);
    }
  }, []);

  // Fetch real pets from backend (same logic as PetScreen)
  const fetchPets = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await API.get('/pets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data?.status === 'success' || response.data?.data) {
        // Support both response.data.data and response.data.pets
        const petsData = response.data.data || response.data.pets || [];
        // Map to HomeScreen Pet type
        const mappedPets = petsData.map((pet: any) => ({
          id: pet.id?.toString() ?? '',
          name: pet.name,
          type: pet.type || pet.breed || '',
          breed: pet.breed || '',
        }));
        setPets(mappedPets.slice(0, 2)); // Show max 2
      } else {
        setPets([]);
      }
    } catch (e) {
      console.error('Failed to fetch pets:', e);
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllData = React.useCallback(async () => {
    if (!refreshing) setLoading(true);

    await Promise.all([fetchUserData(), fetchAppointments(), fetchPets()]);

    setLoading(false);
    setRefreshing(false);
  }, [refreshing, fetchUserData, fetchAppointments, fetchPets]);

  React.useEffect(() => {
    fetchAllData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAllData();
  }, [fetchAllData]);

  // temp routes used: 'Appointments', 'Records', 'Pets' — replace with your route names as needed
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header (centered, time-based greeting) */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getTimeBasedGreeting()}</Text>
          <Text style={styles.username}>{userName ?? (loadingUser ? 'Loading...' : 'User')}</Text>
        </View>

        {/* Quick Actions with routes */}
        <View style={styles.quickActions}>
          <Action
            icon="calendar"
            label="Book"
            color="#FFEAEA"
            iconColor={PINK}
            onPress={() => navigation.navigate('Appointments')}
          />
          <Action
            icon="map-marker-radius"
            label="Clinics"
            color="#E9FFF1"
            iconColor="#1DB954"
            onPress={() => navigation.navigate('Appointments')}
          />
          <Action
            icon="file-document"
            label="Records"
            color="#FFF7EA"
            iconColor="#FF9F1C"
            onPress={() => navigation.navigate('Records')}
          />
        </View>

        {/* My Pets Section */}
        {pets.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Pets</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Pets')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.petsContainer}>
              {pets.map((pet) => (
                <View key={pet.id} style={styles.petCard}>
                  <View style={styles.petIcon}>
                    <MaterialCommunityIcons
                      name={
                        pet.type.toLowerCase().includes('dog')
                          ? 'dog'
                          : pet.type.toLowerCase().includes('cat')
                          ? 'cat'
                          : 'paw'
                      }
                      size={24}
                      color={PURPLE}
                    />
                  </View>
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petType}>{pet.breed}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Welcome Card - Show only if no pets */}
        {pets.length === 0 && (
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeTitle}>Welcome to SuPehDah</Text>
              <Text style={styles.welcomeText}>
                Manage appointments, records, and connect with trusted clinics — all in one place.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Appointments')}>
                <Text style={styles.primaryBtnText}>Book Appointment</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.welcomeGraphic}>
              <MaterialCommunityIcons name="dog-side" size={48} color={PINK} />
            </View>
          </View>
        )}

        {/* Appointments & Calendar */}
        <View style={styles.rowCards}>
          <View style={styles.cardSmall}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Upcoming</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {loading && appointments.length === 0 ? (
              <ActivityIndicator size="small" color={PURPLE} style={{ margin: 12 }} />
            ) : appointments.length > 0 ? (
              <FlatList
                data={appointments}
                keyExtractor={(i) => i.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.appItem}
                    onPress={() => navigation.navigate('AppointmentDetails', { id: item.id })}
                  >
                    <View style={styles.appInfo}>
                      <Text style={styles.appWhat}>{item.what}</Text>
                      <Text style={styles.appMeta}>
                        {item.pet} • {item.when}
                      </Text>
                    </View>
                    <Text style={styles.appClinic}>{item.clinic}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank" size={32} color={MUTED} />
                <Text style={styles.emptyText}>No appointments scheduled</Text>
                <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate('Appointments')}>
                  <Text style={styles.emptyActionText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.cardLarge}>
            <Text style={styles.cardTitle}>Calendar</Text>
            <Calendar
              style={styles.calendar}
              theme={{
                backgroundColor: WHITE,
                calendarBackground: WHITE,
                textSectionTitleColor: DARK,
                selectedDayBackgroundColor: PURPLE,
                selectedDayTextColor: WHITE,
                todayTextColor: PINK,
                dayTextColor: DARK,
                arrowColor: PINK,
                monthTextColor: DARK,
                textMonthFontWeight: '700',
                textDayFontWeight: '500',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
              markedDates={appointments.reduce((acc, app) => {
                if (app.when) {
                  const date = app.when.split(' ')[0]; // Extract date part
                  acc[date] = { selected: true, selectedColor: PURPLE };
                }
                return acc;
              }, {} as any)}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({
  icon,
  label,
  color,
  iconColor,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  iconColor: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.actionItem, { backgroundColor: color }]} onPress={onPress}>
      <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT },
  content: { padding: 18, paddingBottom: 40 },
  // Header centered and vertically stacked
  header: { alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 25},
  greeting: { color: MUTED, fontSize: 14 },
  username: { color: DARK, fontSize: 22, fontWeight: '700' },
  avatar: { backgroundColor: PURPLE, width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: DARK },
  filterBtn: { marginLeft: 10, backgroundColor: PURPLE, width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  actionItem: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  actionLabel: { marginTop: 6, fontSize: 12, color: DARK },

  // Section styles
  sectionCard: { backgroundColor: WHITE, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: DARK },
  seeAllText: { fontSize: 14, color: PURPLE, fontWeight: '600' },

  // Pet card styles
  petsContainer: { flexDirection: 'row', gap: 12 },
  petCard: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12, alignItems: 'center' },
  petIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  petInfo: { alignItems: 'center' },
  petName: { fontSize: 14, fontWeight: '600', color: DARK, textAlign: 'center' },
  petType: { fontSize: 12, color: MUTED, textAlign: 'center', marginTop: 2 },

  welcomeCard: { backgroundColor: WHITE, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 16, shadowColor: '#B39DDB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  welcomeLeft: { flex: 1 },
  welcomeTitle: { fontSize: 16, fontWeight: '700', color: DARK, marginBottom: 6 },
  welcomeText: { color: MUTED, fontSize: 13, marginBottom: 10 },
  welcomeGraphic: { width: 68, height: 68, borderRadius: 12, backgroundColor: '#FFF0F6', alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { backgroundColor: PURPLE, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignSelf: 'flex-start' },
  primaryBtnText: { color: WHITE, fontWeight: '700' },

  rowCards: { flexDirection: 'column', gap: 12 },
  cardSmall: { backgroundColor: WHITE, borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardLarge: { backgroundColor: WHITE, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: PURPLE, marginBottom: 8 },

  // Appointment styles
  appItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F2F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appInfo: { flexDirection: 'column', flex: 1 },
  appWhat: { fontSize: 14, fontWeight: '600', color: DARK },
  appMeta: { fontSize: 12, color: MUTED, marginTop: 2 },
  appClinic: { fontSize: 12, color: MUTED, textAlign: 'right', maxWidth: 100 },

  // Empty state styles
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 14, color: MUTED, marginTop: 8, marginBottom: 12 },
  emptyAction: { backgroundColor: PURPLE, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  emptyActionText: { color: WHITE, fontSize: 12, fontWeight: '600' },

  calendar: { borderRadius: 8, overflow: 'hidden', marginTop: 6 },
});
