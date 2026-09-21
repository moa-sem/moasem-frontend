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
import type { ApiError } from '../types/common';

type Props = {
  visible: boolean;
  /** 반려할 지출의 신청자. 누구 것을 반려하는지 확인용으로 보여준다. */
  applicantName: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
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
  return '지출을 반려하지 못했습니다. 다시 시도해주세요.';
};

/**
 * 지출 반려 사유 입력.
 *
 * 사유 없이는 반려할 수 없다. 반려는 되돌릴 수 없고 신청자는 같은 건을 고칠 수 없어,
 * 무엇이 문제였는지 남기지 않으면 다시 신청할 방법을 알 수 없다. 서버도 빈 사유를 거부한다.
 */
export default function RejectSpendingModal({ visible, applicantName, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
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
    setReason('');
    setFieldError(null);
    setApiErrorMessage(null);
  };

  const handleClose = () => {
    if (isSubmittingRef.current) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;

    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setFieldError('반려 사유를 입력해주세요.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setApiErrorMessage(null);

    try {
      await onSubmit(normalizedReason);
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
                <Text style={styles.title}>지출 반려</Text>
                <Text style={styles.description}>
                  {applicantName}님의 지출을 반려합니다. 반려하면 되돌릴 수 없습니다.
                </Text>

                <View style={styles.field}>
                  <Text style={styles.label}>반려 사유</Text>
                  <TextInput
                    style={[styles.input, fieldError && styles.inputError]}
                    placeholder="무엇이 문제인지 적어주세요"
                    placeholderTextColor="#a3a29c"
                    value={reason}
                    onChangeText={(text) => {
                      setReason(text);
                      setFieldError(null);
                    }}
                    editable={!isSubmitting}
                    multiline
                    autoFocus
                  />
                  {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                </View>

                {apiErrorMessage && <Text style={styles.apiError}>{apiErrorMessage}</Text>}

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.rejectButtonText}>
                      {isSubmitting ? '반려 중...' : '반려하기'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
  description: {
    fontSize: 13,
    color: '#8a8a86',
    lineHeight: 19,
    marginBottom: 22,
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
    borderWidth: 1,
    borderColor: '#e2e5ea',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2b2b28',
    minHeight: 84,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#c85c5c',
  },
  fieldError: {
    fontSize: 12,
    color: '#c85c5c',
  },
  apiError: {
    fontSize: 12.5,
    color: '#c85c5c',
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f3f5',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5c5c58',
  },
  rejectButton: {
    backgroundColor: '#c85c5c',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
