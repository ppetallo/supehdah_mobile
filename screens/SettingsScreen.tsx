import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../src/api';

const PINK = '#FFC1CC';
const PURPLE = '#B39DDB';
const WHITE = '#FFFFFF';
const DARK = '#333';
const LIGHT = '#F8F6FF';

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [loadingUser, setLoadingUser] = React.useState<boolean>(false);

  // Manage Account states
  const [isEditModalVisible, setIsEditModalVisible] = React.useState<boolean>(false);
  const [nameInput, setNameInput] = React.useState<string>('');
  const [emailInput, setEmailInput] = React.useState<string>('');
  const [passwordInput, setPasswordInput] = React.useState<string>('');
  const [passwordConfirmInput, setPasswordConfirmInput] = React.useState<string>('');
  const [savingProfile, setSavingProfile] = React.useState<boolean>(false);

  React.useEffect(() => {
    let isMounted = true;
    const fetchMe = async () => {
      try {
        setLoadingUser(true);
        const res = await API.get('/me');
        if (isMounted) {
          setUserName(res.data?.name ?? null);
          setUserEmail(res.data?.email ?? null);
          setNameInput(res.data?.name ?? '');
          setEmailInput(res.data?.email ?? '');
        }
      } catch (e) {
        // silently ignore
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    };
    fetchMe();
    return () => { isMounted = false; };
  }, []);

  const openEditModal = () => {
    setNameInput(userName ?? '');
    setEmailInput(userEmail ?? '');
    setPasswordInput('');
    setPasswordConfirmInput('');
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!nameInput.trim()) return Alert.alert('Validation', 'Name is required');
      if (!emailInput.trim()) return Alert.alert('Validation', 'Email is required');
      if (passwordInput && passwordInput !== passwordConfirmInput) return Alert.alert('Validation', 'Passwords do not match');

      setSavingProfile(true);
      const payload: Record<string, string> = { name: nameInput.trim(), email: emailInput.trim() };
      if (passwordInput) {
        payload.password = passwordInput;
        payload.password_confirmation = passwordConfirmInput;
      }

      const res = await API.put('/me', payload);
      setUserName(res.data?.name ?? nameInput);
      setUserEmail(res.data?.email ?? emailInput);
      Alert.alert('Success', 'Profile updated');
      setIsEditModalVisible(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to update profile';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.bg}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color={WHITE} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>
              {userName || (loadingUser ? 'Loading...' : 'User')}
            </Text>
            <Text style={styles.headerEmail} numberOfLines={1}>
              {userEmail || ' '}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Manage Account Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={26} color={PURPLE} />
            <Text style={styles.cardTitle}>Manage Account</Text>
          </View>
          <TouchableOpacity style={styles.cardRow} onPress={openEditModal}>
            <Ionicons name="create-outline" size={20} color={PINK} style={styles.icon} />
            <Text style={styles.cardText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Appointment History Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="history" size={26} color={PURPLE} />
            <Text style={styles.cardTitle}>Appointment History</Text>
          </View>
          <TouchableOpacity style={styles.cardRow}>
            <Ionicons name="calendar-outline" size={20} color={PINK} style={styles.icon} />
            <Text style={styles.cardText}>View All Appointments</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Settings Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications-outline" size={26} color={PURPLE} />
            <Text style={styles.cardTitle}>Notifications</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="notifications" size={20} color={PINK} style={styles.icon} />
            <Text style={styles.cardText}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ccc', true: PINK }}
              thumbColor={notificationsEnabled ? PURPLE : '#eee'}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={WHITE} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              value={nameInput}
              onChangeText={setNameInput}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              value={emailInput}
              onChangeText={setEmailInput}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="New Password (optional)"
              value={passwordInput}
              onChangeText={setPasswordInput}
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              value={passwordConfirmInput}
              onChangeText={setPasswordConfirmInput}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsEditModalVisible(false)} disabled={savingProfile}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color={WHITE} /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: LIGHT },
  profileHeader: { width: '100%', backgroundColor: PURPLE, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 25, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { color: WHITE, fontSize: 30, fontWeight: 'bold', marginBottom: 17, marginLeft: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  headerName: { color: WHITE, fontSize: 25, fontWeight: 'bold' },
  headerEmail: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 3 },
  content: { padding: 22, paddingBottom: 40 },
  card: { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 15, shadowColor: '#B39DDB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: PURPLE, marginLeft: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  cardText: { fontSize: 15, color: DARK, marginLeft: 10, flex: 1 },
  icon: { marginRight: 2 },
  logoutButton: { flexDirection: 'row', backgroundColor: PINK, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  logoutText: { color: WHITE, fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', backgroundColor: WHITE, borderRadius: 16, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: DARK, marginBottom: 12, textAlign: 'center' },
  modalInput: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee', fontSize: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  secondaryButton: { backgroundColor: '#eee', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, marginRight: 10 },
  secondaryButtonText: { color: DARK, fontWeight: 'bold' },
  saveButton: { backgroundColor: PINK, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  saveButtonText: { color: WHITE, fontWeight: 'bold' },
});
