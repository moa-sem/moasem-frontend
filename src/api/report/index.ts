import { http } from '../client';
import type { AiAnalysisStatus, ReportStatus } from '../../types/common';

/**
 * 결산 보고서 API.
 *
 * 보고서는 행사 마감 시 서버에서 자동으로 만들어진다. 생성에 수 초가 걸리고 백그라운드에서
 * 돌기 때문에, 마감 직후에는 아직 보고서가 없을 수 있다.
 */

export interface ReportStatusResponse {
  eventId: number;
  status: ReportStatus;
  aiStatus: AiAnalysisStatus;
  /** true여야 PDF·CSV를 받을 수 있다. */
  downloadable: boolean;
  /** 생성에 실패했을 때만 true. 재생성 버튼 노출 여부로 쓴다. */
  retryable: boolean;
  failureReason: string | null;
  generatedAt: string | null;
}

export interface ReportEventSummary {
  title: string;
  startAt: string;
  endAt: string;
  groupName: string;
  participantCount: number | null;
}

export interface ReportBudgetAddition {
  amount: number;
  reason: string;
  addedBy: string | null;
  addedAt: string;
}

export interface ReportBudgetSummary {
  initialBudget: number;
  /** 최초 예산 + 추가 예산 */
  totalBudget: number;
  totalSpent: number;
  /** 예산을 초과하면 음수다. 그대로 보여준다. */
  remainingBalance: number;
  additions: ReportBudgetAddition[];
}

export interface ReportTagTotal {
  tag: string;
  /** 표시용 한글 라벨. 서버가 내려주므로 앱에서 매핑하지 않는다. */
  label: string;
  amount: number;
  count: number;
}

export interface ReportSpendingLine {
  spendingId: number;
  description: string;
  amount: number;
  tag: string;
  label: string;
  payerName: string;
  spentAt: string;
  /** 증빙 파일 자체는 여기 없다. spendingId로 지출 도메인에서 따로 받는다. */
  hasReceipt: boolean;
}

export interface ReportDetailResponse {
  eventId: number;
  status: ReportStatus;
  aiStatus: AiAnalysisStatus;
  /** AI 분석이 실패하면 null. 이때도 나머지 수치는 정상이다. */
  aiSummary: string | null;
  event: ReportEventSummary;
  budget: ReportBudgetSummary;
  /** 금액 내림차순 */
  tagTotals: ReportTagTotal[];
  /** 지출 일시 오름차순 */
  spendings: ReportSpendingLine[];
  generatedAt: string | null;
}

export interface ReportDownloadResponse {
  /** 발급된 다운로드 URL. 만료가 짧으니 받은 즉시 사용한다. */
  downloadUrl: string;
  /** 저장 시 쓸 파일명. URL에는 이 이름이 들어 있지 않다. */
  fileName: string;
  expiresAt: string;
}

/**
 * 생성 상태 조회. 마감 직후 완료될 때까지 폴링한다.
 *
 * 마감 직후 짧은 동안은 보고서 행이 아직 없어 404가 날 수 있다. "없음"이 아니라 "아직"이므로
 * 폴링을 멈추지 않는다.
 */
export const getReportStatus = (eventId: number) =>
  http.get<ReportStatusResponse>(`/api/v1/events/${eventId}/report/status`);

export const getReport = (eventId: number) =>
  http.get<ReportDetailResponse>(`/api/v1/events/${eventId}/report`);

export const getReportPdfDownload = (eventId: number) =>
  http.get<ReportDownloadResponse>(`/api/v1/events/${eventId}/report/pdf`);

export const getReportCsvDownload = (eventId: number) =>
  http.get<ReportDownloadResponse>(`/api/v1/events/${eventId}/report/csv`);

/** 생성에 실패한 보고서를 다시 만든다. 확정된 결산 수치는 그대로 재사용된다. */
export const retryReport = (eventId: number) =>
  http.post<ReportStatusResponse>(`/api/v1/events/${eventId}/report/retry`);
