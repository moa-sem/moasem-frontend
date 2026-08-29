import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from '@expo/vector-icons/Feather';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const CIRCLE_SIZE = 30;

function Avatar() {
  return (
    <View style={styles.avatar}>
      <View style={[styles.avatarCircle, { backgroundColor: '#403a6b', left: 0 }]} />
      <View style={[styles.avatarCircle, { backgroundColor: '#e8a87c', left: 14 }]} />
    </View>
  );
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>설정</Text>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <Avatar />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>김소담</Text>
          <Text style={styles.profileEmail}>somdam@email.com</Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.menuList}>
        {[
          { label: '자주 묻는 질문', danger: false },
          { label: '고객센터', danger: false },
          { label: '개인정보 처리방침', danger: false },
          { label: '로그아웃', danger: true },
          { label: '회원 탈퇴', danger: true },
        ].map((item, i, arr) => (
          <View key={item.label}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={[styles.menuText, item.danger && styles.menuTextDanger]}>{item.label}</Text>
            </TouchableOpacity>
            {i < arr.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom - 8, 4) }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.goBack()}>
          <Feather name="home" size={22} color="#a3a29c" />
          <Text style={styles.tabLabelInactive}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="settings" size={22} color="#403a6b" />
          <Text style={styles.tabLabelActive}>설정</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f3',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.2,
    paddingHorizontal: 22,
    paddingTop: 23,
    paddingBottom: 19,
  },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 22,
    borderRadius: 16,
    height: 80,
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    position: 'relative',
  },
  avatarCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    top: (48 - CIRCLE_SIZE) / 2 + 3,
  },
  profileInfo: {
    gap: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2b2b28',
  },
  profileEmail: {
    fontSize: 12.5,
    color: '#a3a29c',
  },

  // Menu
  menuList: {
    marginHorizontal: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#e3e0da',
  },
  menuItem: {
    height: 54,
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 15,
    color: '#2b2b28',
  },
  menuTextDanger: {
    color: '#c85c5c',
  },

  // Tab bar
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
