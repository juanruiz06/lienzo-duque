import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getMyProfile, updateMyProfile } from '@/api/profiles';
import { queryKeys } from '@/api/queryKeys';
import type { ProfileInput } from '@/utils/validation';

export function useMyProfile() {
  return useQuery({ queryKey: queryKeys.profile.me, queryFn: getMyProfile });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['profile', 'update'],
    mutationFn: (input: ProfileInput) => updateMyProfile(input),
    onSuccess: (profile) => queryClient.setQueryData(queryKeys.profile.me, profile),
  });
}
