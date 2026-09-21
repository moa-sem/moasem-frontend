import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  getEvidenceDownloadUrl,
  getSpending,
  type SpendingDetailResponse,
} from '../api/spending';
import type { ApiError, SpendingStatus } from '../types/common';

type Props = {
  visible: boolean;
  eventId: number;
  /** 열린 지출. 닫혀 있으면 null. */
  spendingId: number | null;
  /** 신청자 이름. 상세 응답에는 ID만 있어 목록에서 받은 값을 그대로 쓴다. */
  applicantName: string;
  onClose: () => void;
};

const STATUS_LABEL: Record<SpendingStatus, string> = {
  PENDING: '승인 대기',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

const formatWon = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

/**
 * 지출 한 건의 상세.
 *
 * 목록 응답에는 기타 상세와 반려 사유가 없어 열 때 상세를 따로 받는다.
 * 증빙 이미지도 여기서 URL을 발급받는다. 발급된 URL은 곧 만료되므로 미리 받아 두지 않는다.
 */
export default function UsageDetailModal({
  visible,
  eventId,
  spendingId,
  applicantName,
  onClose,
}: Props) {
  const [spending, setSpending] = useState<SpendingDetailResponse | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || spendingId === null) {
      setSpending(null);
      setEvidenceUrl(null);
      setError(null);
      return;
    }

    let canceled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getSpending(eventId, spendingId),
      // 증빙을 못 가져와도 나머지 내용은 보여준다. 이미지 하나 때문에 상세가 안 열리면 안 된다.
      getEvidenceDownloadUrl(eventId, spendingId).catch(() => null),
    ])
      .then(([detail, evidence]) => {
        if (canceled) return;
        setSpending(detail);
        setEvidenceUrl(evidence?.downloadUrl ?? null);
      })
      .catch((requestError: unknown) => {
        if (canceled) return;
        const apiError = requestError as ApiError | undefined;
        setError(apiError?.message ?? '지출 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!canceled) setIsLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [eventId, spendingId, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {isLoading ? (
                <View style={styles.stateBox}>
                  <ActivityIndicator color="#403a6b" />
                </View>
              ) : error ? (
                <View style={styles.stateBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : spending ? (
                <>
                  {/* 영수증 사진 */}
                  <View style={styles.receiptBox}>
                    {evidenceUrl ? (
                      <Image
                        source={{ uri: evidenceUrl }}
                        style={styles.receiptImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.receiptText}>영수증을 불러오지 못했습니다</Text>
                    )}
                  </View>

                  <Text style={styles.title}>{spending.reason}</Text>
                  {spending.otherDetail && (
                    <Text style={styles.subtitle}>{spending.otherDetail}</Text>
                  )}

                  <View style={styles.infoCard}>
                    <InfoRow label="날짜" value={spending.spentOn.replace(/-/g, '.')} />
                    <InfoRow label="작성자" value={applicantName} />
                    <InfoRow label="금액" value={formatWon(spending.amount)} />
                    <InfoRow label="상태" value={STATUS_LABEL[spending.status]} />
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>태그</Text>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}># {spending.tagLabel}</Text>
                      </View>
                    </View>
                  </View>

                  {/* 반려 사유는 신청자가 무엇을 고쳐야 하는지 알려주는 값이라 반드시 보여준다. */}
                  {spending.status === 'REJECTED' && spending.rejectionReason && (
                    <View style={styles.rejectionCard}>
                      <Text style={styles.rejectionLabel}>반려 사유</Text>
                      <Text style={styles.rejectionText}>{spending.rejectionReason}</Text>
                    </View>
                  )}
                </>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 28, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 22.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  stateBox: {
    width: '100%',
    paddingVertical: 48,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#c85c5c',
    textAlign: 'center',
  },
  receiptBox: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 14,
    backgroundColor: '#eef0f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  receiptText: {
    fontSize: 12.5,
    color: '#a3a29c',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2b2b28',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    color: '#a3a29c',
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#f2f3f5',
    borderRadius: 14,
    padding: 14,
    gap: 14,
    marginTop: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 12.5,
    color: '#a3a29c',
  },
  rowValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2b2b28',
  },
  tag: {
    backgroundColor: '#dbe8f7',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2b2b28',
  },
  rejectionCard: {
    width: '100%',
    backgroundColor: '#fdf1f1',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 6,
  },
  rejectionLabel: {
    fontSize: 12,
    color: '#c85c5c',
    fontWeight: '700',
  },
  rejectionText: {
    fontSize: 13,
    color: '#2b2b28',
    lineHeight: 19,
  },
});
