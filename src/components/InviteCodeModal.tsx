import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';

type Props = {
  visible: boolean;
  code: string;
  onClose: () => void;
};

export default function InviteCodeModal({ visible, code, onClose }: Props) {
  const handleCopy = () => {
    // TODO: expo-clipboard 설치 후 Clipboard.setStringAsync(code)
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>모임이 생성됐어요</Text>
          <Text style={styles.subtitle}>아래 초대코드로 친구를 초대해보세요</Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{code}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.7}>
              <Feather name="copy" size={16} color="#8a8a86" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>완료</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#8a8a86',
    marginBottom: 24,
  },
  codeBox: {
    height: 47,
    backgroundColor: '#f2f3f5',
    borderWidth: 1,
    borderColor: '#e2e5ea',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    marginBottom: 16,
  },
  codeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#2b2b28',
    letterSpacing: 4,
  },
  copyButton: {
    width: 38,
    height: 34,
    backgroundColor: '#eef0f2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  button: {
    height: 50,
    backgroundColor: '#403a6b',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
