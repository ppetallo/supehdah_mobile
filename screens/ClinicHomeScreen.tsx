import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, ScrollView, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../src/api';

const PINK = '#FFC1CC';
const PURPLE = '#B39DDB';
const WHITE = '#FFFFFF';
const DARK = '#333';
const LIGHT = '#F8F6FF';

type Homepage = {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_image?: string | null; // path or url
  about_text?: string | null;
  announcement_title?: string | null;
  announcement_body?: string | null;
  announcement_image?: string | null; // path or url
};

type Service = {
  id: number;
  name: string;
  description?: string | null;
  price?: number | string | null;
  image_path?: string | null;
  image_url?: string | null;
  is_active?: boolean;
};

export default function ClinicHomeScreen() {
  const [clinicId, setClinicId] = React.useState<number | null>(null);
  const [clinicName, setClinicName] = React.useState<string>('Clinic');
  const [homepage, setHomepage] = React.useState<Homepage | null>(null);
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  // Base URL (without /api suffix)
  const hostBase = React.useMemo(() => {
    const base = API.defaults.baseURL || '';
    return base.replace(/\/$/, '').replace(/\/(api)?$/, '');
  }, []);

  const toAbsoluteUrl = (maybePath?: string | null): string | undefined => {
    if (!maybePath) return undefined;
    if (/^https?:\/\//i.test(maybePath)) return maybePath;
    const path = maybePath.startsWith('/') ? maybePath : `/storage/${maybePath}`;
    return `${hostBase}${path}`;
  };

  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('selectedClinic');
        const parsed = stored ? JSON.parse(stored) : null;
        setClinicId(parsed?.id ?? null);
        setClinicName(parsed?.clinic_name || 'Clinic');
      } catch {}
    })();
  }, []);

  const fetchHomepage = React.useCallback(async (id: number) => {
    try {
      if (!refreshing) setLoading(true);
      // Expecting backend endpoint to return { homepage: {...}, services: [...] }
      const res = await API.get(`/clinics/${id}/homepage`);
      const data = res.data || {};
      setHomepage(data.homepage || data);
      setServices(Array.isArray(data.services) ? data.services : (data.services?.data ?? []));
    } catch (e) {
      // keep UI calm
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  React.useEffect(() => {
    if (clinicId != null) fetchHomepage(clinicId);
  }, [clinicId, fetchHomepage]);

  const onRefresh = React.useCallback(() => {
    if (clinicId == null) return;
    setRefreshing(true);
    fetchHomepage(clinicId);
  }, [clinicId, fetchHomepage]);

  const heroUri = toAbsoluteUrl(homepage?.hero_image);
  const annImageUri = toAbsoluteUrl(homepage?.announcement_image);

  const renderService = ({ item }: { item: Service }) => {
    const uri = toAbsoluteUrl(item.image_url) || toAbsoluteUrl(item.image_path);
    return (
      <View style={styles.serviceCard}>
        {uri ? (
          <Image source={{ uri }} style={styles.serviceImage} resizeMode="cover" />
        ) : (
          <View style={[styles.serviceImage, styles.servicePlaceholder]} />
        )}
        <View style={styles.serviceBody}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
            {item.price != null && (
              <Text style={styles.servicePrice} numberOfLines={1}>
                ₱{Number(item.price).toFixed(2)}
              </Text>
            )}
          </View>
          {!!item.description && (
            <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
          )}
          {item.is_active === false && (
            <Text style={styles.serviceTag}>Inactive</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.bg} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PINK} />}>
      {/* Hero */}
      <View style={styles.heroWrap}>
        {heroUri ? (
          <ImageBackground source={{ uri: heroUri }} style={styles.hero} imageStyle={{ opacity: 0.85 }}>
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>{homepage?.hero_title || `Welcome to ${clinicName}`}</Text>
              {!!homepage?.hero_subtitle && (
                <Text style={styles.heroSubtitle}>{homepage?.hero_subtitle}</Text>
              )}
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.hero, styles.heroFallback]}>
            <Text style={styles.heroTitle}>{homepage?.hero_title || `Welcome to ${clinicName}`}</Text>
            {!!homepage?.hero_subtitle && (
              <Text style={styles.heroSubtitle}>{homepage?.hero_subtitle}</Text>
            )}
          </View>
        )}
      </View>

      {/* Loading state for first load */}
      {loading && !homepage && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PINK} />
          <Text style={styles.loadingText}>Loading clinic...</Text>
        </View>
      )}

      {/* Announcement */}
      {(homepage?.announcement_title || homepage?.announcement_body || annImageUri) && (
        <View style={styles.card}> 
          <View style={styles.annRow}>
            {annImageUri ? (
              <Image source={{ uri: annImageUri }} style={styles.annImage} resizeMode="cover" />
            ) : (
              <View style={[styles.annImage, styles.annPlaceholder]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{homepage?.announcement_title || 'Announcement'}</Text>
              <Text style={styles.annBody}>{homepage?.announcement_body || 'No announcements yet.'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* About */}
      <View style={styles.card}> 
        <Text style={styles.sectionTitle}>About {clinicName}</Text>
        <Text style={styles.aboutText}>
          {homepage?.about_text || 'Tell your clients about your clinic, your mission, and what makes you special.'}
        </Text>
      </View>

      {/* Services */}
      <View style={[styles.card, { paddingBottom: 6 }]}> 
        <Text style={styles.sectionTitle}>Services</Text>
        {services.length === 0 ? (
          <Text style={{ color: '#666' }}>No services yet.</Text>
        ) : (
          <FlatList
            data={services}
            keyExtractor={(it) => String(it.id)}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingTop: 8 }}
            renderItem={renderService}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Footer spacing */}
      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: LIGHT },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  loadingText: { marginTop: 8, color: DARK },

  heroWrap: { paddingHorizontal: 16, paddingTop: 16 , marginTop: 40},
  hero: { height: 180, borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end' },
  heroOverlay: { backgroundColor: 'rgba(0,0,0,0.35)', padding: 16 },
  heroFallback: { backgroundColor: PURPLE, padding: 16, justifyContent: 'flex-end' },
  heroTitle: { color: WHITE, fontSize: 22, fontWeight: 'bold' },
  heroSubtitle: { color: 'rgba(255,255,255,0.95)', marginTop: 4 },

  card: { backgroundColor: WHITE, marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 14, shadowColor: '#B39DDB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  sectionTitle: { color: PURPLE, fontWeight: 'bold', fontSize: 16, marginBottom: 6 },

  annRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  annImage: { width: 76, height: 76, borderRadius: 12, backgroundColor: '#f2f2f2', marginRight: 10 },
  annPlaceholder: { backgroundColor: '#f6e7f0' },
  annBody: { color: DARK, marginTop: 2 },

  aboutText: { color: DARK, lineHeight: 20 },

  serviceCard: { backgroundColor: WHITE, borderRadius: 14, overflow: 'hidden', marginBottom: 12, width: '48%', elevation: 2 },
  serviceImage: { width: '100%', height: 90, backgroundColor: '#f2f2f2' },
  servicePlaceholder: { backgroundColor: '#f6f6f6' },
  serviceBody: { padding: 10 },
  serviceName: { color: DARK, fontWeight: 'bold', flex: 1, marginRight: 6 },
  servicePrice: { color: '#666', fontSize: 12 },
  serviceDesc: { color: '#666', fontSize: 12, marginTop: 4 },
  serviceTag: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#f1f1f1', color: '#666', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
}); 