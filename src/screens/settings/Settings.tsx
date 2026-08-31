import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from '@expo/vector-icons/Feather';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import ConfirmModal from '../../components/ConfirmModal';
import InfoModal from '../../components/InfoModal';

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
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [supportVisible, setSupportVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

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
            <TouchableOpacity
              style={styles.menuItem}
              onPress={
                item.label === '자주 묻는 질문' ? () => setFaqVisible(true) :
                item.label === '고객센터' ? () => setSupportVisible(true) :
                item.label === '개인정보 처리방침' ? () => setPrivacyVisible(true) :
                item.label === '로그아웃' ? () => setLogoutVisible(true) :
                item.label === '회원 탈퇴' ? () => setWithdrawVisible(true) :
                undefined
              }
            >
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

      <InfoModal visible={faqVisible} title="자주 묻는 질문" onClose={() => setFaqVisible(false)}>
        <FaqItem q="모아셈이 무엇인가요?" a="모임·행사의 예산을 함께 투명하게 관리할 수 있는 서비스입니다." />
        <FaqItem q="행사는 어떻게 만드나요?" a="모임 화면에서 관리자가 '행사 생성하기' 버튼을 눌러 생성할 수 있습니다." />
        <FaqItem q="예산 사용 등록은 누구나 할 수 있나요?" a="모임에 참여한 모든 멤버가 예산 사용을 등록할 수 있습니다. 관리자가 승인하면 사용내역에 반영됩니다." />
        <FaqItem q="영수증 사진은 필수인가요?" a="선택 사항이지만, 정확한 정산을 위해 첨부를 권장합니다." />
        <FaqItem q="반려된 내역은 어떻게 되나요?" a="반려 탭에서 확인할 수 있으며, 관리자에게 재문의 후 다시 등록할 수 있습니다." />
      </InfoModal>

      <InfoModal visible={supportVisible} title="고객센터" onClose={() => setSupportVisible(false)}>
        <Text style={infoStyles.body}>
          {'서비스 이용 중 문의사항이 있으시면 아래 이메일로 연락 주시길 바랍니다.\n\nbaekjw111@gmail.com\n\n확인 후 빠르게 답변 드리겠습니다.'}
        </Text>
      </InfoModal>

      <InfoModal visible={privacyVisible} title="개인정보 처리방침" onClose={() => setPrivacyVisible(false)}>
        <Text style={infoStyles.body}>
          {'모아셈(이하 "서비스")은 이용자의 개인정보를 소중히 여기며 아래와 같이 처리합니다.\n\n■ 수집 항목\n이메일 주소, 이름\n\n■ 수집 목적\n회원 식별 및 서비스 제공\n\n■ 보유 기간\n회원 탈퇴 시까지 보유 후 즉시 파기\n\n■ 제3자 제공\n이용자의 동의 없이 외부에 제공하지 않습니다.\n\n■ 문의\nbaekjw111@gmail.com'}
        </Text>
      </InfoModal>

      <ConfirmModal
        visible={withdrawVisible}
        title="정말 탈퇴하시겠습니까?"
        message={'탈퇴 시 모든 데이터가 삭제되며\n복구가 불가능합니다.'}
        confirmText="예"
        cancelText="아니오"
        onConfirm={() => {
          setWithdrawVisible(false);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }}
        onCancel={() => setWithdrawVisible(false)}
      />

      <ConfirmModal
        visible={logoutVisible}
        title="로그아웃 하시겠습니까?"
        confirmText="예"
        cancelText="아니오"
        onConfirm={() => {
          setLogoutVisible(false);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }}
        onCancel={() => setLogoutVisible(false)}
      />
    </View>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <View style={infoStyles.faqItem}>
      <Text style={infoStyles.faqQ}>{q}</Text>
      <Text style={infoStyles.faqA}>{a}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  faqItem: { gap: 4 },
  faqQ: { fontSize: 13.5, fontWeight: '700', color: '#2b2b28' },
  faqA: { fontSize: 13, color: '#8a8a86', lineHeight: 20 },
  body: { fontSize: 13.5, color: '#8a8a86', lineHeight: 22 },
});

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
