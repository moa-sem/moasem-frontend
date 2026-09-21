import { http } from '../client';
import type { EvidenceType, SpendingStatus, SpendingTag } from '../../types/common';

/**
 * 지출 API.
 *
 * 지출은 행사에 종속되므로 경로가 항상 `/events/{eventId}/spendings` 아래에 있다.
 * 현재 사용자는 토큰에서 나오므로 요청 본문이나 헤더로 사용자 ID를 보내지 않는다.
 *
 * 증빙 첨부는 3단계다. 파일이 우리 서버를 거치지 않고 저장소로 바로 올라간다.
 * 1. [issueEvidenceUploadUrl] 로 업로드 URL과 저장 키를 받는다
 * 2. [uploadEvidenceFile] 로 그 URL에 파일을 올린다
 * 3. 받은 저장 키를 [createSpending] 요청에 실어 보낸다
 */

export interface EvidenceUploadUrlRequest {
  /** image/jpeg 또는 image/png */
  mimeType: string;
  /** byte 단위. 서버가 용량 정책을 검사한다. */
  fileSize: number;
}

export interface EvidenceUploadUrlResponse {
  /** 이 URL로 PUT 요청해 파일을 올린다. 만료가 짧다. */
  uploadUrl: string;
  /** 업로드 후 지출 신청 요청에 그대로 실어 보낸다. */
  storageKey: string;
  expiresAt: string;
}

export interface EvidenceRequest {
  type: EvidenceType;
  storageKey: string;
  mimeType: string;
  fileSize: number | null;
}

export interface CreateSpendingRequest {
  amount: number;
  /** yyyy-MM-dd. 서버는 날짜만 보관하고 시각은 저장하지 않는다. */
  spentOn: string;
  reason: string;
  tag: SpendingTag;
  /** tag가 OTHER면 필수. 다른 태그면 null. */
  otherDetail: string | null;
  evidence: EvidenceRequest;
}

/** 수정은 일부 필드가 아니라 신청 내용 전체를 다시 보낸다. 증빙을 바꾸지 않으면 기존 저장 키를 그대로 넣는다. */
export type UpdateSpendingRequest = CreateSpendingRequest;

export interface RejectSpendingRequest {
  /** 신청자가 무엇을 고쳐야 하는지 알 수 있어야 한다. 서버가 빈 값을 거부한다. */
  reason: string;
}

export interface SpendingListResponse {
  spendingId: number;
  applicantUserId: number;
  /** 신청자 이름. 탈퇴한 사용자는 대체 표기가 들어온다. */
  applicantName: string;
  amount: number;
  spentOn: string;
  reason: string;
  tag: SpendingTag;
  /** 표시용 한글 라벨. 서버가 내려주므로 앱에서 매핑하지 않는다. */
  tagLabel: string;
  status: SpendingStatus;
  createdAt: string | null;
}

export interface SpendingDetailResponse {
  spendingId: number;
  eventId: number;
  applicantUserId: number;
  amount: number;
  spentOn: string;
  reason: string;
  tag: SpendingTag;
  tagLabel: string;
  otherDetail: string | null;
  evidenceType: EvidenceType;
  status: SpendingStatus;
  processedByUserId: number | null;
  rejectionReason: string | null;
  processedAt: string | null;
  createdAt: string | null;
}

export interface EvidenceDownloadUrlResponse {
  /** 발급된 조회 URL. 만료가 짧으니 받은 즉시 사용한다. */
  downloadUrl: string;
  expiresAt: string;
}

/** 스프링 PagedModel 응답 형태. */
export interface PagedResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface GetSpendingsParams {
  /** 없으면 상태를 가리지 않는다. */
  status?: SpendingStatus;
  page?: number;
  size?: number;
}

export const issueEvidenceUploadUrl = (eventId: number, request: EvidenceUploadUrlRequest) =>
  http.post<EvidenceUploadUrlResponse>(
    `/api/v1/events/${eventId}/spendings/evidence-upload-url`,
    request,
  );

export const createSpending = (eventId: number, request: CreateSpendingRequest) =>
  http.post<SpendingDetailResponse>(`/api/v1/events/${eventId}/spendings`, request);

export const updateSpending = (
  eventId: number,
  spendingId: number,
  request: UpdateSpendingRequest,
) => http.patch<SpendingDetailResponse>(
  `/api/v1/events/${eventId}/spendings/${spendingId}`,
  request,
);

/** 서버 기본 정렬은 신청 시각 내림차순이다. 최신 신청이 목록 위에 온다. */
export const getSpendings = (eventId: number, params: GetSpendingsParams = {}) =>
  http.get<PagedResponse<SpendingListResponse>>(`/api/v1/events/${eventId}/spendings`, {
    params,
  });

export const getSpending = (eventId: number, spendingId: number) =>
  http.get<SpendingDetailResponse>(`/api/v1/events/${eventId}/spendings/${spendingId}`);

/** 증빙 이미지는 URL을 발급받아 연다. 저장 키는 응답에 내려오지 않는다. */
export const getEvidenceDownloadUrl = (eventId: number, spendingId: number) =>
  http.get<EvidenceDownloadUrlResponse>(
    `/api/v1/events/${eventId}/spendings/${spendingId}/evidence`,
  );

export const approveSpending = (eventId: number, spendingId: number) =>
  http.patch<SpendingDetailResponse>(
    `/api/v1/events/${eventId}/spendings/${spendingId}/approval`,
  );

export const rejectSpending = (
  eventId: number,
  spendingId: number,
  request: RejectSpendingRequest,
) => http.patch<SpendingDetailResponse>(
  `/api/v1/events/${eventId}/spendings/${spendingId}/rejection`,
  request,
);
