import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify(response.data));
      set({ user: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('user', JSON.stringify(response.data));
      set({ user: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Registration failed', isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },

  updateBalance: (newBalance) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, balance: newBalance };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  updateProfileDetails: async (name, email) => {
    set({ isLoading: true, error: null });
    const token = get().user?.token;
    try {
      const response = await api.put('/users/profile', { name, email });
      // Keep token from original state
      const updatedUser = { ...response.data, token };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update profile details', isLoading: false });
      return false;
    }
  },

  uploadProfileImage: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(
        '/users/profile/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const currentUser = get().user;
      const updatedUser = { ...currentUser, profileImage: response.data.profileImage };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to upload image', isLoading: false });
      return false;
    }
  },
}));

export default useAuthStore;

