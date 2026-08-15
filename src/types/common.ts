// 백엔드 domain/*/entity의 enum과 1:1로 맞춘다.
// 백엔드 값이 바뀌면 이 파일도 같이 갱신할 것.

export type GroupRole = 'OWNER' | 'MEMBER';

export type EventStatus = 'ACTIVE' | 'CLOSED';

export type SpendingStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SpendingTag =
  | 'MEAL'
  | 'ACCOMMODATION'
  | 'TRANSPORTATION'
  | 'VENUE'
  | 'SUPPLIES'
  | 'OTHER';

export const SPENDING_TAG_LABEL: Record<SpendingTag, string> = {
  MEAL: '#식비',
  ACCOMMODATION: '#숙박비',
  TRANSPORTATION: '#교통비',
  VENUE: '#대관비',
  SUPPLIES: '#물품비',
  OTHER: '#기타',
};

// 공통 API 응답 포맷 - 백엔드 global/response 스펙 확정 후 맞춰서 수정
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
