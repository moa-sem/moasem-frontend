import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import {
  getReport,
  getReportStatus,
  retryReport,
  type ReportDetailResponse,
  type ReportStatusResponse,
} from '../api/report';
import type { ApiError } from '../types/common';

/** 생성이 끝날 때까지 다시 물어보는 간격. */
const POLL_INTERVAL_MS = 2000;

/**
 * 폴링을 멈추는 시점.
 *
 * 무한정 돌면 화면을 켜 둔 채 두었을 때 요청이 계속 나간다. 여기까지 걸렸다면 생성이
 * 정상적으로 끝나지 않은 것이므로 다시 확인하도록 안내한다.
 */
const POLL_TIMEOUT_MS = 90_000;

type Props = {
  eventId: number;
  /** 결산 상세로 이동. 상세 화면이 아직 없으면 넘기지 않는다. */
  onPressDetail?: () => void;
};

const formatAmount = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

/**
 * 마감된 행사의 결산 요약.
 *
 * 보고서는 마감 시 서버가 백그라운드로 만든다. 그래서 이 카드는 "아직 없음"에서 시작해
 * 완료될 때까지 상태를 다시 물어본다.
 */
export default function ReportSummaryCard({ eventId, onPressDetail }: Props) {
  const [status, setStatus] = useState<ReportStatusResponse | null>(null);
  const [report, setReport] = useState<ReportDetailResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const isMountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const loadDetail = useCallback(async () => {
    try {
      const detail = await getReport(eventId);
      if (isMountedRef.current) setReport(detail);
    } catch {
      // 상세를 못 불러와도 카드 자체는 유지한다. 생성이 끝났다는 사실은 이미 알고 있다.
    }
  }, [eventId]);

  const poll = useCallback(async () => {
    try {
      const next = await getReportStatus(eventId);
      if (!isMountedRef.current) return;

      setStatus(next);
      setError(null);

      if (next.status === 'COMPLETED') {
        void loadDetail();
        return;
      }
      if (next.status === 'FAILED') return;
    } catch (requestError: unknown) {
      if (!isMountedRef.current) return;

      const apiError = requestError as ApiError;
      // 마감 직후에는 보고서 행이 아직 없어 404가 난다. "없음"이 아니라 "아직"이므로
      // 여기서 멈추면 사용자는 결산을 영영 보지 못한다.
      if (apiError?.code !== 'REPORT_NOT_FOUND') {
        setError(apiError);
        return;
      }
    }

    if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
      if (isMountedRef.current) setTimedOut(true);
      return;
    }
    timerRef.current = setTimeout(() => void poll(), POLL_INTERVAL_MS);
  }, [eventId, loadDetail]);

  useEffect(() => {
    startedAtRef.current = Date.now();
    void poll();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [poll]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setError(null);
    try {
      const next = await retryReport(eventId);
      if (!isMountedRef.current) return;
      setStatus(next);
      if (next.status === 'COMPLETED') void loadDetail();
    } catch (requestError: unknown) {
      if (isMountedRef.current) setError(requestError as ApiError);
    } finally {
      if (isMountedRef.current) setIsRetrying(false);
    }
  }, [eventId, loadDetail]);

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>결산 보고서</Text>
        <Text style={styles.muted}>{error.message ?? '결산 정보를 불러오지 못했습니다.'}</Text>
      </View>
    );
  }

  if (timedOut) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>결산 보고서</Text>
        <Text style={styles.muted}>생성이 오래 걸리고 있어요. 잠시 후 다시 확인해주세요.</Text>
      </View>
    );
  }

  if (status?.status === 'FAILED') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>결산 보고서</Text>
        <Text style={styles.failureText}>
          {status.failureReason ?? '결산 보고서를 만들지 못했어요.'}
        </Text>
        {status.retryable && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            disabled={isRetrying}
            activeOpacity={0.8}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.retryText}>다시 만들기</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 아직 상태를 받지 못했거나(마감 직후 404) 생성 중인 경우
  if (!status || status.status !== 'COMPLETED') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>결산 보고서</Text>
        <View style={styles.generatingRow}>
          <ActivityIndicator size="small" color="#403a6b" />
          <Text style={styles.muted}>결산 보고서를 만들고 있어요</Text>
        </View>
      </View>
    );
  }

  const budget = report?.budget;
  const isOverBudget = (budget?.remainingBalance ?? 0) < 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPressDetail}
      disabled={!onPressDetail}
      activeOpacity={0.8}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>결산 보고서</Text>
        {onPressDetail ? <Feather name="chevron-right" size={18} color="#8a8a86" /> : null}
      </View>

      {budget ? (
        <View style={styles.amountRow}>
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>총 예산</Text>
            <Text style={styles.amountValue}>{formatAmount(budget.totalBudget)}</Text>
          </View>
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>총 지출</Text>
            <Text style={styles.amountValue}>{formatAmount(budget.totalSpent)}</Text>
          </View>
          <View style={styles.amountBlock}>
            {/* 예산을 넘겼으면 음수 그대로 보여준다. 초과 사실이 드러나야 한다. */}
            <Text style={styles.amountLabel}>{isOverBudget ? '초과 금액' : '남은 금액'}</Text>
            <Text style={[styles.amountValue, isOverBudget ? styles.overBudget : null]}>
              {formatAmount(budget.remainingBalance)}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.muted}>결산이 완료되었어요</Text>
      )}

      {/* AI 분석이 실패해도 결산 수치는 정상이다. 그 영역만 비운다. */}
      {report?.aiSummary ? (
        <Text style={styles.aiSummary} numberOfLines={3}>
          {report.aiSummary}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b2b28',
  },
  muted: {
    fontSize: 13,
    color: '#8a8a86',
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amountBlock: {
    flex: 1,
    gap: 4,
  },
  amountLabel: {
    fontSize: 12,
    color: '#8a8a86',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b2b28',
  },
  overBudget: {
    color: '#c85c5c',
  },
  aiSummary: {
    fontSize: 13,
    lineHeight: 19,
    color: '#5f5f5a',
  },
  failureText: {
    fontSize: 13,
    color: '#c85c5c',
  },
  retryButton: {
    backgroundColor: '#403a6b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
