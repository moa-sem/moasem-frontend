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
  onCreate: (name: string, budget: string) => Promise<void>;
};

export default function CreateEventModal({ visible, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');

  const canSubmit = name.trim() && budget.trim();

  const handleBudgetChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setBudget(digits ? Number(digits).toLocaleString('ko-KR') : '');
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    await onCreate(name.trim(), budget.replace(/,/g, ''));
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setBudget('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.card}>
                <Text style={styles.title}>행사 생성</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>행사 이름</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="행사 이름을 입력하세요"
                    placeholderTextColor="#a3a29c"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>총 예산</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="총 예산을 입력하세요"
                      placeholderTextColor="#a3a29c"
                      value={budget}
                      onChangeText={handleBudgetChange}
                      keyboardType="numeric"
                    />
                    {budget ? <Text style={styles.inputSuffix}>원</Text> : null}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, !canSubmit && styles.buttonDisabled]}
                  onPress={handleCreate}
                  activeOpacity={0.8}
                  disabled={!canSubmit}
                >
                  <Text style={styles.buttonText}>생성하기</Text>
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
    marginBottom: 26,
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
  inputRow: {
    height: 47,
    borderWidth: 1,
    borderColor: '#e2e5ea',
    borderRadius: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  inputFlex: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  inputSuffix: {
    fontSize: 14,
    color: '#000',
    marginLeft: 2,
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
