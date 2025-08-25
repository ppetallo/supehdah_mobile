import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, StatusBar, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { API } from '../src/api';
import { LinearGradient } from 'expo-linear-gradient';

// Professional color scheme
const PRIMARY = '#4A6FA5';
const SECONDARY = '#FF6B6B';
const WHITE = '#FFFFFF';
const DARK = '#2D3142';
const LIGHT = '#F6F8FF';
const GRAY = '#9DA3B4';
const SHADOW = 'rgba(0, 0, 0, 0.1)';
const SCREEN_WIDTH = Dimensions.get('window').width;

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
      <TouchableOpacity 
        style={styles.tile} 
        activeOpacity={0.8} 
        onPress={() => uri && setPreviewUri(uri)}
      >
        {uri ? (
          <>
            <Image source={{ uri }} style={styles.image} resizeMode="cover" />
            <View style={styles.imageOverlay}>
              <MaterialIcons name="zoom-in" size={22} color={WHITE} style={styles.zoomIcon} />
            </View>
          </>
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <MaterialIcons name="image-not-supported" size={32} color={GRAY} />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={LIGHT} barStyle="dark-content" />
      
      {/* Header Section with Shadow */}
      <LinearGradient
        colors={[WHITE, LIGHT]}
        style={styles.headerContainer}
      >
        <Text style={styles.header}>Photo Gallery</Text>
        <Text style={styles.subheader}>View clinic facilities and services</Text>
      </LinearGradient>

      {/* Gallery Section */}
      {loading && items.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading gallery...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={renderTile}
          ListHeaderComponent={
            <View style={styles.galleryInfo}>
              <View style={styles.infoItem}>
                <MaterialIcons name="photo-library" size={18} color={PRIMARY} />
                <Text style={styles.infoText}>{items.length} Photos</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <MaterialIcons name="touch-app" size={18} color={PRIMARY} />
                <Text style={styles.infoText}>Tap to enlarge</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialIcons name="photo-album" size={60} color={GRAY} />
              <Text style={styles.emptyTitle}>No Photos Available</Text>
              <Text style={styles.emptyText}>The clinic hasn't uploaded any photos yet.</Text>
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={onRefresh}
                activeOpacity={0.7}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={PRIMARY}
              colors={[PRIMARY, SECONDARY]} 
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Enhanced Photo Viewer Modal */}
      <Modal 
        visible={!!previewUri} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setPreviewUri(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalClose} 
            onPress={() => setPreviewUri(null)}
            activeOpacity={0.7}
          >
            <View style={styles.closeButton}>
              <Ionicons name="close" size={22} color={WHITE} />
            </View>
          </TouchableOpacity>
          
          {previewUri && (
            <View style={styles.previewContainer}>
              <Image 
                source={{ uri: previewUri }} 
                style={styles.previewImage} 
                resizeMode="contain" 
              />
            </View>
          )}
        </View>
      </Modal>
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
    marginBottom: 10,
    shadowColor: DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: DARK,
    marginBottom: 5,
  },
  subheader: {
    fontSize: 14,
    color: GRAY,
    marginBottom: 5,
  },
  galleryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: WHITE,
    borderRadius: 8,
    marginHorizontal: 15,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  infoText: {
    marginLeft: 5,
    color: DARK,
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 18,
    width: 1,
    backgroundColor: GRAY,
    opacity: 0.5,
  },
  listContent: { 
    paddingHorizontal: 15, 
    paddingBottom: 30, 
    paddingTop: 10 
  },
  row: { 
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  loadingWrap: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    color: DARK,
    fontSize: 16,
  },
  emptyWrap: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: { 
    marginTop: 15, 
    fontSize: 20, 
    fontWeight: '600', 
    color: DARK 
  },
  emptyText: { 
    marginTop: 8, 
    fontSize: 15, 
    color: GRAY,
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshButton: {
    marginTop: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: PRIMARY,
    borderRadius: 50,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  refreshButtonText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 14,
  },

  tile: {
    width: (SCREEN_WIDTH - 40) / 2,  // 2 columns with spacing
    aspectRatio: 0.9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: WHITE,
    marginBottom: 10,
    shadowColor: DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  image: { 
    width: '100%', 
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderTopLeftRadius: 8,
  },
  zoomIcon: {
    opacity: 0.9,
  },
  placeholder: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F0F2F5' 
  },
  placeholderText: {
    marginTop: 6,
    color: GRAY,
    fontSize: 12,
  },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.85)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalClose: { 
    position: 'absolute', 
    top: 50, 
    right: 20, 
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: { 
    width: '92%', 
    height: '85%',
    borderRadius: 4,
  },
}); 