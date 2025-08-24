import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API } from '../src/api';

const PINK = '#FFC1CC';
const PURPLE = '#B39DDB';
const WHITE = '#FFFFFF';
const DARK = '#333';
const LIGHT = '#F8F6FF';

type GalleryItem = {
  id: number;
  image_path?: string | null;
  image_url?: string | null;
};

export default function ClinicGalleryScreen() {
  const [clinicId, setClinicId] = React.useState<number | null>(null);
  const [items, setItems] = React.useState<GalleryItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);

  // Base URL (without /api suffix)
  const hostBase = React.useMemo(() => {
    const base = API.defaults.baseURL || '';
    return base.replace(/\/$/, '').replace(/\/(api)?$/, '');
  }, []);

  // Convert Laravel paths into absolute URLs
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
      } catch {}
    })();
  }, []);

  const fetchGallery = React.useCallback(async (id: number) => {
    try {
      if (!refreshing) setLoading(true);
      const res = await API.get(`/clinics/${id}/gallery`);
      const data = res.data?.data ?? res.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      // optionally surface error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  React.useEffect(() => {
    if (clinicId != null) fetchGallery(clinicId);
  }, [clinicId, fetchGallery]);

  const onRefresh = React.useCallback(() => {
    if (clinicId == null) return;
    setRefreshing(true);
    fetchGallery(clinicId);
  }, [clinicId, fetchGallery]);

  const renderTile = ({ item }: { item: GalleryItem }) => {
    const uri = toAbsoluteUrl(item.image_url) || toAbsoluteUrl(item.image_path);

    return (
      <TouchableOpacity style={styles.tile} activeOpacity={0.9} onPress={() => uri && setPreviewUri(uri)}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="image-outline" size={32} color={PURPLE} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gallery</Text>

      {loading && items.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PINK} />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={renderTile}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="images-outline" size={48} color={PURPLE} />
              <Text style={styles.emptyTitle}>No photos yet</Text>
              <Text style={styles.emptyText}>Pull to refresh or check back later.</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PINK} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setPreviewUri(null)}>
            <Ionicons name="close" size={26} color={WHITE} />
          </TouchableOpacity>
          {previewUri && (
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT },
  header: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 15, textAlign: 'center', color: DARK },
  listContent: { paddingHorizontal: 10, paddingBottom: 20, paddingTop: 6 },
  row: { justifyContent: 'space-between' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: DARK },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { marginTop: 10, fontSize: 18, fontWeight: 'bold', color: DARK },
  emptyText: { marginTop: 4, fontSize: 14, color: '#666' },

  tile: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
    marginBottom: 10,
    elevation: 2,
  },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f7' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.77)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 40, right: 20, padding: 8 },
  previewImage: { width: '92%', height: '80%' },
}); 