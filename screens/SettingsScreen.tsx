import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../src/api';

const PINK = '#FF6B8A';
const PURPLE = '#6C5CE7';
const WHITE = '#FFFFFF';
const DARK = '#2E2E36';
const LIGHT = '#F6F7FB';
const MUTED = '#7B7B8C';

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [firstName, setFirstName] = React.useState<string | null>(null);
  const [middleName, setMiddleName] = React.useState<string | null>(null);
  const [lastName, setLastName] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [userPhone, setUserPhone] = React.useState<string | null>(null);
  const [loadingUser, setLoadingUser] = React.useState<boolean>(false);
  
  // Helper function to format user name consistently
  const formatFullName = () => {
    if (!firstName && !lastName) return 'User';
    return `${firstName || ''} ${middleName ? `${middleName} ` : ''}${lastName || ''}`.trim();
  };

  // Manage Account states
  const [isEditModalVisible, setIsEditModalVisible] = React.useState<boolean>(false);
  const [firstNameInput, setFirstNameInput] = React.useState<string>('');
  const [middleNameInput, setMiddleNameInput] = React.useState<string>('');
  const [lastNameInput, setLastNameInput] = React.useState<string>('');
  const [emailInput, setEmailInput] = React.useState<string>('');
  const [phoneNumberInput, setPhoneNumberInput] = React.useState<string>('');
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
          const userData = res.data;
          console.log('User data received:', userData);
          
          // Set state values from API response
          setFirstName(userData?.first_name ?? null);
          setMiddleName(userData?.middle_name ?? null);
          setLastName(userData?.last_name ?? null);
          setUserEmail(userData?.email ?? null);
          setUserPhone(userData?.phone_number ?? null);
          
          // Set input field values
          setFirstNameInput(userData?.first_name ?? '');
          setMiddleNameInput(userData?.middle_name ?? '');
          setLastNameInput(userData?.last_name ?? '');
          setEmailInput(userData?.email ?? '');
          setPhoneNumberInput(userData?.phone_number ?? '');
          setMiddleNameInput(userData?.middle_name ?? '');
          setLastNameInput(userData?.last_name ?? '');
          setEmailInput(userData?.email ?? '');
          setPhoneNumberInput(userData?.phone_number ?? '');
        }
      } catch (e) {
        console.error('Error fetching user data:', e);
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    };
    fetchMe();
    return () => {
      isMounted = false;
    };
  }, []);

  const openEditModal = () => {
    setFirstNameInput(firstName ?? '');
    setMiddleNameInput(middleName ?? '');
    setLastNameInput(lastName ?? '');
    setEmailInput(userEmail ?? '');
    setPasswordInput('');
    setPasswordConfirmInput('');
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!firstNameInput.trim()) return Alert.alert('Validation', 'First name is required');
      if (!lastNameInput.trim()) return Alert.alert('Validation', 'Last name is required');
      if (!emailInput.trim()) return Alert.alert('Validation', 'Email is required');
      if (passwordInput && passwordInput !== passwordConfirmInput)
        return Alert.alert('Validation', 'Passwords do not match');

      setSavingProfile(true);
      const payload: Record<string, string> = { 
        first_name: firstNameInput.trim(), 
        middle_name: middleNameInput.trim(), 
        last_name: lastNameInput.trim(), 
        email: emailInput.trim(),
        phone_number: phoneNumberInput.trim()
      };
      
      if (passwordInput) {
        payload.password = passwordInput;
        payload.password_confirmation = passwordConfirmInput;
      }

      const res = await API.put('/me', payload);
      const userData = res.data.user || res.data;
      setFirstName(userData?.first_name ?? firstNameInput);
      setMiddleName(userData?.middle_name ?? middleNameInput);
      setLastName(userData?.last_name ?? lastNameInput);
      setUserEmail(userData?.email ?? emailInput);
      setUserPhone(userData?.phone_number ?? phoneNumberInput);
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
    <ScrollView style={styles.bg} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Profile Header */}
      <View style={styles.headerWrap}>
        <View style={styles.profileHeader}>
          <View style={styles.leftHeader}>
            <Text style={styles.headerTitle}>My Profile</Text>
            {loadingUser ? (
              <ActivityIndicator color={PURPLE} />
            ) : (
              <>
                <Text style={styles.headerName} numberOfLines={1}>
                  {formatFullName()}
                </Text>
                <Text style={styles.headerEmail} numberOfLines={1}>
                  {userEmail ?? '—'}
                </Text>
                {userPhone && (
                  <Text style={styles.headerPhone} numberOfLines={1}>
                    {userPhone}
                  </Text>
                )}
              </>
            )}
          </View>

          <View style={styles.avatarArea}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={36} color={WHITE} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Manage Account Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={20} color={PURPLE} />
            <Text style={styles.cardTitle}>Manage Account</Text>
          </View>

          <TouchableOpacity style={styles.cardRow} onPress={openEditModal} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="create-outline" size={18} color={MUTED} />
              <Text style={styles.cardText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={MUTED} />
          </TouchableOpacity>
        </View>

        {/* Appointment History Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="history" size={20} color={PURPLE} />
            <Text style={styles.cardTitle}>Appointment History</Text>
          </View>

          <TouchableOpacity style={styles.cardRow} onPress={() => navigation.navigate('ClinicTabs')} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="calendar-outline" size={18} color={MUTED} />
              <Text style={styles.cardText}>View All Appointments</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={MUTED} />
          </TouchableOpacity>
        </View>

        {/* Notification Settings Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications-outline" size={20} color={PURPLE} />
            <Text style={styles.cardTitle}>Notifications</Text>
          </View>

          <View style={[styles.cardRow, { paddingVertical: 14 }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications" size={18} color={MUTED} />
              <Text style={styles.cardText}>Enable Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e6e6e6', true: PINK }}
              thumbColor={notificationsEnabled ? WHITE : '#fff'}
            />
          </View>
        </View>

        {/* Danger / Logout */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={20} color={PURPLE} />
            <Text style={styles.cardTitle}>Account</Text>
          </View>

          <TouchableOpacity style={[styles.cardRow, styles.logoutRow]} onPress={handleLogout} activeOpacity={0.8}>
            <View style={styles.rowLeft}>
              <Ionicons name="log-out-outline" size={18} color={PINK} />
              <Text style={[styles.cardText, { color: PINK, fontWeight: '700' }]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent onRequestClose={() => setIsEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="First Name"
              value={firstNameInput}
              onChangeText={setFirstNameInput}
              autoCapitalize="words"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.inputLabel}>Middle Name (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Middle Name"
              value={middleNameInput}
              onChangeText={setMiddleNameInput}
              autoCapitalize="words"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Last Name"
              value={lastNameInput}
              onChangeText={setLastNameInput}
              autoCapitalize="words"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number"
              value={phoneNumberInput}
              onChangeText={setPhoneNumberInput}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              value={emailInput}
              onChangeText={setEmailInput}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>New Password (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              value={passwordInput}
              onChangeText={setPasswordInput}
              secureTextEntry
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm Password"
              value={passwordConfirmInput}
              onChangeText={setPasswordConfirmInput}
              secureTextEntry
              placeholderTextColor="#999"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => setIsEditModalVisible(false)}
                disabled={savingProfile}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color={WHITE} /> : <Text style={styles.saveBtnText}>Save</Text>}
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
  headerWrap: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 6,
    backgroundColor: LIGHT,
    marginTop: 25,
  },
  profileHeader: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  leftHeader: { flex: 1 },
  headerTitle: { color: MUTED, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  headerName: { color: DARK, fontSize: 18, fontWeight: '700' },
  headerEmail: { color: MUTED, fontSize: 13, marginTop: 4 },
  headerPhone: { color: MUTED, fontSize: 13, marginTop: 2 },
  avatarArea: { marginLeft: 12 },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: WHITE,
  },

  content: { paddingHorizontal: 22, paddingTop: 18 },

  card: {
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
    // subtle shadow matching HomeScreen
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: PURPLE, marginLeft: 10 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F2F6',
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardText: { fontSize: 15, color: DARK, marginLeft: 12 },
  logoutRow: { justifyContent: 'flex-start', borderTopWidth: 0, paddingVertical: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.36)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: WHITE, borderRadius: 14, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: DARK, marginBottom: 12, textAlign: 'center' },

  inputLabel: { fontSize: 12, color: MUTED, marginTop: 8, marginBottom: 6, marginLeft: 4 },
  modalInput: {
    backgroundColor: '#FAFAFB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  actionBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, minWidth: 100, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F2F2F3' },
  cancelBtnText: { color: DARK, fontWeight: '700' },
  saveBtn: { backgroundColor: PURPLE },
  saveBtnText: { color: WHITE, fontWeight: '700' },
});
