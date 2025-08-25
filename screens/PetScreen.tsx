import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { API } from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

// Minimalist professional color palette
const PRIMARY = '#2563EB'; // Modern blue
const ACCENT = '#0EA5E9'; // Light blue accent
const WHITE = '#FFFFFF';
const DARK = '#111827'; // Near black for text
const LIGHT = '#F9FAFB'; // Very light background
const MUTED = '#94A3B8'; // Subtle gray for secondary text
const GRAY = '#E2E8F0'; // Border color
const SHADOW = 'rgba(0,0,0,0.05)'; // Subtle shadow

interface Pet {
  id: number;
  name: string;
  breed: string;
  age: number;
  birthday: string;
  last_vaccination_date?: string;
  vaccination_details?: string;
  notes?: string;
  image_url?: string;
}

interface VaccinationRecord {
  id: number;
  pet_id: number;
  vaccine_name: string;
  vaccination_date: string;
  next_due_date?: string;
  administered_by?: string;
  notes?: string;
}

export default function PetScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [vaccinationModalVisible, setVaccinationModalVisible] = useState<boolean>(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Form states
  const [petName, setPetName] = useState<string>('');
  const [petBreed, setPetBreed] = useState<string>('');
  const [petAge, setPetAge] = useState<string>('');
  const [petBirthday, setPetBirthday] = useState<Date>(new Date());
  const [petLastVaccination, setPetLastVaccination] = useState<Date | null>(null);
  const [petVaccinationDetails, setPetVaccinationDetails] = useState<string>('');
  const [petImage, setPetImage] = useState<string | null>(null);
  const [petNotes, setPetNotes] = useState<string>('');

  // Date picker states
  const [showBirthdayPicker, setShowBirthdayPicker] = useState<boolean>(false);
  const [showVaccinationPicker, setShowVaccinationPicker] = useState<boolean>(false);

  // Vaccination form states
  const [vaccineName, setVaccineName] = useState<string>('');
  const [vaccinationDate, setVaccinationDate] = useState<Date>(new Date());
  const [nextDueDate, setNextDueDate] = useState<Date | null>(null);
  const [administeredBy, setAdministeredBy] = useState<string>('');
  const [vaccinationNotes, setVaccinationNotes] = useState<string>('');
  const [showVacDatePicker, setShowVacDatePicker] = useState<boolean>(false);
  const [showNextDuePicker, setShowNextDuePicker] = useState<boolean>(false);

  useEffect(() => {
    fetchPets();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera roll permissions to upload pet photos');
      }
    }
  };

  const fetchPets = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      const response = await API.get('/pets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.status === 'success' || response.data?.data) {
        const result = response.data?.data ?? (response.data?.status === 'success' ? [] : response.data);
        setPets(Array.isArray(result) ? result : []);
      } else {
        setPets([]);
        Alert.alert('Error', 'Failed to load pets');
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      Alert.alert('Error', 'Failed to load pets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPets();
  }, []);

  const openAddModal = () => {
    setPetName('');
    setPetBreed('');
    setPetAge('');
    setPetBirthday(new Date());
    setPetLastVaccination(null);
    setPetVaccinationDetails('');
    setPetImage(null);
    setPetNotes('');
    setAddModalVisible(true);
  };

  const openEditModal = (pet: Pet) => {
    setSelectedPet(pet);
    setPetName(pet.name);
    setPetBreed(pet.breed);
    setPetAge(pet.age.toString());
    setPetBirthday(new Date(pet.birthday));
    setPetLastVaccination(pet.last_vaccination_date ? new Date(pet.last_vaccination_date) : null);
    setPetVaccinationDetails(pet.vaccination_details || '');
    setPetImage(pet.image_url || null);
    setPetNotes(pet.notes || '');
    setEditModalVisible(true);
  };

  const openVaccinationModal = (pet: Pet) => {
    setSelectedPet(pet);
    setVaccineName('');
    setVaccinationDate(new Date());
    setNextDueDate(null);
    setAdministeredBy('');
    setVaccinationNotes('');
    setVaccinationModalVisible(true);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPetImage(result.assets[0].uri);
    }
  };

  const handleAddPet = async () => {
    if (!petName || !petBreed || !petAge || !petBirthday) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      const formData = new FormData() as any;
      formData.append('name', petName);
      formData.append('breed', petBreed);
      formData.append('age', petAge);
      formData.append('birthday', petBirthday.toISOString().split('T')[0]);

      if (petLastVaccination) {
        formData.append('last_vaccination_date', petLastVaccination.toISOString().split('T')[0]);
      }

      if (petVaccinationDetails) {
        formData.append('vaccination_details', petVaccinationDetails);
      }

      if (petNotes) {
        formData.append('notes', petNotes);
      }

      if (petImage && !petImage.startsWith('http')) {
        const uriParts = petImage.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('image', {
          uri: petImage,
          name: `pet_image.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      const response = await API.post('/pets', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.status === 'success') {
        Alert.alert('Success', 'Pet added successfully');
        setAddModalVisible(false);
        fetchPets();
      } else {
        Alert.alert('Error', 'Failed to add pet');
      }
    } catch (error) {
      console.error('Error adding pet:', error);
      Alert.alert('Error', 'Failed to add pet');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePet = async () => {
    if (!petName || !petBreed || !petAge || !petBirthday) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (!selectedPet) {
      Alert.alert('Error', 'No pet selected');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      const formData = new FormData() as any;
      formData.append('name', petName);
      formData.append('breed', petBreed);
      formData.append('age', petAge);
      formData.append('birthday', petBirthday.toISOString().split('T')[0]);

      if (petLastVaccination) {
        formData.append('last_vaccination_date', petLastVaccination.toISOString().split('T')[0]);
      }

      if (petVaccinationDetails) {
        formData.append('vaccination_details', petVaccinationDetails);
      }

      if (petNotes) {
        formData.append('notes', petNotes);
      }

      if (petImage && !petImage.startsWith('http')) {
        const uriParts = petImage.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('image', {
          uri: petImage,
          name: `pet_image.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      const response = await API.post(`/pets/${selectedPet.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'X-HTTP-Method-Override': 'PUT',
        },
      });

      if (response.data?.status === 'success') {
        Alert.alert('Success', 'Pet updated successfully');
        setEditModalVisible(false);
        fetchPets();
      } else {
        Alert.alert('Error', 'Failed to update pet');
      }
    } catch (error) {
      console.error('Error updating pet:', error);
      Alert.alert('Error', 'Failed to update pet');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePet = async (pet: Pet) => {
    Alert.alert('Confirm Deletion', `Are you sure you want to delete ${pet.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            const response = await API.delete(`/pets/${pet.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.data?.status === 'success') {
              Alert.alert('Success', 'Pet deleted successfully');
              fetchPets();
            } else {
              Alert.alert('Error', 'Failed to delete pet');
            }
          } catch (error) {
            console.error('Error deleting pet:', error);
            Alert.alert('Error', 'Failed to delete pet');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleAddVaccination = async () => {
    if (!vaccineName || !vaccinationDate || !selectedPet) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      const data: {
        vaccine_name: string;
        vaccination_date: string;
        next_due_date?: string;
        administered_by: string | null;
        notes: string | null;
      } = {
        vaccine_name: vaccineName,
        vaccination_date: vaccinationDate.toISOString().split('T')[0],
        administered_by: administeredBy || null,
        notes: vaccinationNotes || null,
      };

      if (nextDueDate) {
        data.next_due_date = nextDueDate.toISOString().split('T')[0];
      }

      const response = await API.post(`/pets/${selectedPet.id}/vaccinations`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.status === 'success') {
        Alert.alert('Success', 'Vaccination record added successfully');
        setVaccinationModalVisible(false);
        fetchPets();
      } else {
        Alert.alert('Error', 'Failed to add vaccination record');
      }
    } catch (error) {
      console.error('Error adding vaccination:', error);
      Alert.alert('Error', 'Failed to add vaccination record');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Not recorded';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderPetCard = ({ item }: { item: Pet }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <Image
          source={item.image_url ? { uri: item.image_url } : require('../assets/default-pet.png')}
          style={styles.petImage}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.petName}>{item.name}</Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                Alert.alert('Pet Options', `What would you like to do with ${item.name}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Edit', onPress: () => openEditModal(item) },
                  { text: 'Delete', style: 'destructive', onPress: () => handleDeletePet(item) },
                ]);
              }}
              accessibilityLabel={`Options for ${item.name}`}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={MUTED} />
            </TouchableOpacity>
          </View>

          <View style={styles.petInfo}>
            <Text style={styles.infoLabel}>Breed</Text>
            <Text style={styles.infoValue}>{item.breed}</Text>
          </View>

          <View style={styles.petInfo}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{item.age} yrs</Text>
          </View>

          <View style={styles.petInfo}>
            <Text style={styles.infoLabel}>Birthday</Text>
            <Text style={styles.infoValue}>{formatDate(item.birthday)}</Text>
          </View>

          <View style={styles.petInfo}>
            <Text style={styles.infoLabel}>Last Vac.</Text>
            <Text style={styles.infoValue}>{formatDate(item.last_vaccination_date)}</Text>
          </View>

          <TouchableOpacity style={styles.vaccinationButton} onPress={() => openVaccinationModal(item)} activeOpacity={0.75}>
            <Ionicons name="medical-outline" size={14} color={PRIMARY} />
            <Text style={styles.vaccinationButtonText}>Add Vaccination</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Date picker handlers
  const onChangeBirthday = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || petBirthday;
    setShowBirthdayPicker(Platform.OS === 'ios');
    setPetBirthday(currentDate);
  };

  const onChangeVaccinationDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || petLastVaccination || new Date();
    setShowVaccinationPicker(Platform.OS === 'ios');
    setPetLastVaccination(currentDate);
  };

  const onChangeVacDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || vaccinationDate;
    setShowVacDatePicker(Platform.OS === 'ios');
    setVaccinationDate(currentDate);
  };

  const onChangeNextDueDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || nextDueDate || new Date();
    setShowNextDuePicker(Platform.OS === 'ios');
    setNextDueDate(currentDate);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Pets</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal} activeOpacity={0.8} accessibilityLabel="Add pet">
          <Ionicons name="add-outline" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : pets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <FontAwesome5 name="paw" size={28} color={WHITE} />
          </View>
          <Text style={styles.emptyText}>No pets added yet</Text>
          <Text style={styles.emptySubText}>Add your pet to manage health records and appointments.</Text>
          <TouchableOpacity style={styles.emptyAddButton} onPress={openAddModal} activeOpacity={0.8}>
            <Text style={styles.emptyAddButtonText}>Add Pet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pets}
          renderItem={renderPetCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
        />
      )}

      {/* Add Pet Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Pet</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={20} color={DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {petImage ? (
                  <Image source={{ uri: petImage }} style={styles.pickedImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="camera" size={34} color={GRAY} />
                    <Text style={styles.placeholderText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Pet Name *</Text>
                <TextInput style={styles.input} value={petName} onChangeText={setPetName} placeholder="Enter pet name" placeholderTextColor={MUTED} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Breed *</Text>
                <TextInput style={styles.input} value={petBreed} onChangeText={setPetBreed} placeholder="Enter breed" placeholderTextColor={MUTED} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Age (yrs) *</Text>
                <TextInput style={styles.input} value={petAge} onChangeText={setPetAge} placeholder="Enter age" keyboardType="decimal-pad" placeholderTextColor={MUTED} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Birthday *</Text>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowBirthdayPicker(true)} activeOpacity={0.8}>
                  <Text style={styles.dateText}>{petBirthday.toLocaleDateString()}</Text>
                  <Ionicons name="calendar" size={16} color={PRIMARY} />
                </TouchableOpacity>
                {showBirthdayPicker && <DateTimePicker value={petBirthday} mode="date" display="default" onChange={onChangeBirthday} maximumDate={new Date()} />}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Vaccination Date</Text>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowVaccinationPicker(true)} activeOpacity={0.8}>
                  <Text style={styles.dateText}>{petLastVaccination ? petLastVaccination.toLocaleDateString() : 'Not vaccinated'}</Text>
                  <Ionicons name="calendar" size={16} color={PRIMARY} />
                </TouchableOpacity>
                {showVaccinationPicker && (
                  <DateTimePicker value={petLastVaccination || new Date()} mode="date" display="default" onChange={onChangeVaccinationDate} maximumDate={new Date()} />
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Vaccination Details</Text>
                <TextInput style={[styles.input, styles.textArea]} value={petVaccinationDetails} onChangeText={setPetVaccinationDetails} placeholder="Details" multiline numberOfLines={4} placeholderTextColor={MUTED} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput style={[styles.input, styles.textArea]} value={petNotes} onChangeText={setPetNotes} placeholder="Notes" multiline numberOfLines={4} placeholderTextColor={MUTED} />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setAddModalVisible(false)} activeOpacity={0.8}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddPet} activeOpacity={0.8}>
                  <Text style={styles.saveButtonText}>Add Pet</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Pet Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {selectedPet?.name}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color={DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {petImage ? (
                  <Image source={{ uri: petImage }} style={styles.pickedImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="camera" size={34} color={GRAY} />
                    <Text style={styles.placeholderText}>Change Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Pet Name *</Text>
                <TextInput style={styles.input} value={petName} onChangeText={setPetName} placeholder="Enter pet name" placeholderTextColor={MUTED} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Breed *</Text>
                <TextInput style={styles.input} value={petBreed} onChangeText={setPetBreed} placeholder="Enter breed" placeholderTextColor={MUTED} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Age (yrs) *</Text>
                <TextInput style={styles.input} value={petAge} onChangeText={setPetAge} placeholder="Enter age" keyboardType="decimal-pad" placeholderTextColor={MUTED} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Birthday *</Text>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowBirthdayPicker(true)} activeOpacity={0.8}>
                  <Text style={styles.dateText}>{petBirthday.toLocaleDateString()}</Text>
                  <Ionicons name="calendar" size={16} color={PRIMARY} />
                </TouchableOpacity>
                {showBirthdayPicker && <DateTimePicker value={petBirthday} mode="date" display="default" onChange={onChangeBirthday} maximumDate={new Date()} />}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Vaccination Date</Text>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowVaccinationPicker(true)} activeOpacity={0.8}>
                  <Text style={styles.dateText}>{petLastVaccination ? petLastVaccination.toLocaleDateString() : 'Not vaccinated'}</Text>
                  <Ionicons name="calendar" size={16} color={PRIMARY} />
                </TouchableOpacity>
                {showVaccinationPicker && <DateTimePicker value={petLastVaccination || new Date()} mode="date" display="default" onChange={onChangeVaccinationDate} maximumDate={new Date()} />}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Vaccination Details</Text>
                <TextInput style={[styles.input, styles.textArea]} value={petVaccinationDetails} onChangeText={setPetVaccinationDetails} placeholder="Details" multiline numberOfLines={4} placeholderTextColor={MUTED} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput style={[styles.input, styles.textArea]} value={petNotes} onChangeText={setPetNotes} placeholder="Notes" multiline numberOfLines={4} placeholderTextColor={MUTED} />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)} activeOpacity={0.8}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleUpdatePet} activeOpacity={0.8}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Vaccination Modal */}
      <Modal visible={vaccinationModalVisible} animationType="slide" transparent onRequestClose={() => setVaccinationModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Vaccination for {selectedPet?.name}</Text>
              <TouchableOpacity onPress={() => setVaccinationModalVisible(false)}>
                <Ionicons name="close" size={20} color={DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Vaccine Name *</Text>
                <TextInput style={styles.input} value={vaccineName} onChangeText={setVaccineName} placeholder="Vaccine name" placeholderTextColor={MUTED} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Vaccination Date *</Text>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowVacDatePicker(true)} activeOpacity={0.8}>
                  <Text style={styles.dateText}>{vaccinationDate.toLocaleDateString()}</Text>
                  <Ionicons name="calendar" size={16} color={PRIMARY} />
                </TouchableOpacity>
                {showVacDatePicker && <DateTimePicker value={vaccinationDate} mode="date" display="default" onChange={onChangeVacDate} maximumDate={new Date()} />}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Next Due Date</Text>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowNextDuePicker(true)} activeOpacity={0.8}>
                  <Text style={styles.dateText}>{nextDueDate ? nextDueDate.toLocaleDateString() : 'Not scheduled'}</Text>
                  <Ionicons name="calendar" size={16} color={PRIMARY} />
                </TouchableOpacity>
                {showNextDuePicker && <DateTimePicker value={nextDueDate || new Date()} mode="date" display="default" onChange={onChangeNextDueDate} minimumDate={new Date()} />}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Administered By</Text>
                <TextInput style={styles.input} value={administeredBy} onChangeText={setAdministeredBy} placeholder="Vet/Clinic" placeholderTextColor={MUTED} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput style={[styles.input, styles.textArea]} value={vaccinationNotes} onChangeText={setVaccinationNotes} placeholder="Notes" multiline numberOfLines={4} placeholderTextColor={MUTED} />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setVaccinationModalVisible(false)} activeOpacity={0.8}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddVaccination} activeOpacity={0.8}>
                  <Text style={styles.saveButtonText}>Add Record</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 22,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: GRAY,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 25,
  },
  headerTitle: {
    color: DARK,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(37, 99, 235, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: 'rgba(37, 99, 235, 0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  emptySubText: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    maxWidth: '80%',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyAddButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: 'rgba(37, 99, 235, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyAddButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  cardContainer: {
    marginBottom: 18,
    borderRadius: 16,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginHorizontal: 2,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  petImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F4F8',
  },
  cardContent: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    letterSpacing: -0.2,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  petInfo: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
    width: 86,
  },
  infoValue: {
    fontSize: 15,
    color: DARK,
    flex: 1,
    fontWeight: '500',
  },
  vaccinationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  vaccinationButtonText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: -0.2,
  },

  // Modals
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: GRAY,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
    letterSpacing: -0.2,
  },

  imagePicker: {
    alignSelf: 'center',
    marginVertical: 22,
  },
  pickedImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GRAY,
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 14,
    color: MUTED,
    fontWeight: '500',
  },

  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  input: {
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: DARK,
    borderWidth: 1,
    borderColor: GRAY,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  dateInput: {
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: GRAY,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  dateText: {
    color: DARK,
    fontSize: 15,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: GRAY,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: WHITE,
    shadowColor: SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  cancelButtonText: {
    color: DARK,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  saveButton: {
    flex: 1,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: 'rgba(43, 98, 231, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
