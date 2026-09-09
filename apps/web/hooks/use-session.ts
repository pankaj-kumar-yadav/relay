'use client';

import { queryKeys } from '@/lib/query-keys';
import {
  changePasswordApi,
  completeAvatarApi,
  createAvatarIntentApi,
  deleteAvatarApi,
  forgotPasswordApi,
  getSessionApi,
  loginApi,
  logoutApi,
  patchMeApi,
  putAttachmentBytesApi,
  registerApi,
  resetPasswordApi,
} from '@/services/auth.service';
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

export function usePatchMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchMeApi,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.session, user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orgs });
      void queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPasswordApi,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPasswordApi,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePasswordApi,
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const intent = await createAvatarIntentApi({
        contentType: file.type,
        byteSize: file.size,
        fileName: file.name,
      });
      await putAttachmentBytesApi(intent.uploadUrl, file);
      return completeAvatarApi(intent.attachment.id);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.session, data.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orgs });
      void queryClient.invalidateQueries({ queryKey: ['members'] });
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAvatarApi,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.session, data.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orgs });
      void queryClient.invalidateQueries({ queryKey: ['members'] });
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}
