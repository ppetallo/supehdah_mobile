import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API } from '../src/api';
import axios from 'axios';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Load user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get('/user');
        setName(res.data.name);
        setEmail(res.data.email);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.log(error.response?.data || error.message);
        } else {
          console.log(error);
        }
      }
    };
    fetchUser();
  }, []);

  // Handle profile update
  const handleUpdate = async () => {
    try {
      await API.put('/profile', {
        name,
        email,
        password: password || undefined
      });

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Unable to update profile');
      if (axios.isAxiosError(error)) {
        console.log(error.response?.data || error.message);
      } else {
        console.log(error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text style={styles.label}>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />

      <Text style={styles.label}>Password (leave blank to keep current)</Text>
      <TextInput value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginTop: 5 },
  button: { backgroundColor: '#B39DDB', padding: 15, borderRadius: 8, marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});
