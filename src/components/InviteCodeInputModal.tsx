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
  onSubmit: (code: string) => Promise<boolean>; // true: 성공, false: 실패
};

export default function InviteCodeInputModal({ visible, onClose, onSubmit }: Props) {
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'input' | 'error'>('input');

  const handleSubmit = async () => {
    if (!code.trim()) return;
    const success = await onSubmit(code.trim());
    if (!success) setStep('error');
  };

  const handleClose = () => {
    setCode('');
    setStep('input');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <TouchableWithoutFeedback onPress={step === 'input' ? handleClose : undefined}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              {step === 'input' ? (
                <View style={styles.card}>
                  <Text style={styles.title}>초대코드</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="초대코드를 입력하세요"
                    placeholderTextColor="#a3a29c"
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="characters"
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.button, !code.trim() && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                    disabled={!code.trim()}
                  >
                    <Text style={styles.buttonText}>입장하기</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>존재하지 않는 모임입니다.</Text>
                  <Text style={styles.errorMessage}>{'모임 코드를 다시 확인해주세요'}</Text>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => setStep('input')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>확인</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  errorCard: {
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 26,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 13.5,
    color: '#8a8a86',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    height: 47,
    borderWidth: 1,
    borderColor: '#e2e5ea',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  button: {
    height: 49,
    backgroundColor: '#403a6b',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  buttonDisabled: {
    backgroundColor: '#a3a29c',
  },
  buttonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#fff',
  },
});
