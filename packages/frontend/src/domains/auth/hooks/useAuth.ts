import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { loginApi, signupApi, logoutApi, getMeApi } from '../api/auth';

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: getMeApi,
    enabled: isAuthenticated,
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
    onSuccess: async (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      const user = await getMeApi();
      setAuth(
        { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId ?? null },
        data.accessToken,
      );
      navigate('/dashboard');
    },
  });
}

export function useSignup() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (params: { email: string; password: string; name: string; inviteCode?: string }) =>
      signupApi(params.email, params.password, params.name, params.inviteCode),
    onSuccess: () => {
      navigate('/login');
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
    onError: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
  });
}
