import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (count: string) => Promise<void>;
};

export default function CloseEventModal({ visible, onClose, onConfirm }: Props) {
  const [count, setCount] = useState('');

  const handleClose = () => {
    setCount('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!count.trim()) return;
    await onConfirm(count.trim());
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.card}>
                <Text style={styles.title}>행사 마감</Text>
                <Text style={styles.subtitle}>이 행사에 참여한 인원 수를 입력해주세요</Text>
                <View style={styles.field}>
                  <Text style={styles.label}>참여 인원 수</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="참여 인원 수를 입력하세요"
                    placeholderTextColor="#a3a29c"
                    value={count}
                    onChangeText={setCount}
                    keyboardType="number-pad"
                    autoFocus
                  />
                </View>
                <TouchableOpacity
                  style={[styles.button, !count.trim() && styles.buttonDisabled]}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                  disabled={!count.trim()}
                >
                  <Text style={styles.buttonText}>마감하기</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#8a8a86',
    marginBottom: 24,
  },
  field: {
    gap: 8,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8a8a86',
  },
  input: {
    height: 47,
    borderWidth: 1,
    borderColor: '#e2e5ea',
    borderRadius: 12,
    paddingHorizontal: 24,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#fff',
  },
  button: {
    height: 50,
    backgroundColor: '#403a6b',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a3a29c',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
