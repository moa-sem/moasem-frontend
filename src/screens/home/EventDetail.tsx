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
import type { RootStackParamList } from '../../navigation/RootNavigator';
import ConfirmModal from '../../components/ConfirmModal';
import CloseEventModal from '../../components/CloseEventModal';
import UsageRegistrationModal from '../../components/UsageRegistrationModal';

type Tab = '사용내역' | '보류' | '반려';

type UsageItem = {
  id: string;
  name: string;
  amount: string;
  category: string;
  date: string;
};

const MOCK_사용내역: UsageItem[] = [
  { id: '1', name: '김민준', amount: '150,000원', category: '숙박비', date: '2026.07.12 21:30' },
  { id: '2', name: '홍길동', amount: '20,000원', category: '식비', date: '2026.07.12 19:04' },
];

const MOCK_보류: UsageItem[] = [
  { id: '1', name: '이서연', amount: '35,000원', category: '교통비', date: '2026.07.13 09:15' },
];

const MOCK_반려: UsageItem[] = [
  { id: '1', name: '박지훈', amount: '12,000원', category: '기타', date: '2026.07.13 11:42' },
];

type NavProp = NativeStackNavigationProp<RootStackParamList, 'EventDetail'>;
type RoutePropType = RouteProp<RootStackParamList, 'EventDetail'>;

export default function EventDetail() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<RoutePropType>();
  const { eventName, isAdmin, totalBudget, remaining, isNew } = params;
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('사용내역');
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteBlockedVisible, setDeleteBlockedVisible] = useState(false);
  const [closeEventVisible, setCloseEventVisible] = useState(false);
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [lists, setLists] = useState<Record<Tab, UsageItem[]>>(
    isNew
      ? { '사용내역': [], '보류': [], '반려': [] }
      : { '사용내역': MOCK_사용내역, '보류': MOCK_보류, '반려': MOCK_반려 }
  );

  const items = lists[tab];

  const handleApprove = async (item: UsageItem) => {
    // TODO: 백엔드 승인 API 호출
    setLists(prev => ({
      ...prev,
      '보류': prev['보류'].filter(i => i.id !== item.id),
      '사용내역': [item, ...prev['사용내역']],
    }));
    setTab('사용내역');
  };

  const handleReject = async (item: UsageItem) => {
    // TODO: 백엔드 반려 API 호출
    setLists(prev => ({
      ...prev,
      '보류': prev['보류'].filter(i => i.id !== item.id),
      '반려': [item, ...prev['반려']],
    }));
    setTab('반려');
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
        {/* Budget cards */}
        <View style={styles.budgetRow}>
          <View style={styles.budgetCard}>
            <Text style={styles.budgetLabel}>총 예산</Text>
            <Text style={styles.budgetAmount}>{totalBudget}</Text>
          </View>
          <View style={styles.budgetCard}>
            <Text style={styles.budgetLabel}>남은 금액</Text>
            <Text style={styles.budgetAmount}>{remaining}</Text>
          </View>
        </View>

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

        {/* List */}
        <View style={styles.list}>
          {items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <View style={styles.itemLeft}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemAmount}>{item.amount}</Text>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}># {item.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemDate}>{item.date}</Text>
                </View>
                {isAdmin && tab === '보류' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                      <Text style={styles.approveBtnText}>승인</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                      <Text style={styles.rejectBtnText}>반려</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.useBtn} activeOpacity={0.85} onPress={() => setUsageModalVisible(true)}>
          <Text style={styles.useBtnText}>예산 사용</Text>
        </TouchableOpacity>
      </View>

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
                <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                  <Text style={styles.menuItemText}>PDF 추출</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                  <Text style={styles.menuItemText}>CSV 추출</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                  <Text style={styles.menuItemText}>행사 정보 수정</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
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
                    const hasItems = Object.values(lists).some(l => l.length > 0);
                    if (hasItems) {
                      setDeleteBlockedVisible(true);
                    } else {
                      setDeleteConfirmVisible(true);
                    }
                  }}
                >
                  <Text style={[styles.menuItemText, styles.menuItemDanger]}>행사 삭제</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <UsageRegistrationModal
        visible={usageModalVisible}
        onClose={() => setUsageModalVisible(false)}
        onSubmit={async (data) => {
          // TODO: 백엔드 사용 등록 API 호출
        }}
      />

      <CloseEventModal
        visible={closeEventVisible}
        onClose={() => setCloseEventVisible(false)}
        onConfirm={async (_count) => {
          // TODO: 백엔드 행사 마감 API 호출
        }}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="정말 삭제하시겠습니까?"
        message="삭제하면 되돌릴 수 없어요"
        confirmText="예"
        cancelText="아니오"
        onConfirm={() => {
          setDeleteConfirmVisible(false);
          // TODO: 백엔드 삭제 API 호출
          navigation.goBack();
        }}
        onCancel={() => setDeleteConfirmVisible(false)}
      />

      <ConfirmModal
        visible={deleteBlockedVisible}
        title="삭제할 수 없어요"
        message={'이미 진행중인 행사이기 때문에\n삭제가 불가능합니다.'}
        confirmText="확인"
        onConfirm={() => setDeleteBlockedVisible(false)}
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
  budgetAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2b2b28',
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
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0ee',
    marginHorizontal: 12,
  },
});
