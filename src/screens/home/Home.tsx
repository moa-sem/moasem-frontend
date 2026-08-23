import { useRef, useState } from 'react';
import CreateGroupModal from '../../components/CreateGroupModal';
import InviteCodeInputModal from '../../components/InviteCodeInputModal';
import {
  Animated,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LEAVE_BTN_WIDTH = 84;

type Group = { id: string; name: string; memberCount: number };

const MOCK_GROUPS: Group[] = [
  { id: '1', name: '제주도 여행 계모임', memberCount: 8 },
  { id: '2', name: '사내 동호회 회비', memberCount: 12 },
  { id: '3', name: '대학 동기 모임통장', memberCount: 6 },
  { id: '4', name: '가족 여행 통장', memberCount: 4 },
];

function GroupAvatar() {
  return (
    <View style={styles.avatar}>
      <View style={[styles.avatarCircle, { backgroundColor: '#403a6b', left: 0 }]} />
      <View style={[styles.avatarCircle, { backgroundColor: '#e8a87c', left: 14 }]} />
    </View>
  );
}

function GroupItem({ group, onLeave }: { group: Group; onLeave: () => void }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5,
      onPanResponderGrant: () => {
        translateX.setOffset(offset.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, { dx }) => {
        const clamped = Math.max(-LEAVE_BTN_WIDTH - offset.current, Math.min(-offset.current, dx));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, { dx }) => {
        const total = Math.max(-LEAVE_BTN_WIDTH, Math.min(0, offset.current + dx));
        const snap = total < -LEAVE_BTN_WIDTH / 2 ? -LEAVE_BTN_WIDTH : 0;
        offset.current = snap;
        translateX.flattenOffset();
        Animated.spring(translateX, { toValue: snap, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <View style={styles.groupItemWrapper}>
      <TouchableOpacity style={styles.leaveButton} onPress={onLeave}>
        <Text style={styles.leaveText}>나가기</Text>
      </TouchableOpacity>
      <Animated.View style={[styles.groupItem, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <GroupAvatar />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupMemberCount}>{group.memberCount}명 참여 중</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={require('../../../assets/main_logo.png')} style={styles.headerLogo} resizeMode="contain" />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.titleText}>함께 모으고 있어요</Text>
          <Text style={styles.subtitleText}>참여 중인 모임 {MOCK_GROUPS.length}개</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)} activeOpacity={1}>
            <View style={styles.createIconBox}>
              <View style={styles.plusH} />
              <View style={styles.plusV} />
            </View>
            <Text style={styles.createText}>모임 생성</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inviteButton} onPress={() => setInviteModalVisible(true)} activeOpacity={1}>
            <View style={styles.inviteIconBox} />
            <Text style={styles.inviteText}>초대코드 입력</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>내 모임</Text>
        </View>

        <View style={styles.groupList}>
          {MOCK_GROUPS.map((group) => (
            <GroupItem key={group.id} group={group} onLeave={() => { }} />
          ))}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <InviteCodeInputModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        onSubmit={async (_code) => {
          // TODO: 백엔드 API 호출 후 성공/실패 반환
          return false;
        }}
      />
      <CreateGroupModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={async (_name) => {
          // TODO: 백엔드 API 호출 후 실제 초대코드 반환
          return 'JEJU24';
        }}
      />

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom - 8, 4) }]}>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="home" size={22} color="#403a6b" />
          <Text style={styles.tabLabelActive}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="settings" size={22} color="#a3a29c" />
          <Text style={styles.tabLabelInactive}>설정</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CIRCLE_SIZE = 30;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f3',
  },

  // Header
  header: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 0,
    height: 90,
    justifyContent: 'center',
  },
  headerLogo: {
    width: 72,
    height: 66,
  },

  // Title
  titleSection: {
    paddingHorizontal: 22,
    paddingTop: 23,
    gap: 10,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 14,
    color: '#8a8a86',
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingTop: 20,
    gap: 12,
  },
  createButton: {
    flex: 1,
    height: 115,
    backgroundColor: '#403a6b',
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
  },
  createIconBox: {
    width: 30,
    height: 30,
    backgroundColor: '#e8a87c',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusH: {
    position: 'absolute',
    width: 14,
    height: 2,
    backgroundColor: '#403a6b',
    borderRadius: 1,
  },
  plusV: {
    position: 'absolute',
    width: 2,
    height: 14,
    backgroundColor: '#403a6b',
    borderRadius: 1,
  },
  createText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  inviteButton: {
    flex: 1,
    height: 115,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e5ea',
    padding: 16,
    justifyContent: 'space-between',
  },
  inviteIconBox: {
    width: 30,
    height: 30,
    backgroundColor: '#eef0f2',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#403a6b',
  },
  inviteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },

  // Section
  sectionHeader: {
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  // Group list
  groupList: {
    paddingHorizontal: 22,
    gap: 10,
  },
  groupItemWrapper: {
    height: 76,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e2574c',
  },
  leaveButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: LEAVE_BTN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#fff',
  },
  groupItem: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    position: 'relative',
  },
  avatarCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    top: (44 - CIRCLE_SIZE) / 2,
  },
  groupInfo: {
    gap: 6,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b2b28',
  },
  groupMemberCount: {
    fontSize: 12.5,
    color: '#a3a29c',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eef0f2',
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  tabLabelActive: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#403a6b',
  },
  tabLabelInactive: {
    fontSize: 11.5,
    color: '#a3a29c',
  },
});
