import { useMutation, useQuery } from 'react-query';
import { authAPI } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const navigate = useNavigate();
  const { setAuth, logout: storeLogout, user } = useAuthStore();

  const loginMutation = useMutation(authAPI.login, {
    onSuccess: (response) => {
      const { access, refresh, user } = response.data;
      setAuth(user, access, refresh);
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      navigate('/dashboard');
    },
  });

  const registerMutation = useMutation(authAPI.register, {
    onSuccess: () => {
      navigate('/login');
    },
  });

  const logoutMutation = useMutation(
    () => {
      const refreshToken = localStorage.getItem('refresh_token');
      return authAPI.logout(refreshToken);
    },
    {
      onSettled: () => {
        storeLogout();
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
      },
    }
  );

  return {
    user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isLoading,
    isRegisterLoading: registerMutation.isLoading,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
};