import { useCallback, useEffect, useRef, useState } from 'react';
import {
  approveSpending,
  createSpending,
  getSpendings,
  issueEvidenceUploadUrl,
  rejectSpending,
  type CreateSpendingRequest,
  type SpendingListResponse,
} from '../api/spending';
import { uploadEvidenceFile, type EvidenceFile } from '../api/spending/uploadEvidenceFile';
import type { ApiError, SpendingStatus } from '../types/common';

/**
 * 행사 한 건의 지출 목록과 처리 동작을 모은다.
 *
 * 상태별로 따로 조회한다. 탭이 곧 상태라, 한 번에 다 받아 앱에서 나누면 탭마다
 * 페이지가 어긋난다.
 */

export type NewSpending = {
  amount: number;
  spentOn: string;
  reason: string;
  tag: CreateSpendingRequest['tag'];
  otherDetail: string | null;
  evidence: EvidenceFile;
};

const toApiError = (error: unknown, fallback: string): ApiError => {
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    return error as ApiError;
  }
  return { code: 'UNKNOWN_ERROR', message: fallback };
};

export function useSpendings(eventId: number, status: SpendingStatus) {
  const [items, setItems] = useState<SpendingListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 탭을 빠르게 오가면 먼저 보낸 요청이 늦게 도착할 수 있다. 마지막 요청의 응답만 반영한다.
  const requestIdRef = useRef(0);
  const pageRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const response = await getSpendings(eventId, { status, page: 0 });
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;

      pageRef.current = 0;
      setItems(response.content);
      setHasMore(response.page.number + 1 < response.page.totalPages);
    } catch (requestError: unknown) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setError(toApiError(requestError, '지출 내역을 불러오지 못했습니다.'));
      setItems([]);
      setHasMore(false);
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [eventId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  /** 한 페이지가 20건이다. 그 아래 건이 영영 안 보이지 않도록 이어 받는다. */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const requestId = requestIdRef.current;
    setIsLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const response = await getSpendings(eventId, { status, page: nextPage });
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;

      pageRef.current = nextPage;
      setItems(previous => [...previous, ...response.content]);
      setHasMore(response.page.number + 1 < response.page.totalPages);
    } catch (requestError: unknown) {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setError(toApiError(requestError, '다음 목록을 불러오지 못했습니다.'));
      }
    } finally {
      if (isMountedRef.current) setIsLoadingMore(false);
    }
  }, [eventId, hasMore, isLoadingMore, status]);

  return { items, isLoading, error, hasMore, isLoadingMore, reload: load, loadMore };
}

/**
 * 지출 신청. 증빙을 먼저 올리고 그 저장 키로 신청한다.
 *
 * 업로드가 성공한 뒤 신청이 실패하면 저장소에 주인 없는 파일이 남는다. 지우지 않는다 —
 * 사용자가 다시 제출하면 새 키로 다시 올라가고, 남은 파일은 어느 지출에서도 참조되지 않는다.
 * 여기서 정리하려면 실패 경로마다 삭제를 호출해야 하는데, 그 코드가 더 자주 틀린다.
 */
export async function submitSpending(eventId: number, spending: NewSpending) {
  const { evidence } = spending;

  const { uploadUrl, storageKey } = await issueEvidenceUploadUrl(eventId, {
    mimeType: evidence.mimeType,
    fileSize: evidence.fileSize,
  });

  await uploadEvidenceFile(uploadUrl, evidence);

  return createSpending(eventId, {
    amount: spending.amount,
    spentOn: spending.spentOn,
    reason: spending.reason,
    tag: spending.tag,
    otherDetail: spending.otherDetail,
    evidence: {
      type: 'RECEIPT',
      storageKey,
      mimeType: evidence.mimeType,
      fileSize: evidence.fileSize,
    },
  });
}

export const approve = (eventId: number, spendingId: number) =>
  approveSpending(eventId, spendingId);

export const reject = (eventId: number, spendingId: number, reason: string) =>
  rejectSpending(eventId, spendingId, { reason });
