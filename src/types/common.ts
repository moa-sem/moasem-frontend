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

export type ReportStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export type AiAnalysisStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

// 공통 API 응답 포맷 - 백엔드 global/response/ApiResponse.kt 와 1:1로 맞춘다.
// 값이 없는 필드는 응답에서 생략되므로 선택 필드로 둔다.
export interface ApiResponse<T> {
  success: boolean;
  /** 성공은 'OK', 실패는 백엔드 ErrorCode의 enum 이름 (예: 'NOT_GROUP_MEMBER') */
  code: string;
  message: string;
  data?: T;
  errors?: FieldError[];
  timestamp: string;
}

/** @Valid 검증 실패 시 어느 필드가 왜 거부됐는지. 폼 에러 표시에 사용한다. */
export interface FieldError {
  field: string;
  value: string | null;
  reason: string;
}

/**
 * 인터셉터가 정규화해서 던지는 에러.
 *
 * axios 원본 에러 대신 이 형태로 통일해, 화면에서는 code로만 분기하면 되도록 한다.
 */
export interface ApiError {
  /** 백엔드 ErrorCode 이름. 네트워크 오류 등 응답이 없으면 NETWORK_ERROR. */
  code: string;
  message: string;
  status?: number;
  errors?: FieldError[];
}
