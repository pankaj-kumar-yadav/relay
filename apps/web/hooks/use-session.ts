'use client';

import { queryKeys } from '@/lib/query-keys';
import { getSessionApi, loginApi, logoutApi, registerApi } from '@/services/auth.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: getSessionApi,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.session, user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerApi,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.session, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      queryClient.clear();
    },
  });
}
