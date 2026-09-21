import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import ConfirmModal from '../../components/ConfirmModal';
import CloseEventModal from '../../components/CloseEventModal';
import UsageRegistrationModal from '../../components/UsageRegistrationModal';
import EditEventModal from '../../components/EditEventModal';
import UsageDetailModal from '../../components/UsageDetailModal';
import ReportSummaryCard from '../../components/ReportSummaryCard';
import BudgetAdditionModal from '../../components/BudgetAdditionModal';
import RejectSpendingModal from '../../components/RejectSpendingModal';
import {
  addBudgetAddition,
  closeEvent,
  deleteEvent,
  getEvent,
  previewEventClose,
  type CreateBudgetAdditionRequest,
  type EventClosePreviewResponse,
  type EventDetailResponse,
} from '../../api/event';
import type { ApiError, EventStatus, SpendingStatus } from '../../types/common';
import type { SpendingListResponse } from '../../api/spending';
import { approve, reject, submitSpending, useSpendings, type NewSpending } from '../../hooks/useSpendings';
import { useReportDownload, type ReportFileKind } from '../../hooks/useReportDownload';

type Tab = '사용내역' | '보류' | '반려';

/** 탭이 곧 지출 상태다. 승인된 건만 예산에 반영되므로 기본 탭은 사용내역이다. */
const TAB_STATUS: Record<Tab, SpendingStatus> = {
  '사용내역': 'APPROVED',
  '보류': 'PENDING',
  '반려': 'REJECTED',
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'EventDetail'>;
type RoutePropType = RouteProp<RootStackParamList, 'EventDetail'>;

const STATUS_LABEL: Record<EventStatus, string> = {
  ACTIVE: '진행중',
  CLOSED: '완료',
};

const formatWon = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

const EMPTY_TEXT: Record<Tab, string> = {
  '사용내역': '승인된 지출이 아직 없습니다.',
  '보류': '처리할 지출 신청이 없습니다.',
  '반려': '반려된 지출이 없습니다.',
};

const normalizeApiError = (
  error: unknown,
  fallbackMessage = '행사 정보를 불러오지 못했습니다.',
): ApiError => {
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    return error as ApiError;
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: fallbackMessage,
  };
};

export default function EventDetail() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RoutePropType>();
  const { groupId, eventId, isAdmin } = params;
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<EventDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<{ title: string; message: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<Tab>('사용내역');
  const [menuVisible, setMenuVisible] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { download, downloading } = useReportDownload({ onError: setDownloadError });
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [closeEventVisible, setCloseEventVisible] = useState(false);
  const [closePreview, setClosePreview] = useState<EventClosePreviewResponse | null>(null);
  const [closeError, setCloseError] = useState<ApiError | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeSucceeded, setCloseSucceeded] = useState(false);
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [budgetAdditionVisible, setBudgetAdditionVisible] = useState(false);
  const [editEventVisible, setEditEventVisible] = useState(false);
  const [editedEventName, setEditedEventName] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SpendingListResponse | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SpendingListResponse | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [spendingError, setSpendingError] = useState<string | null>(null);

  const {
    items,
    isLoading: isSpendingsLoading,
    error: spendingsError,
    hasMore,
    isLoadingMore,
    reload: reloadSpendings,
    loadMore,
  } = useSpendings(eventId, TAB_STATUS[tab]);
  const detailRequestIdRef = useRef(0);
  const previewRequestIdRef = useRef(0);
  const isDeletingRef = useRef(false);
  const isPreviewLoadingRef = useRef(false);
  const isClosingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setCloseSucceeded(false);
  }, [eventId, groupId]);

  useEffect(() => {
    const requestId = ++detailRequestIdRef.current;

    setIsLoading(true);
    setError(null);
    setRefreshWarning(null);

    getEvent(groupId, eventId)
      .then((response) => {
        if (requestId === detailRequestIdRef.current) {
          setEvent(response);
          setEditedEventName(null);
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === detailRequestIdRef.current) setError(normalizeApiError(requestError));
      })
      .finally(() => {
        if (requestId === detailRequestIdRef.current) setIsLoading(false);
      });

    return () => {
      if (requestId === detailRequestIdRef.current) detailRequestIdRef.current += 1;
    };
  }, [eventId, groupId, reloadKey]);

  const eventName = editedEventName
    ?? event?.title
    ?? '행사 상세';
  const totalBudget = event?.totalBudget ?? 0;
  const remainingBudget = event?.remainingBudget ?? 0;
  const eventStatus: EventStatus | null = event?.status ?? null;
  const isActionableActive = eventStatus === 'ACTIVE' && !closeSucceeded;

  // 마감 전에는 보고서 자체가 없다. 눌러도 실패할 동작을 열어 두지 않는다.
  const canDownloadReport = eventStatus === 'CLOSED';

  const handleDownload = (kind: ReportFileKind) => {
    setMenuVisible(false);
    setDownloadError(null);
    void download(kind, eventId);
  };

  /**
   * 승인·반려 후에는 행사 예산도 다시 읽는다.
   *
   * 승인된 지출만 예산에 반영되므로, 목록만 갱신하면 상단 잔여 예산이 옛 값으로 남는다.
   */
  const refreshAfterProcessing = async () => {
    await reloadSpendings();

    const requestId = ++detailRequestIdRef.current;
    try {
      const refreshedEvent = await getEvent(groupId, eventId);
      if (isMountedRef.current && requestId === detailRequestIdRef.current) {
        setEvent(refreshedEvent);
      }
    } catch {
      // 예산 갱신 실패는 처리 결과를 되돌리지 않는다. 다음 조회에서 맞춰진다.
    }
  };

  const handleApprove = async (item: SpendingListResponse) => {
    // 같은 건을 두 번 누르면 뒤엣것은 서버에서 막히지만, 그 전에 버튼을 잠근다.
    if (processingId !== null) return;

    setProcessingId(item.spendingId);
    setSpendingError(null);

    try {
      await approve(eventId, item.spendingId);
      if (!isMountedRef.current) return;
      await refreshAfterProcessing();
    } catch (requestError: unknown) {
      if (isMountedRef.current) {
        setSpendingError(normalizeApiError(requestError, '지출을 승인하지 못했습니다.').message);
      }
    } finally {
      if (isMountedRef.current) setProcessingId(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;

    await reject(eventId, rejectTarget.spendingId, reason);
    if (!isMountedRef.current) return;

    setRejectTarget(null);
    setSpendingError(null);
    await refreshAfterProcessing();
  };

  const handleRegisterSpending = async (spending: NewSpending) => {
    await submitSpending(eventId, spending);
    if (!isMountedRef.current) return;

    setUsageModalVisible(false);
    // 신청은 항상 대기 상태로 시작한다. 방금 낸 건이 보이도록 그 탭으로 옮긴다.
    setTab('보류');
    if (TAB_STATUS[tab] === 'PENDING') await reloadSpendings();
  };

  const handleBudgetAddition = async (request: CreateBudgetAdditionRequest) => {
    await addBudgetAddition(groupId, eventId, request);
    if (!isMountedRef.current) return;

    setBudgetAdditionVisible(false);
    setRefreshWarning(null);

    const requestId = ++detailRequestIdRef.current;
    try {
      const refreshedEvent = await getEvent(groupId, eventId);
      if (isMountedRef.current && requestId === detailRequestIdRef.current) {
        setEvent(refreshedEvent);
      }
    } catch (requestError: unknown) {
      if (isMountedRef.current && requestId === detailRequestIdRef.current) {
        const normalizedError = normalizeApiError(
          requestError,
          '추가 예산은 등록되었지만 최신 예산 정보를 불러오지 못했습니다.',
        );
        setRefreshWarning({
          title: '예산 정보 갱신 실패',
          message: normalizedError.message,
        });
      }
    }
  };

  const handleDelete = async () => {
    if (isDeletingRef.current || closeSucceeded) return;

    isDeletingRef.current = true;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteEvent(groupId, eventId);
      if (!isMountedRef.current) return;

      setDeleteConfirmVisible(false);
      navigation.goBack();
    } catch (requestError: unknown) {
      if (isMountedRef.current) {
        setDeleteError(normalizeApiError(requestError, '행사를 삭제하지 못했습니다.'));
      }
    } finally {
      isDeletingRef.current = false;
      if (isMountedRef.current) setIsDeleting(false);
    }
  };

  const invalidateClosePreview = () => {
    previewRequestIdRef.current += 1;
    setClosePreview(null);
    setCloseError(null);
  };

  const handleClosePreview = async (participantCount: number) => {
    if (isPreviewLoadingRef.current || isClosingRef.current || closeSucceeded) return;

    const requestId = ++previewRequestIdRef.current;
    isPreviewLoadingRef.current = true;
    setIsPreviewLoading(true);
    setClosePreview(null);
    setCloseError(null);

    try {
      const preview = await previewEventClose(groupId, eventId, { participantCount });
      if (isMountedRef.current && requestId === previewRequestIdRef.current) {
        setClosePreview(preview);
      }
    } catch (requestError: unknown) {
      if (isMountedRef.current && requestId === previewRequestIdRef.current) {
        setCloseError(normalizeApiError(requestError, '마감 정보를 확인하지 못했습니다.'));
      }
    } finally {
      isPreviewLoadingRef.current = false;
      if (isMountedRef.current && requestId === previewRequestIdRef.current) {
        setIsPreviewLoading(false);
      }
    }
  };

  const handleCloseEvent = async (participantCount: number) => {
    if (
      isClosingRef.current
      || isPreviewLoadingRef.current
      || closeSucceeded
      || closePreview?.participantCount !== participantCount
    ) return;

    isClosingRef.current = true;
    setIsClosing(true);
    setCloseError(null);

    try {
      await closeEvent(groupId, eventId, { participantCount });
      if (!isMountedRef.current) return;

      setCloseSucceeded(true);
      setCloseEventVisible(false);
      setClosePreview(null);
      setRefreshWarning(null);

      const requestId = ++detailRequestIdRef.current;
      try {
        const refreshedEvent = await getEvent(groupId, eventId);
        if (isMountedRef.current && requestId === detailRequestIdRef.current) {
          setEvent(refreshedEvent);
        }
      } catch (requestError: unknown) {
        if (isMountedRef.current && requestId === detailRequestIdRef.current) {
          const normalizedError = normalizeApiError(
            requestError,
            '행사는 마감되었지만 최신 행사 정보를 불러오지 못했습니다.',
          );
          setRefreshWarning({
            title: '행사 정보 갱신 실패',
            message: normalizedError.message,
          });
        }
      }
    } catch (requestError: unknown) {
      if (isMountedRef.current) {
        setCloseError(normalizeApiError(requestError, '행사를 마감하지 못했습니다.'));
      }
    } finally {
      isClosingRef.current = false;
      if (isMountedRef.current) setIsClosing(false);
    }
  };

  const handleCloseModal = () => {
    if (isPreviewLoadingRef.current || isClosingRef.current) return;
    previewRequestIdRef.current += 1;
    setCloseEventVisible(false);
    setClosePreview(null);
    setCloseError(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Feather name="chevron-left" size={24} color="#2b2b28" style={{ marginLeft: -2 }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{eventName}</Text>
        {isAdmin ? (
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerBtn}>
            <Feather name="more-horizontal" size={22} color="#2b2b28" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator color="#403a6b" />
            <Text style={styles.stateText}>행사 정보를 불러오는 중입니다.</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{error.message}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setReloadKey(key => key + 1)}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Budget cards */}
            <View style={styles.budgetRow}>
              <View style={styles.budgetCard}>
                <Text style={styles.budgetLabel}>총 예산</Text>
                <Text style={styles.budgetAmount}>{formatWon(totalBudget)}</Text>
              </View>
              <View style={styles.budgetCard}>
                {/* 예산을 넘기면 값이 음수로 내려온다. 그때도 "남은 금액"이라고 부르면
                    초과 사실이 드러나지 않는다. 결산 카드와 같은 기준으로 표시한다. */}
                <Text style={styles.budgetLabel}>
                  {remainingBudget < 0 ? '초과 금액' : '남은 금액'}
                </Text>
                <Text style={[styles.budgetAmount, remainingBudget < 0 ? styles.budgetAmountOver : null]}>
                  {formatWon(remainingBudget)}
                </Text>
              </View>
            </View>

            {eventStatus && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>행사 상태</Text>
                <View style={[styles.statusBadge, eventStatus === 'ACTIVE' ? styles.statusBadgeActive : styles.statusBadgeClosed]}>
                  <Text style={[styles.statusText, eventStatus === 'ACTIVE' ? styles.statusTextActive : styles.statusTextClosed]}>
                    {STATUS_LABEL[eventStatus]}
                  </Text>
                </View>
              </View>
            )}

            {/* 마감된 행사에만 결산이 존재한다. 생성 상태는 카드가 스스로 확인한다. */}
            {eventStatus === 'CLOSED' && (
              <View style={styles.reportSection}>
                <ReportSummaryCard eventId={eventId} />
              </View>
            )}

            {downloadError && (
              <View style={styles.refreshErrorCard}>
                <Feather name="alert-circle" size={16} color="#c85c5c" />
                <View style={styles.refreshErrorContent}>
                  <Text style={styles.refreshErrorTitle}>결산 보고서 내려받기 실패</Text>
                  <Text style={styles.refreshErrorText}>{downloadError}</Text>
                </View>
              </View>
            )}

            {refreshWarning && (
              <View style={styles.refreshErrorCard}>
                <Feather name="alert-circle" size={16} color="#c85c5c" />
                <View style={styles.refreshErrorContent}>
                  <Text style={styles.refreshErrorTitle}>{refreshWarning.title}</Text>
                  <Text style={styles.refreshErrorText}>{refreshWarning.message}</Text>
                </View>
              </View>
            )}

            {/* Tabs */}
            <View style={styles.tabRow}>
              {(['사용내역', '보류', '반려'] as Tab[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tab, tab === t && styles.tabActive]}
                  onPress={() => setTab(t)}
                >
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {spendingError && (
              <View style={styles.refreshErrorCard}>
                <Feather name="alert-circle" size={16} color="#c85c5c" />
                <View style={styles.refreshErrorContent}>
                  <Text style={styles.refreshErrorTitle}>지출 처리 실패</Text>
                  <Text style={styles.refreshErrorText}>{spendingError}</Text>
                </View>
              </View>
            )}

            {/* List */}
            <View style={styles.list}>
              {isSpendingsLoading ? (
                <View style={styles.listStateBox}>
                  <ActivityIndicator color="#403a6b" />
                </View>
              ) : spendingsError ? (
                <View style={styles.listStateBox}>
                  <Text style={styles.errorText}>{spendingsError.message}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => void reloadSpendings()}>
                    <Text style={styles.retryButtonText}>다시 시도</Text>
                  </TouchableOpacity>
                </View>
              ) : items.length === 0 ? (
                <View style={styles.listStateBox}>
                  <Text style={styles.emptyText}>{EMPTY_TEXT[tab]}</Text>
                </View>
              ) : (
                <>
                  {items.map(item => (
                    <TouchableOpacity
                      key={item.spendingId}
                      style={styles.itemCard}
                      activeOpacity={0.7}
                      onPress={() => setSelectedItem(item)}
                    >
                      <View style={styles.itemTopRow}>
                        <View style={styles.itemLeft}>
                          <View style={styles.itemNameRow}>
                            <Text style={styles.itemName}>{item.applicantName}</Text>
                            <Text style={styles.itemAmount}>{formatWon(item.amount)}</Text>
                            <View style={styles.categoryTag}>
                              <Text style={styles.categoryText}># {item.tagLabel}</Text>
                            </View>
                          </View>
                          <Text style={styles.itemDate}>{item.spentOn.replace(/-/g, '.')}</Text>
                        </View>
                        {isAdmin && tab === '보류' && isActionableActive && (
                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              style={[styles.approveBtn, processingId !== null && styles.actionBtnDisabled]}
                              onPress={() => handleApprove(item)}
                              disabled={processingId !== null}
                            >
                              <Text style={styles.approveBtnText}>승인</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.rejectBtn, processingId !== null && styles.actionBtnDisabled]}
                              onPress={() => setRejectTarget(item)}
                              disabled={processingId !== null}
                            >
                              <Text style={styles.rejectBtnText}>반려</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* 한 번에 20건씩 온다. 그 아래 건이 영영 안 보이지 않도록 이어 받는다. */}
                  {hasMore && (
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => void loadMore()}
                      disabled={isLoadingMore}
                    >
                      <Text style={styles.moreButtonText}>
                        {isLoadingMore ? '불러오는 중...' : '더 보기'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom button */}
      {!isLoading && !error && isActionableActive && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.useBtn} activeOpacity={0.85} onPress={() => setUsageModalVisible(true)}>
            <Text style={styles.useBtnText}>예산 사용</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Admin dropdown */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.menuCard, { top: insets.top + 48 }]}>
                {isActionableActive && (
                  <>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuVisible(false);
                        setBudgetAdditionVisible(true);
                      }}
                    >
                      <Text style={styles.menuItemText}>추가 예산 등록</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                  </>
                )}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleDownload('pdf')}
                  disabled={!canDownloadReport || downloading !== null}
                >
                  <Text style={[styles.menuItemText, !canDownloadReport ? styles.menuItemTextDisabled : null]}>
                    PDF 추출
                  </Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleDownload('csv')}
                  disabled={!canDownloadReport || downloading !== null}
                >
                  <Text style={[styles.menuItemText, !canDownloadReport ? styles.menuItemTextDisabled : null]}>
                    CSV 추출
                  </Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    setEditEventVisible(true);
                  }}
                >
                  <Text style={styles.menuItemText}>행사 정보 수정</Text>
                </TouchableOpacity>
                {isActionableActive && (
                  <>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuVisible(false);
                        setClosePreview(null);
                        setCloseError(null);
                        setCloseEventVisible(true);
                      }}
                    >
                      <Text style={styles.menuItemText}>행사 마감</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuVisible(false);
                        setDeleteError(null);
                        setDeleteConfirmVisible(true);
                      }}
                    >
                      <Text style={[styles.menuItemText, styles.menuItemDanger]}>행사 삭제</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <BudgetAdditionModal
        visible={budgetAdditionVisible}
        onClose={() => setBudgetAdditionVisible(false)}
        onSubmit={handleBudgetAddition}
      />

      <UsageDetailModal
        visible={!!selectedItem}
        eventId={eventId}
        spendingId={selectedItem?.spendingId ?? null}
        applicantName={selectedItem?.applicantName ?? ''}
        onClose={() => setSelectedItem(null)}
      />

      <RejectSpendingModal
        visible={!!rejectTarget}
        applicantName={rejectTarget?.applicantName ?? ''}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleReject}
      />

      <EditEventModal
        visible={editEventVisible}
        currentName={eventName}
        onClose={() => setEditEventVisible(false)}
        onEdit={async (name) => {
          setEditedEventName(name);
          // TODO: 백엔드 행사 이름 수정 API 호출
        }}
      />

      <UsageRegistrationModal
        visible={usageModalVisible}
        onClose={() => setUsageModalVisible(false)}
        onSubmit={handleRegisterSpending}
      />

      <CloseEventModal
        visible={closeEventVisible}
        preview={closePreview}
        isPreviewLoading={isPreviewLoading}
        isClosing={isClosing}
        errorMessage={closeError?.message}
        onClose={handleCloseModal}
        onParticipantCountChange={invalidateClosePreview}
        onPreview={handleClosePreview}
        onConfirm={handleCloseEvent}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="정말 삭제하시겠습니까?"
        message="삭제하면 되돌릴 수 없어요"
        confirmText="예"
        cancelText="아니오"
        isLoading={isDeleting}
        errorMessage={deleteError?.message}
        onConfirm={handleDelete}
        onCancel={() => {
          if (isDeletingRef.current) return;
          setDeleteConfirmVisible(false);
          setDeleteError(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f3',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 22,
    backgroundColor: '#f4f4f3',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#2b2b28',
    marginLeft: 10,
  },

  // Budget cards
  reportSection: {
    marginTop: 4,
  },
  budgetRow: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginTop: 16,
    gap: 12,
  },
  budgetCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#8a8a86',
  },
  budgetAmountOver: {
    color: '#c85c5c',
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2b2b28',
  },
  stateContainer: {
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
  },
  stateText: {
    fontSize: 13,
    color: '#8a8a86',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#c85c5c',
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 10,
    backgroundColor: '#403a6b',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 22,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  statusLabel: {
    fontSize: 13,
    color: '#8a8a86',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusBadgeActive: {
    backgroundColor: '#eaeef3',
  },
  statusBadgeClosed: {
    backgroundColor: '#eef0f2',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#403a6b',
  },
  statusTextClosed: {
    color: '#8a8a86',
  },
  refreshErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 22,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fde8e7',
  },
  refreshErrorContent: {
    flex: 1,
    gap: 3,
  },
  refreshErrorTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#c85c5c',
  },
  refreshErrorText: {
    fontSize: 12,
    color: '#c85c5c',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginTop: 24,
    marginBottom: 14,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#403a6b',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8a8a86',
  },
  tabTextActive: {
    color: '#fff',
  },

  // List
  listStateBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#a3a29c',
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  moreButton: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f2f3f5',
  },
  moreButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5c5c58',
  },
  list: {
    marginHorizontal: 22,
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flex: 1,
    gap: 6,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2b2b28',
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8a8a86',
  },
  categoryTag: {
    backgroundColor: '#eaeef3',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#403a6b',
  },
  itemDate: {
    fontSize: 12,
    color: '#a3a29c',
  },

  // Approve/Reject buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  approveBtn: {
    backgroundColor: '#403a6b',
    borderRadius: 8,
    width: 44,
    height: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#fff',
  },
  rejectBtn: {
    backgroundColor: '#fde8e7',
    borderRadius: 8,
    width: 44,
    height: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#c85c5c',
  },

  // Bottom
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    backgroundColor: '#f4f4f3',
  },
  useBtn: {
    backgroundColor: '#403a6b',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Dropdown
  menuOverlay: {
    flex: 1,
  },
  menuCard: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 148,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    fontSize: 14,
    color: '#2b2b28',
  },
  menuItemDanger: {
    color: '#e2574c',
  },
  menuItemTextDisabled: {
    color: '#c4c4bf',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0ee',
    marginHorizontal: 12,
  },
});
