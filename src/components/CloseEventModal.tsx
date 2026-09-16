import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { EventClosePreviewResponse } from '../api/event';

type Props = {
  visible: boolean;
  preview: EventClosePreviewResponse | null;
  isPreviewLoading: boolean;
  isClosing: boolean;
  errorMessage?: string;
  onClose: () => void;
  onParticipantCountChange: () => void;
  onPreview: (participantCount: number) => Promise<void>;
  onConfirm: (participantCount: number) => Promise<void>;
};

const formatWon = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

const parseParticipantCount = (value: string): number | null => {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
};

export default function CloseEventModal({
  visible,
  preview,
  isPreviewLoading,
  isClosing,
  errorMessage,
  onClose,
  onParticipantCountChange,
  onPreview,
  onConfirm,
}: Props) {
  const [count, setCount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const isBusy = isPreviewLoading || isClosing;
  const participantCount = parseParticipantCount(count);
  const hasCurrentPreview = preview !== null && preview.participantCount === participantCount;

  useEffect(() => {
    if (!visible) {
      setCount('');
      setValidationError(null);
    }
  }, [visible]);

  const handleCountChange = (value: string) => {
    setCount(value);
    setValidationError(null);
    onParticipantCountChange();
  };

  const validateParticipantCount = () => {
    const parsed = parseParticipantCount(count);
    if (parsed === null) {
      setValidationError('참여 인원은 1 이상의 정수로 입력해주세요.');
      return null;
    }
    setValidationError(null);
    return parsed;
  };

  const handlePreview = async () => {
    const parsed = validateParticipantCount();
    if (parsed === null || isBusy) return;
    await onPreview(parsed);
  };

  const handleConfirm = async () => {
    const parsed = validateParticipantCount();
    if (parsed === null || !hasCurrentPreview || isBusy) return;
    await onConfirm(parsed);
  };

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.card}>
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <Text style={styles.title}>행사 마감</Text>
                  <Text style={styles.subtitle}>참여 인원을 확인한 뒤 최종 예산을 미리 확인해주세요.</Text>

                  <View style={styles.field}>
                    <Text style={styles.label}>참여 인원 수</Text>
                    <TextInput
                      style={[styles.input, validationError && styles.inputError]}
                      placeholder="참여 인원 수를 입력하세요"
                      placeholderTextColor="#a3a29c"
                      value={count}
                      onChangeText={handleCountChange}
                      keyboardType="number-pad"
                      editable={!isBusy}
                      autoFocus
                    />
                    {validationError && <Text style={styles.validationError}>{validationError}</Text>}
                  </View>

                  <TouchableOpacity
                    style={[styles.previewButton, isBusy && styles.buttonDisabled]}
                    onPress={handlePreview}
                    activeOpacity={0.8}
                    disabled={isBusy}
                  >
                    {isPreviewLoading ? (
                      <ActivityIndicator color="#403a6b" />
                    ) : (
                      <Text style={styles.previewButtonText}>마감 정보 확인</Text>
                    )}
                  </TouchableOpacity>

                  {preview && hasCurrentPreview && (
                    <View style={styles.previewCard}>
                      <Text style={styles.previewTitle}>마감 미리보기</Text>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>참여 인원</Text>
                        <Text style={styles.previewValue}>{preview.participantCount}명</Text>
                      </View>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>최초 예산</Text>
                        <Text style={styles.previewValue}>{formatWon(preview.initialBudget)}</Text>
                      </View>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>추가 예산</Text>
                        <Text style={styles.previewValue}>{formatWon(preview.additionalBudget)}</Text>
                      </View>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>총 예산</Text>
                        <Text style={styles.previewValue}>{formatWon(preview.totalBudget)}</Text>
                      </View>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>승인 지출</Text>
                        <Text style={styles.previewValue}>{formatWon(preview.approvedSpending)}</Text>
                      </View>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>잔여 예산</Text>
                        <Text style={styles.previewValue}>{formatWon(preview.remainingBudget)}</Text>
                      </View>
                    </View>
                  )}

                  {errorMessage && <Text style={styles.apiError}>{errorMessage}</Text>}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton, isBusy && styles.buttonDisabled]}
                      onPress={handleClose}
                      activeOpacity={0.8}
                      disabled={isBusy}
                    >
                      <Text style={styles.cancelButtonText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.confirmButton,
                        (!hasCurrentPreview || isBusy) && styles.confirmButtonDisabled,
                      ]}
                      onPress={handleConfirm}
                      activeOpacity={0.8}
                      disabled={!hasCurrentPreview || isBusy}
                    >
                      {isClosing ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.confirmButtonText}>마감 확정</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
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
    maxHeight: '88%',
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
    marginBottom: 16,
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
  inputError: {
    borderColor: '#c85c5c',
  },
  validationError: {
    fontSize: 12,
    color: '#c85c5c',
  },
  previewButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#403a6b',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#403a6b',
  },
  previewCard: {
    backgroundColor: '#f4f4f3',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2b2b28',
    marginBottom: 2,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  previewLabel: {
    fontSize: 13,
    color: '#8a8a86',
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2b2b28',
  },
  apiError: {
    fontSize: 13,
    color: '#c85c5c',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#eef0f2',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b2b28',
  },
  confirmButton: {
    backgroundColor: '#403a6b',
  },
  confirmButtonDisabled: {
    backgroundColor: '#a3a29c',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
