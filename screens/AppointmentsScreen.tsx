import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API } from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

const PINK = '#FFC1CC';
const PURPLE = '#B39DDB';
const WHITE = '#FFFFFF';
const DARK = '#333';
const LIGHT = '#F8F6FF';

type Clinic = {
  id: number;
  clinic_name: string;
  profile_picture?: string | null;
  logo?: string | null;
  image_url?: string | null;
  address?: string | null;
  contact_number?: string | null;
};

export default function AppointmentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [clinics, setClinics] = React.useState<Clinic[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [selectedClinicId, setSelectedClinicId] = React.useState<number | null>(null);

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

  const fetchClinics = React.useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await API.get('/clinics');
      const data = res.data?.data ?? res.data ?? [];
      setClinics(Array.isArray(data) ? data : []);
    } catch (e) {
      // could add toast/alert
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  React.useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  React.useEffect(() => {
    // Load previously selected clinic (if any)
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('selectedClinic');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.id) setSelectedClinicId(Number(parsed.id));
        }
      } catch {}
    })();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchClinics();
  }, [fetchClinics]);

  const handleSelectClinic = (clinic: Clinic) => {
    Alert.alert(
      'Enter Clinic Mode',
      `Use ${clinic.clinic_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select',
          style: 'default',
          onPress: async () => {
            const minimal = {
              id: clinic.id,
              clinic_name: clinic.clinic_name,
              image_url: toAbsoluteUrl(clinic.image_url) || toAbsoluteUrl(clinic.logo) || toAbsoluteUrl(clinic.profile_picture) || null,
              address: clinic.address ?? null,
            };
            await AsyncStorage.setItem('selectedClinic', JSON.stringify(minimal));
            setSelectedClinicId(clinic.id);
            navigation.reset({ index: 0, routes: [{ name: 'ClinicTabs' }] });
          },
        },
      ]
    );
  };

  const renderClinicCard = ({ item }: { item: Clinic }) => {
    // Prefer API-provided image_url, otherwise build it manually
    const remoteUri =
      toAbsoluteUrl(item.image_url) ||
      toAbsoluteUrl(item.logo) ||
      toAbsoluteUrl(item.profile_picture);

    const isSelected = selectedClinicId === item.id;

    return (
      <TouchableOpacity style={[styles.card, isSelected && styles.cardSelected]} activeOpacity={0.85} onPress={() => handleSelectClinic(item)}>
        {remoteUri ? (
          <Image source={{ uri: remoteUri }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.placeholderImage]}>
            <Ionicons name="medkit-outline" size={42} color={PURPLE} />
          </View>
        )}
        {isSelected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={16} color={WHITE} />
          </View>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.clinic_name}
          </Text>
          {!!item.address && (
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {item.address}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Clinics</Text>

      {loading && clinics.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PINK} />
          <Text style={styles.loadingText}>Loading clinics...</Text>
        </View>
      ) : (
        <FlatList
          data={clinics}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={renderClinicCard}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="business-outline" size={48} color={PURPLE} />
              <Text style={styles.emptyTitle}>No clinics found</Text>
              <Text style={styles.emptyText}>
                Pull to refresh or check back later.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PINK}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 50,
    marginBottom: 8,
    textAlign: 'center',
    color: DARK,
  },
  listContent: { paddingHorizontal: 14, paddingBottom: 20, paddingTop: 6 },
  row: { justifyContent: 'space-between' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: DARK },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: { marginTop: 10, fontSize: 18, fontWeight: 'bold', color: DARK },
  emptyText: { marginTop: 4, fontSize: 14, color: '#666' },

  card: {
    backgroundColor: WHITE,
    width: '48%',
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: PINK,
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f2f2f2',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: PINK,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  cardFooter: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: DARK,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
