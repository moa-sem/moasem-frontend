import { http } from '../client';

export interface Group {
  groupId: number;
  groupName: string;
  groupMemberCount: number;
  isGroupHost: boolean;
  joinCode: string;
}

export const getGroupList = () => http.get<Group[]>('/api/v1/group');

export const createGroup = (groupName: string) =>
  http.post<{ groupHostId: number; groupId: number; groupName: string; joinCode: string }>('/api/v1/group', { groupName });

export const enterGroup = (joinCode: string) =>
  http.post<{ groupId: number; groupName: string }>('/api/v1/group/enter', { joinCode });
