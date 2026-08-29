import { useState } from 'react';
import {
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

type Tab = '전체' | '진행중' | '완료';
type EventStatus = '완료' | '진행중';

type MoimEvent = {
  id: string;
  name: string;
  status: EventStatus;
  participants: string;
  totalBudget: string;
  remaining: string;
};

const MOCK_EVENTS: MoimEvent[] = [
  { id: '1', name: '2박 3일 렌터카 여행', status: '완료', participants: '8명 참여', totalBudget: '160만원', remaining: '143만원' },
  { id: '2', name: '한라산 등반 준비', status: '진행중', participants: '5명 참여', totalBudget: '40만원', remaining: '38.2만원' },
  { id: '3', name: '연말 숙소 예약', status: '완료', participants: '8명 참여', totalBudget: '90만원', remaining: '90만원' },
];

type NavProp = NativeStackNavigationProp<RootStackParamList, 'GroupDetail'>;
type RoutePropType = RouteProp<RootStackParamList, 'GroupDetail'>;

export default function GroupDetail() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RoutePropType>();
  const { groupName, isAdmin, inviteCode } = params;
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('전체');
  const [menuVisible, setMenuVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const filtered = tab === '전체' ? MOCK_EVENTS : MOCK_EVENTS.filter(e => e.status === tab);

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
          <Text style={styles.totalLabel}>총 {MOCK_EVENTS.length}개</Text>
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
          {filtered.map(event => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('EventDetail', {
                eventName: event.name,
                isAdmin,
                totalBudget: event.totalBudget,
                remaining: event.remaining,
              })}
            >
              <View style={styles.eventTopRow}>
                <Text style={styles.eventName}>{event.name}</Text>
                <View style={[styles.badge, event.status === '진행중' ? styles.badgeOngoing : styles.badgeDone]}>
                  <Text style={[styles.badgeText, event.status === '진행중' ? styles.badgeTextOngoing : styles.badgeTextDone]}>
                    {event.status}
                  </Text>
                </View>
              </View>
              {event.status === '완료' && (
                <Text style={styles.participantText}>{event.participants}</Text>
              )}
              <View style={styles.budgetRow}>
                <Text style={styles.budgetItem}>총 예산 <Text style={styles.budgetValue}>{event.totalBudget}</Text></Text>
                <Text style={styles.budgetItem}>남은 금액 <Text style={styles.budgetValue}>{event.remaining}</Text></Text>
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
        onCreate={async (name, budget) => {
          setEventModalVisible(false);
          navigation.navigate('EventDetail', {
            eventName: name,
            isAdmin: true,
            totalBudget: `${budget}원`,
            remaining: `${budget}원`,
            isNew: true,
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
