import { useEffect, useRef, useState } from 'react';
import {
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
import type { CreateEventRequest } from '../api/event';
import type { ApiError } from '../types/common';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (request: CreateEventRequest) => Promise<void>;
};

type FormField = 'title' | 'startAt' | 'endAt' | 'initialBudget';
type FieldErrors = Partial<Record<FormField, string>>;

type ParsedDateTime = {
  apiValue: string;
};

const formatDateTimeInput = (text: string) => {
  const digits = text.replace(/[^0-9]/g, '').slice(0, 12);
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  const hour = digits.slice(8, 10);
  const minute = digits.slice(10, 12);

  if (digits.length <= 4) return year;
  if (digits.length <= 6) return `${year}-${month}`;
  if (digits.length <= 8) return `${year}-${month}-${day}`;
  if (digits.length <= 10) return `${year}-${month}-${day} ${hour}`;
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

const parseDateTime = (value: string): ParsedDateTime | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (
    year < 1
    || month < 1
    || month > 12
    || day < 1
    || day > daysInMonth[month - 1]
    || hour < 0
    || hour > 23
    || minute < 0
    || minute > 59
  ) {
    return null;
  }

  return { apiValue: `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:00` };
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
  return '행사를 생성하지 못했습니다. 다시 시도해주세요.';
};

export default function CreateEventModal({ visible, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [initialBudget, setInitialBudget] = useState('');
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
    setTitle('');
    setDescription('');
    setStartAt('');
    setEndAt('');
    setInitialBudget('');
    setFieldErrors({});
    setApiErrorMessage(null);
  };

  const handleBudgetChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setInitialBudget(digits.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    setFieldErrors(current => ({ ...current, initialBudget: undefined }));
  };

  const handleClose = () => {
    if (isSubmittingRef.current) return;
    resetForm();
    onClose();
  };

  const validate = () => {
    const errors: FieldErrors = {};
    const normalizedTitle = title.trim();
    const parsedStartAt = parseDateTime(startAt);
    const parsedEndAt = parseDateTime(endAt);
    const budgetText = initialBudget.replace(/,/g, '');
    const budget = Number(budgetText);

    if (!normalizedTitle) errors.title = '행사명을 입력해주세요.';
    else if (normalizedTitle.length > 100) errors.title = '행사명은 100자 이하여야 합니다.';

    if (!parsedStartAt) errors.startAt = '실제 유효한 시작 일시를 입력해주세요.';
    if (!parsedEndAt) errors.endAt = '실제 유효한 종료 일시를 입력해주세요.';
    if (parsedStartAt && parsedEndAt && parsedEndAt.apiValue <= parsedStartAt.apiValue) {
      errors.endAt = '종료 일시는 시작 일시보다 늦어야 합니다.';
    }

    if (!budgetText) errors.initialBudget = '최초 예산을 입력해주세요.';
    else if (!Number.isSafeInteger(budget) || budget < 0) {
      errors.initialBudget = '최초 예산은 0 이상의 정수여야 합니다.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !parsedStartAt || !parsedEndAt) return null;

    return {
      title: normalizedTitle,
      description: description.trim() || null,
      startAt: parsedStartAt.apiValue,
      endAt: parsedEndAt.apiValue,
      initialBudget: budget,
    } satisfies CreateEventRequest;
  };

  const handleCreate = async () => {
    if (isSubmittingRef.current) return;

    const request = validate();
    if (!request) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setApiErrorMessage(null);

    try {
      await onCreate(request);
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
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.cardContent}
                >
                  <Text style={styles.title}>행사 생성</Text>

                  <View style={styles.field}>
                    <Text style={styles.label}>행사명</Text>
                    <TextInput
                      style={[styles.input, fieldErrors.title && styles.inputError]}
                      placeholder="행사명을 입력하세요"
                      placeholderTextColor="#a3a29c"
                      value={title}
                      onChangeText={(text) => {
                        setTitle(text);
                        setFieldErrors(current => ({ ...current, title: undefined }));
                      }}
                      editable={!isSubmitting}
                      autoFocus
                    />
                    {fieldErrors.title && <Text style={styles.fieldError}>{fieldErrors.title}</Text>}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>설명 (선택)</Text>
                    <TextInput
                      style={[styles.input, styles.descriptionInput]}
                      placeholder="행사 설명을 입력하세요"
                      placeholderTextColor="#a3a29c"
                      value={description}
                      onChangeText={setDescription}
                      editable={!isSubmitting}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>시작 일시</Text>
                    <TextInput
                      style={[styles.input, fieldErrors.startAt && styles.inputError]}
                      placeholder="YYYY-MM-DD HH:mm"
                      placeholderTextColor="#a3a29c"
                      value={startAt}
                      onChangeText={(text) => {
                        setStartAt(formatDateTimeInput(text));
                        setFieldErrors(current => ({ ...current, startAt: undefined }));
                      }}
                      editable={!isSubmitting}
                      keyboardType="number-pad"
                      maxLength={16}
                    />
                    {fieldErrors.startAt && <Text style={styles.fieldError}>{fieldErrors.startAt}</Text>}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>종료 일시</Text>
                    <TextInput
                      style={[styles.input, fieldErrors.endAt && styles.inputError]}
                      placeholder="YYYY-MM-DD HH:mm"
                      placeholderTextColor="#a3a29c"
                      value={endAt}
                      onChangeText={(text) => {
                        setEndAt(formatDateTimeInput(text));
                        setFieldErrors(current => ({ ...current, endAt: undefined }));
                      }}
                      editable={!isSubmitting}
                      keyboardType="number-pad"
                      maxLength={16}
                    />
                    {fieldErrors.endAt && <Text style={styles.fieldError}>{fieldErrors.endAt}</Text>}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>최초 예산</Text>
                    <View style={[styles.inputRow, fieldErrors.initialBudget && styles.inputError]}>
                      <TextInput
                        style={styles.inputFlex}
                        placeholder="최초 예산을 입력하세요"
                        placeholderTextColor="#a3a29c"
                        value={initialBudget}
                        onChangeText={handleBudgetChange}
                        editable={!isSubmitting}
                        keyboardType="number-pad"
                      />
                      {initialBudget ? <Text style={styles.inputSuffix}>원</Text> : null}
                    </View>
                    {fieldErrors.initialBudget && (
                      <Text style={styles.fieldError}>{fieldErrors.initialBudget}</Text>
                    )}
                  </View>

                  {apiErrorMessage && <Text style={styles.apiError}>{apiErrorMessage}</Text>}

                  <TouchableOpacity
                    style={[styles.button, isSubmitting && styles.buttonDisabled]}
                    onPress={handleCreate}
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.buttonText}>{isSubmitting ? '생성 중...' : '생성하기'}</Text>
                  </TouchableOpacity>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  cardContent: {
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 26,
  },
  field: {
    gap: 8,
    marginBottom: 18,
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
  descriptionInput: {
    height: 82,
    paddingTop: 14,
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
