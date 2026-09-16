import { http } from '../client';
import type { EventStatus } from '../../types/common';

export interface CreateEventRequest {
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  initialBudget: number;
}

export interface CreateBudgetAdditionRequest {
  amount: number;
  reason: string;
}

export interface CloseEventRequest {
  participantCount: number;
}

export interface EventListResponse {
  eventId: number;
  title: string;
  startAt: string;
  endAt: string;
  status: EventStatus;
  initialBudget: number;
  totalBudget: number;
  remainingBudget: number;
  participantCount: number | null;
}

export interface EventDetailResponse {
  eventId: number;
  groupId: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: EventStatus;
  initialBudget: number;
  additionalBudget: number;
  totalBudget: number;
  approvedSpending: number;
  remainingBudget: number;
}

export interface EventClosePreviewResponse {
  eventId: number;
  title: string;
  status: EventStatus;
  participantCount: number;
  pendingSpendingCount: number;
  initialBudget: number;
  additionalBudget: number;
  totalBudget: number;
  approvedSpending: number;
  remainingBudget: number;
}

export interface EventCloseResponse {
  eventId: number;
  status: EventStatus;
  participantCount: number;
  closedAt: string;
}

export const getEvents = (groupId: number, status?: EventStatus) =>
  http.get<EventListResponse[]>(`/api/v1/groups/${groupId}/events`, {
    params: status ? { status } : undefined,
  });

export const getEvent = (groupId: number, eventId: number) =>
  http.get<EventDetailResponse>(`/api/v1/groups/${groupId}/events/${eventId}`);

export const createEvent = (groupId: number, request: CreateEventRequest) =>
  http.post<EventDetailResponse>(`/api/v1/groups/${groupId}/events`, request);

export const addBudgetAddition = (
  groupId: number,
  eventId: number,
  request: CreateBudgetAdditionRequest,
) => http.post<void>(`/api/v1/groups/${groupId}/events/${eventId}/budget-additions`, request);

export const deleteEvent = (groupId: number, eventId: number) =>
  http.delete<void>(`/api/v1/groups/${groupId}/events/${eventId}`);

export const previewEventClose = (
  groupId: number,
  eventId: number,
  request: CloseEventRequest,
) => http.post<EventClosePreviewResponse>(
  `/api/v1/groups/${groupId}/events/${eventId}/close-preview`,
  request,
);

export const closeEvent = (
  groupId: number,
  eventId: number,
  request: CloseEventRequest,
) => http.post<EventCloseResponse>(`/api/v1/groups/${groupId}/events/${eventId}/close`, request);
