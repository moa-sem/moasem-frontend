import { useEffect, useRef, useState } from 'react';
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
import type { CreateBudgetAdditionRequest } from '../api/event';
import type { ApiError } from '../types/common';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (request: CreateBudgetAdditionRequest) => Promise<void>;
};

type FieldErrors = {
  amount?: string;
  reason?: string;
};

const getApiErrorMessage = (error: unknown) => {
  if (
    typeof error === 'object'
    && error !== null
    && 'message' in error
    && typeof error.message === 'string'
  ) {
    return (error as ApiError).message;
  }
  return '추가 예산을 등록하지 못했습니다. 다시 시도해주세요.';
};

export default function BudgetAdditionModal({ visible, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMountedRef = useRef(true);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resetForm = () => {
    setAmount('');
    setReason('');
    setFieldErrors({});
    setApiErrorMessage(null);
  };

  const handleAmountChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setAmount(digits.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    setFieldErrors(current => ({ ...current, amount: undefined }));
  };

  const handleClose = () => {
    if (isSubmittingRef.current) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;

    const errors: FieldErrors = {};
    const amountText = amount.replace(/,/g, '');
    const normalizedAmount = Number(amountText);
    const normalizedReason = reason.trim();

    if (!amountText || !Number.isSafeInteger(normalizedAmount) || normalizedAmount <= 0) {
      errors.amount = '추가 금액은 0보다 큰 정수여야 합니다.';
    }
    if (!normalizedReason) errors.reason = '추가 사유를 입력해주세요.';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setApiErrorMessage(null);

    try {
      await onSubmit({ amount: normalizedAmount, reason: normalizedReason });
      if (isMountedRef.current) resetForm();
    } catch (error: unknown) {
      if (isMountedRef.current) setApiErrorMessage(getApiErrorMessage(error));
    } finally {
      isSubmittingRef.current = false;
      if (isMountedRef.current) setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.card}>
                <Text style={styles.title}>추가 예산 등록</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>추가 금액</Text>
                  <View style={[styles.inputRow, fieldErrors.amount && styles.inputError]}>
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="추가 금액을 입력하세요"
                      placeholderTextColor="#a3a29c"
                      value={amount}
                      onChangeText={handleAmountChange}
                      editable={!isSubmitting}
                      keyboardType="number-pad"
                      autoFocus
                    />
                    {amount ? <Text style={styles.inputSuffix}>원</Text> : null}
                  </View>
                  {fieldErrors.amount && <Text style={styles.fieldError}>{fieldErrors.amount}</Text>}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>추가 사유</Text>
                  <TextInput
                    style={[styles.input, fieldErrors.reason && styles.inputError]}
                    placeholder="추가 사유를 입력하세요"
                    placeholderTextColor="#a3a29c"
                    value={reason}
                    onChangeText={(text) => {
                      setReason(text);
                      setFieldErrors(current => ({ ...current, reason: undefined }));
                    }}
                    editable={!isSubmitting}
                  />
                  {fieldErrors.reason && <Text style={styles.fieldError}>{fieldErrors.reason}</Text>}
                </View>

                {apiErrorMessage && <Text style={styles.apiError}>{apiErrorMessage}</Text>}

                <TouchableOpacity
                  style={[styles.button, isSubmitting && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                >
                  <Text style={styles.buttonText}>{isSubmitting ? '등록 중...' : '등록하기'}</Text>
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
    marginBottom: 20,
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
  inputRow: {
    height: 47,
    borderWidth: 1,
    borderColor: '#e2e5ea',
    borderRadius: 12,
    paddingHorizontal: 24,
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
  inputError: {
    borderColor: '#c85c5c',
  },
  fieldError: {
    fontSize: 12,
    color: '#c85c5c',
  },
  apiError: {
    marginBottom: 14,
    fontSize: 13,
    color: '#c85c5c',
    textAlign: 'center',
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
