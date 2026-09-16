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
import * as Clipboard from 'expo-clipboard';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import CreateEventModal from '../../components/CreateEventModal';
import EditGroupModal from '../../components/EditGroupModal';
import ConfirmModal from '../../components/ConfirmModal';
import { createEvent, getEvents, type EventListResponse } from '../../api/event';
import type { ApiError, EventStatus } from '../../types/common';

type Tab = '전체' | '진행중' | '완료';

const TAB_STATUS: Record<Tab, EventStatus | undefined> = {
  '전체': undefined,
  '진행중': 'ACTIVE',
  '완료': 'CLOSED',
};

const STATUS_LABEL: Record<EventStatus, string> = {
  ACTIVE: '진행중',
  CLOSED: '완료',
};

const formatWon = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

const normalizeApiError = (error: unknown): ApiError => {
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    return error as ApiError;
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: '행사 목록을 불러오지 못했습니다.',
  };
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'GroupDetail'>;
type RoutePropType = RouteProp<RootStackParamList, 'GroupDetail'>;

export default function GroupDetail() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RoutePropType>();
  const { groupId, groupName, isAdmin, inviteCode } = params;
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('전체');
  const [events, setEvents] = useState<EventListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);
    setEvents([]);

    getEvents(groupId, TAB_STATUS[tab])
      .then((response) => {
        if (requestId === requestIdRef.current) setEvents(response);
      })
      .catch((requestError: unknown) => {
        if (requestId === requestIdRef.current) setError(normalizeApiError(requestError));
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsLoading(false);
      });

    return () => {
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
    };
  }, [groupId, tab, reloadKey]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
          <Feather name="chevron-left" size={24} color="#2b2b28" style={{ marginLeft: -2 }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
        {isAdmin ? (
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerSide}>
            <Feather name="more-horizontal" size={22} color="#2b2b28" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isAdmin ? 100 : 24 }}
      >
        {/* Invite code row */}
        <View style={styles.inviteRow}>
          <Text style={styles.inviteLabel}>초대코드</Text>
          <Text style={styles.inviteCode}>{inviteCode}</Text>
          <TouchableOpacity onPress={() => Clipboard.setStringAsync(inviteCode)} style={styles.copyBtn}>
            <Feather name="copy" size={16} color="#403a6b" />
          </TouchableOpacity>
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>행사 목록</Text>
          <Text style={styles.totalLabel}>총 {events.length}개</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['전체', '진행중', '완료'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Event list */}
        <View style={styles.eventList}>
          {isLoading && (
            <View style={styles.stateContainer}>
              <ActivityIndicator color="#403a6b" />
              <Text style={styles.stateText}>행사 목록을 불러오는 중입니다.</Text>
            </View>
          )}
          {!isLoading && error && (
            <View style={styles.stateContainer}>
              <Text style={styles.errorText}>{error.message}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => setReloadKey(key => key + 1)}>
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          )}
          {!isLoading && !error && events.length === 0 && (
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>해당하는 행사가 없습니다.</Text>
            </View>
          )}
          {!isLoading && !error && events.map(event => (
            <TouchableOpacity
              key={event.eventId}
              style={styles.eventCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('EventDetail', {
                groupId,
                eventId: event.eventId,
                isAdmin,
              })}
            >
              <View style={styles.eventTopRow}>
                <Text style={styles.eventName}>{event.title}</Text>
                <View style={[styles.badge, event.status === 'ACTIVE' ? styles.badgeOngoing : styles.badgeDone]}>
                  <Text style={[styles.badgeText, event.status === 'ACTIVE' ? styles.badgeTextOngoing : styles.badgeTextDone]}>
                    {STATUS_LABEL[event.status]}
                  </Text>
                </View>
              </View>
              {event.status === 'CLOSED' && typeof event.participantCount === 'number' && (
                <Text style={styles.participantText}>{event.participantCount}명 참여</Text>
              )}
              <View style={styles.budgetRow}>
                <Text style={styles.budgetItem}>총 예산 <Text style={styles.budgetValue}>{formatWon(event.totalBudget)}</Text></Text>
                <Text style={styles.budgetItem}>남은 금액 <Text style={styles.budgetValue}>{formatWon(event.remainingBudget)}</Text></Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Admin: create event button */}
      {isAdmin && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.createEventBtn} activeOpacity={0.85} onPress={() => setEventModalVisible(true)}>
            <Text style={styles.createEventText}>행사 생성하기</Text>
          </TouchableOpacity>
        </View>
      )}

      <CreateEventModal
        visible={eventModalVisible}
        onClose={() => setEventModalVisible(false)}
        onCreate={async (request) => {
          const createdEvent = await createEvent(groupId, request);
          if (!isMountedRef.current) return;

          setTab('전체');
          setReloadKey(key => key + 1);
          setEventModalVisible(false);
          navigation.navigate('EventDetail', {
            groupId: createdEvent.groupId,
            eventId: createdEvent.eventId,
            isAdmin,
          });
        }}
      />

      {/* Admin dropdown menu */}
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
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    setEditModalVisible(true);
                  }}
                >
                  <Text style={styles.menuItemText}>모임 정보 수정</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    setDeleteModalVisible(true);
                  }}
                >
                  <Text style={[styles.menuItemText, styles.menuItemDanger]}>모임 삭제</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ConfirmModal
        visible={deleteModalVisible}
        title="정말 삭제하시겠습니까?"
        message="삭제하면 되돌릴 수 없어요"
        confirmText="예"
        cancelText="아니오"
        onConfirm={() => {
          setDeleteModalVisible(false);
          // TODO: 백엔드 삭제 API 호출 후 홈으로 이동
          navigation.goBack();
        }}
        onCancel={() => setDeleteModalVisible(false)}
      />

      <EditGroupModal
        visible={editModalVisible}
        currentName={groupName}
        onClose={() => setEditModalVisible(false)}
        onEdit={async (_name) => {
          // TODO: 백엔드 API 호출
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
  headerSide: {
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
  // Invite code
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 22,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  inviteLabel: {
    fontSize: 13,
    color: '#8a8a86',
  },
  inviteCode: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#2b2b28',
    letterSpacing: 1,
  },
  copyBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#eef0f2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 22,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2b2b28',
  },
  totalLabel: {
    fontSize: 13,
    color: '#8a8a86',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 22,
    gap: 8,
    marginBottom: 14,
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

  // Event list
  eventList: {
    marginHorizontal: 22,
    gap: 10,
  },
  stateContainer: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
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
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b2b28',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeOngoing: {
    backgroundColor: '#eaeef3',
  },
  badgeDone: {
    backgroundColor: '#eef0f2',
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  badgeTextOngoing: {
    color: '#403a6b',
  },
  badgeTextDone: {
    color: '#8a8a86',
  },
  participantText: {
    fontSize: 12,
    color: '#a3a29c',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  budgetItem: {
    fontSize: 12,
    color: '#8a8a86',
  },
  budgetValue: {
    fontWeight: '700',
    color: '#2b2b28',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    backgroundColor: '#f4f4f3',
  },
  createEventBtn: {
    backgroundColor: '#403a6b',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createEventText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Dropdown menu
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
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0ee',
    marginHorizontal: 12,
  },
});
