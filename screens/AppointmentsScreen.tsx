import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { API } from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { LinearGradient } from 'expo-linear-gradient';

// Palette matched to Home/Settings
const PINK = '#FF6B8A';
const PURPLE = '#6C5CE7';
const WHITE = '#FFFFFF';
const DARK = '#2E2E36';
const LIGHT = '#F6F7FB';
const GRAY = '#9DA3B4';
const SHADOW = 'rgba(0,0,0,0.06)';
const SCREEN_WIDTH = Dimensions.get('window').width;

// Status colors
const OPEN_GREEN = '#27AE60';
const CLOSED_RED = '#E74C3C';

type Clinic = {
  id: number;
  clinic_name: string;
  profile_picture?: string | null;
  logo?: string | null;
  image_url?: string | null;
  address?: string | null;
  contact_number?: string | null;
  is_open: boolean;
};

export default function AppointmentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [clinics, setClinics] = React.useState<Clinic[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [selectedClinicId, setSelectedClinicId] = React.useState<number | null>(null);

  // Base URL (without /api suffix)
  const hostBase = React.useMemo(() => {
    const base = (API.defaults && API.defaults.baseURL) || '';
    return base.replace(/\/$/, '').replace(/\/(api)?$/, '');
  }, []);

  // Convert Laravel paths into absolute URLs
  const toAbsoluteUrl = (maybePath?: string | null): string | undefined => {
    if (!maybePath) return undefined;
    if (/^https?:\/\//i.test(maybePath)) return maybePath;
    const path = maybePath.startsWith('/') ? maybePath : `/storage/${maybePath}`;
    return `${hostBase}${path}`;
  };

  // Function to fetch the clinic status directly
  const fetchClinicStatus = async (clinicId: number) => {
    try {
      const res = await API.get(`/clinic-status/${clinicId}`);
      return res.data?.is_open === true;
    } catch (e) {
      console.error(`Error fetching status for clinic ${clinicId}:`, e);
      return false;
    }
  };

  const fetchClinics = React.useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await API.get('/clinics');
      const data = res.data?.data ?? res.data ?? [];

      let processedClinics = Array.isArray(data)
        ? data.map((clinic: any) => ({
            ...clinic,
            is_open: false, // default while we fetch statuses
          }))
        : [];

      setClinics(processedClinics);

      if (processedClinics.length > 0) {
        const updatedClinics = [...processedClinics];
        const statusPromises = updatedClinics.map(async (clinic, index) => {
          try {
            const isOpen = await fetchClinicStatus(clinic.id);
            updatedClinics[index] = { ...clinic, is_open: isOpen };
          } catch (e) {
            console.error(`Error updating status for clinic ${clinic.id}:`, e);
          }
        });

        await Promise.all(statusPromises);
        setClinics(updatedClinics);
      }
    } catch (e) {
      console.error('Error fetching clinics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  React.useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  React.useEffect(() => {
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
      'Select Clinic',
      `Would you like to access ${clinic.clinic_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'default',
          onPress: async () => {
            try {
              const minimal = {
                id: clinic.id,
                clinic_name: clinic.clinic_name,
                image_url:
                  toAbsoluteUrl(clinic.image_url) ||
                  toAbsoluteUrl(clinic.logo) ||
                  toAbsoluteUrl(clinic.profile_picture) ||
                  null,
                address: clinic.address ?? null,
                contact_number: clinic.contact_number ?? null,
                is_open: clinic.is_open,
              };

              await AsyncStorage.setItem('selectedClinic', JSON.stringify(minimal));
              setSelectedClinicId(clinic.id);

              navigation.reset({
                index: 0,
                routes: [{ name: 'ClinicTabs' }],
              });
            } catch (error) {
              Alert.alert('Error', 'There was a problem selecting this clinic. Please try again.', [{ text: 'OK' }]);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderClinicCard = ({ item }: { item: Clinic }) => {
    const remoteUri =
      toAbsoluteUrl(item.image_url) || toAbsoluteUrl(item.logo) || toAbsoluteUrl(item.profile_picture);

    const isSelected = selectedClinicId === item.id;
    const isOpen = item.is_open;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        activeOpacity={0.85}
        onPress={() => handleSelectClinic(item)}
      >
        <View style={styles.cardImageContainer}>
          {remoteUri ? (
            <Image source={{ uri: remoteUri }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.placeholderImage]}>
              <FontAwesome5 name="hospital-user" size={28} color={GRAY} />
            </View>
          )}

          {/* subtle overlay for selected */}
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <Ionicons name="checkmark-circle" size={22} color={WHITE} />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.clinic_name}
          </Text>

          {!!item.address && (
            <View style={styles.addressContainer}>
              <MaterialIcons name="location-on" size={14} color={PURPLE} />
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
          )}

          {!!item.contact_number && (
            <View style={styles.contactContainer}>
              <MaterialIcons name="phone" size={12} color={PINK} />
              <Text style={styles.contactText} numberOfLines={1}>
                {item.contact_number}
              </Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <View style={[styles.cardBadge, isOpen ? styles.openBadge : styles.closedBadge]}>
              <Text style={[styles.cardBadgeText, isOpen ? styles.openText : styles.closedText]}>
                {isOpen ? 'Open Now' : 'Closed'}
              </Text>
            </View>

            <View style={styles.actionButton}>
              <Text style={styles.actionText}>Select</Text>
              <MaterialIcons name="arrow-forward-ios" size={12} color={PURPLE} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={LIGHT} barStyle="dark-content" />

      <LinearGradient colors={[WHITE, LIGHT]} style={styles.headerContainer}>
        <Text style={styles.header}>Available Clinics</Text>
        <Text style={styles.subheader}>Choose a clinic to continue</Text>

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color={GRAY} />
          <Text style={styles.searchPlaceholder}>Find clinics by name or location</Text>
        </View>
      </LinearGradient>

      {loading && clinics.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.loadingText}>Loading available clinics...</Text>
        </View>
      ) : (
        <FlatList
          data={clinics}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={renderClinicCard}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{clinics.length}</Text>
                  <Text style={styles.statLabel}>Clinics</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{selectedClinicId ? '1' : '0'}</Text>
                  <Text style={styles.statLabel}>Selected</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <FontAwesome5 name="hospital-alt" size={46} color={GRAY} />
              <Text style={styles.emptyTitle}>No Clinics Available</Text>
              <Text style={styles.emptyText}>We couldn't find any clinics at the moment.</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} activeOpacity={0.8}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} colors={[PURPLE, PINK]} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT,
  },

  headerContainer: {
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 10,
    shadowColor: DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
    marginTop: 25,
  },
  subheader: {
    fontSize: 13,
    color: GRAY,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    marginLeft: 10,
    fontSize: 14,
    color: GRAY,
  },

  listHeader: {
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 5,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: PURPLE,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 28,
    paddingTop: 6,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: DARK,
    fontSize: 15,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 28,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: GRAY,
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 22,
    backgroundColor: PURPLE,
    borderRadius: 999,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 14,
  },

  // Card
  card: {
    backgroundColor: WHITE,
    width: '48%',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: PINK,
    shadowColor: PINK,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },

  cardImageContainer: {
    position: 'relative',
    backgroundColor: '#f5f6f8',
  },
  cardImage: {
    width: '100%',
    height: 110,
    backgroundColor: '#f2f2f2',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2F5',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: PURPLE,
    width: 34,
    height: 34,
    borderRadius: 34 / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },

  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    marginBottom: 6,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 12,
    color: GRAY,
    marginLeft: 6,
    flex: 1,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 12,
    color: GRAY,
    marginLeft: 6,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  openBadge: {
    backgroundColor: 'rgba(39,174,96,0.12)',
  },
  closedBadge: {
    backgroundColor: 'rgba(231,76,60,0.08)',
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  openText: {
    color: OPEN_GREEN,
  },
  closedText: {
    color: CLOSED_RED,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
    marginRight: 6,
  },
});
