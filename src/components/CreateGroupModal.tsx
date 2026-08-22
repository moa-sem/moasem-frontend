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
import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<string>; // 초대코드 반환
};

export default function CreateGroupModal({ visible, onClose, onCreate }: Props) {
  const [step, setStep] = useState<'create' | 'invite'>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    const inviteCode = await onCreate(name.trim());
    setCode(inviteCode);
    setStep('invite');
  };

  const handleClose = () => {
    setStep('create');
    setName('');
    setCode('');
    onClose();
  };

  const handleCopy = () => {
    Clipboard.setStringAsync(code);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <TouchableWithoutFeedback onPress={step === 'create' ? handleClose : undefined}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.card}>
                {step === 'create' ? (
                  <>
                    <Text style={styles.title}>모임 생성</Text>
                    <View style={styles.field}>
                      <Text style={styles.label}>모임 이름</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="모임 이름을 입력하세요"
                        placeholderTextColor="#a3a29c"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.button, !name.trim() && styles.buttonDisabled]}
                      onPress={handleCreate}
                      activeOpacity={0.8}
                      disabled={!name.trim()}
                    >
                      <Text style={styles.buttonText}>생성하기</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.title}>모임이 생성됐어요</Text>
                    <Text style={styles.subtitle}>아래 초대코드로 친구를 초대해보세요</Text>
                    <View style={styles.codeBox}>
                      <Text style={styles.codeText}>{code}</Text>
                      <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.7}>
                        <Feather name="copy" size={16} color="#8a8a86" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={handleClose} activeOpacity={0.8}>
                      <Text style={styles.buttonText}>완료</Text>
                    </TouchableOpacity>
                  </>
                )}
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
    marginBottom: 26,
  },
  subtitle: {
    fontSize: 14,
    color: '#8a8a86',
    marginBottom: 24,
    marginTop: -14,
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
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#fff',
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
  buttonDisabled: {
    backgroundColor: '#a3a29c',
    opacity: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
