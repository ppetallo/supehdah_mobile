import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API = axios.create({
  baseURL: 'http://192.168.1.7:8000/api', // Change to your Laravel API URL
  headers: { 'Content-Type': 'application/json' }
});

// Automatically attach token to every request
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
