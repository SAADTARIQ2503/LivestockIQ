import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { QUERY_KEYS, SUCCESS_MESSAGES } from '@/utils/constants';

/**
 * Custom hook for authentication operations
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setAuth, logout: storeLogout } = useAuthStore();
  const { addNotification } = useNotificationStore();

  /**
   * Login mutation
   */
  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      const { access, refresh, user } = response.data;
      
      // Update auth store
      setAuth(user, access, refresh);
      
      // Show success message
      addNotification({
        type: 'success',
        title: 'Login Successful',
        message: `Welcome back, ${user.first_name}!`,
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     'Login failed. Please check your credentials.';
      
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message,
      });
    },
  });

  /**
   * Register mutation
   */
  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Registration Successful',
        message: SUCCESS_MESSAGES.REGISTER,
      });
      
      // Redirect to login
      navigate('/login');
    },
    onError: (error) => {
      // Handle validation errors
      const errors = error.response?.data;
      let message = 'Registration failed. Please try again.';
      
      if (errors) {
        // Extract first error message
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
          message = firstError[0];
        } else if (typeof firstError === 'string') {
          message = firstError;
        }
      }
      
      addNotification({
        type: 'error',
        title: 'Registration Failed',
        message,
      });
    },
  });

  /**
   * Logout mutation
   */
  const logoutMutation = useMutation({
    mutationFn: () => {
      const { refreshToken } = useAuthStore.getState();
      return authAPI.logout(refreshToken);
    },
    onSettled: () => {
      // Clear auth state regardless of API success
      storeLogout();
      
      // Clear all queries
      queryClient.clear();
      
      addNotification({
        type: 'success',
        title: 'Logged Out',
        message: SUCCESS_MESSAGES.LOGOUT,
      });
      
      // Redirect to login
      navigate('/login');
    },
  });

  /**
   * Get user profile query
   */
  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.auth.user,
    queryFn: authAPI.getProfile,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Update profile mutation
   */
  const updateProfileMutation = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: (response) => {
      const updatedUser = response.data.user;
      
      // Update auth store
      useAuthStore.getState().updateUser(updatedUser);
      
      // Invalidate profile query
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.user });
      
      addNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully.',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update profile.';
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message,
      });
    },
  });

  /**
   * Change password mutation
   */
  const changePasswordMutation = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been changed successfully.',
      });
    },
    onError: (error) => {
      const errors = error.response?.data;
      let message = 'Failed to change password.';
      
      if (errors) {
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
          message = firstError[0];
        } else if (typeof firstError === 'string') {
          message = firstError;
        }
      }
      
      addNotification({
        type: 'error',
        title: 'Password Change Failed',
        message,
      });
    },
  });

  return {
    // User data
    user,
    profile: profileQuery.data?.data,
    
    // Login
    login: loginMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    
    // Register
    register: registerMutation.mutate,
    isRegisterLoading: registerMutation.isPending,
    registerError: registerMutation.error,
    
    // Logout
    logout: logoutMutation.mutate,
    isLogoutLoading: logoutMutation.isPending,
    
    // Profile
    isProfileLoading: profileQuery.isLoading,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    
    // Password
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
  };
};
