import { api } from '@/lib/api';
import type { CycleStatusValue } from '@/constants/cycle.constant';

export type ApiCycle = {
  id: string;
  name: string;
  status: CycleStatusValue;
  startsAt: string;
  endsAt: string;
  teamId: string;
  issueCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateCycleInput = {
  name: string;
  startsAt: string;
  endsAt: string;
  status?: CycleStatusValue;
};

export type PatchCycleInput = {
  name?: string;
  startsAt?: string;
  endsAt?: string;
  status?: CycleStatusValue;
};

export async function listCyclesApi(orgSlug: string, teamId: string) {
  return api<{ cycles: ApiCycle[] }>(`/orgs/${orgSlug}/teams/${teamId}/cycles`);
}

export async function createCycleApi(
  orgSlug: string,
  teamId: string,
  input: CreateCycleInput,
) {
  return api<{ cycle: ApiCycle }>(`/orgs/${orgSlug}/teams/${teamId}/cycles`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function patchCycleApi(
  orgSlug: string,
  teamId: string,
  cycleId: string,
  input: PatchCycleInput,
) {
  return api<{ cycle: ApiCycle }>(
    `/orgs/${orgSlug}/teams/${teamId}/cycles/${cycleId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}
