import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryStorage = new Map<string, string>();

const webStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return memoryStorage.get(key) ?? null;
    }
    return window.localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined' || !window.localStorage) {
      memoryStorage.set(key, value);
      return;
    }
    window.localStorage.setItem(key, value);
  },
  deleteItem(key: string) {
    if (typeof window === 'undefined' || !window.localStorage) {
      memoryStorage.delete(key);
      return;
    }
    window.localStorage.removeItem(key);
  },
};

export const storage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      return webStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      webStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string) {
    if (Platform.OS === 'web') {
      webStorage.deleteItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
