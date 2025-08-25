// screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { API } from '../src/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { RootStackParamList } from '../App';

const PINK = '#FFC1CC';
const DARK = '#333';

export default function RegisterScreen(): React.ReactElement {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleRegister = async (): Promise<void> => {
    if (!name || !email || !password || !passwordConfirmation) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (password !== passwordConfirmation) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const res = await API.post('/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation
      });

      // After successful registration, automatically login the user
      const loginRes = await API.post('/login', { email, password });
      
      // Get token from response
      const token = loginRes.data?.token ?? loginRes.data?.access_token ?? loginRes.data?.data?.token;
      if (!token) throw new Error('No token returned from server');

      await AsyncStorage.setItem('token', token);

      // Set authorization header for future requests
      API.defaults.headers = API.defaults.headers || {};
      API.defaults.headers.common = API.defaults.headers.common || {};
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      Alert.alert('Success', 'Registration successful!');

      // Navigate to the personal dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: 'PersonalTabs' }],
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data;
        let errorMessage = 'Registration failed';

        if (errorData?.errors) {
          // Laravel validation errors
          const errors = Object.values(errorData.errors).flat();
          errorMessage = errors.join('\n');
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }

        Alert.alert('Error', errorMessage);
      } else if (err instanceof Error) {
        Alert.alert('Error', err.message);
      } else {
        Alert.alert('Error', 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ImageBackground source={require('../assets/pic4.jpg')} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          style={{ width: '100%' }}
        >
          <View style={styles.formContainer}>
            <View style={styles.avatarPlaceholder}>
              <Image source={require('../assets/purrfectpaw_logo.png')} style={styles.avatarImage} />
            </View>
            <Text style={styles.title}>Create Account</Text>

            {/* Name Input */}
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

            {/* Email Input */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                secureTextEntry={!showPasswordConfirmation}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPasswordConfirmation((v) => !v)}>
                <Ionicons name={showPasswordConfirmation ? 'eye' : 'eye-off'} size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryButtonText}>Register</Text>}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Already registered? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>Login here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={PINK} />
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PINK,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: DARK, 
    marginBottom: 20 
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingRight: 50,
    paddingVertical: 14,
    marginBottom: 10,
    fontSize: 16,
  },
  inputWrapper: { 
    width: '100%', 
    position: 'relative', 
    marginBottom: 16 
  },
  eyeIcon: { 
    position: 'absolute', 
    right: 20, 
    top: '50%', 
    transform: [{ translateY: -12 }], 
    zIndex: 1 
  },
  primaryButton: { 
    backgroundColor: PINK, 
    width: '100%', 
    borderRadius: 30, 
    paddingVertical: 14, 
    alignItems: 'center', 
    marginBottom: 12 
  },
  primaryButtonText: { 
    color: '#000', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  loginLinkContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  loginText: {
    color: DARK,
  },
  loginLink: {
    color: PINK,
    fontWeight: 'bold',
  },
  loadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarPlaceholder: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: PINK, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  avatarImage: { 
    width: 85, 
    height: 85, 
    borderRadius: 30 
  },
});
