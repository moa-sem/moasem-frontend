import { useState } from 'react';
import {
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import type { EvidenceFile } from '../api/spending/uploadEvidenceFile';
import type { NewSpending } from '../hooks/useSpendings';
import { SPENDING_TAGS, SPENDING_TAG_LABEL, type SpendingTag } from '../types/common';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 서버가 허용하는 증빙 형식. 올린 뒤 거부당하지 않도록 고르는 단계에서 먼저 막는다. */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

const mimeTypeOf = (asset: ImagePicker.ImagePickerAsset) => {
  if (asset.mimeType) return asset.mimeType;
  // 안드로이드 갤러리는 mimeType을 비워 보낼 때가 있다. 확장자로 채운다.
  return /\.png$/i.test(asset.uri) ? 'image/png' : 'image/jpeg';
};

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

/**
 * 지출일 선택.
 *
 * 시각은 고르지 않는다. 서버가 지출일을 날짜까지만 보관하기 때문이다.
 * 시간을 입력받으면 사용자가 고른 값이 저장되지 않은 채 사라진다.
 */
function DateSheet({ visible, onClose, onConfirm }: {
  visible: boolean;
  onClose: () => void;
  /** yyyy-MM-dd */
  onConfirm: (spentOn: string) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [day, setDay] = useState(today.getDate());

  const flatDays = getCalendarDays(year, month);
  // 7개씩 row로 분리
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < flatDays.length; i += 7) {
    const row = flatDays.slice(i, i + 7);
    while (row.length < 7) row.push(null);
    weeks.push(row);
  }

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const handleConfirm = () => {
    onConfirm(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  };

  if (!visible) return null;

  return (
    <View style={dt.backdrop}>
      {/* 백드롭 탭 시 닫힘 — sheet와 별도 레이어 */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>
      {/* 시트는 일반 View — ScrollView 제스처 간섭 없음 */}
      <View style={dt.sheet}>
            <View style={dt.handle} />
            <Text style={dt.title}>날짜 선택</Text>

            <View style={dt.monthRow}>
              <TouchableOpacity onPress={prevMonth} style={dt.navBtn}>
                <Text style={dt.navArrow}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={dt.monthLabel}>{year}년 {month + 1}월</Text>
              <TouchableOpacity onPress={nextMonth} style={dt.navBtn}>
                <Text style={dt.navArrow}>{'>'}</Text>
              </TouchableOpacity>
            </View>

            <View style={dt.weekRow}>
              {WEEKDAYS.map((w, i) => (
                <Text key={w} style={[dt.weekDay, i === 0 && dt.sun, i === 6 && dt.sat]}>{w}</Text>
              ))}
            </View>

            <View style={dt.daysGrid}>
              {weeks.map((row, rowIdx) => (
                <View key={rowIdx} style={dt.weekRow2}>
                  {row.map((d, col) => {
                    const isSelected = d === day;
                    return (
                      <TouchableOpacity
                        key={col}
                        style={[dt.dayCell, isSelected && dt.dayCellSelected]}
                        onPress={() => d && setDay(d)}
                        disabled={!d}
                      >
                        <Text style={[dt.dayText, col === 0 && dt.sun, col === 6 && dt.sat, isSelected && dt.dayTextSelected]}>
                          {d ?? ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            <TouchableOpacity style={dt.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={dt.confirmBtnText}>확인</Text>
            </TouchableOpacity>
      </View>
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: NewSpending) => Promise<void>;
};

export default function UsageRegistrationModal({ visible, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [spentOn, setSpentOn] = useState('');
  const [tag, setTag] = useState<SpendingTag>('MEAL');
  const [otherDetail, setOtherDetail] = useState('');
  const [receipt, setReceipt] = useState<EvidenceFile | null>(null);
  const [receiptDropdownVisible, setReceiptDropdownVisible] = useState(false);
  const [dateVisible, setDateVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 고른 이미지를 업로드에 필요한 형태로 바꾼다.
   *
   * 사진 선택기가 용량을 비워 줄 때가 있어 파일에서 직접 읽는다. 서버가 0 이하를 거부하므로
   * 여기서 못 채우면 올리기 전에 막는다.
   */
  const toEvidence = (asset: ImagePicker.ImagePickerAsset): EvidenceFile | null => {
    const mimeType = mimeTypeOf(asset);
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      setError('영수증은 JPG 또는 PNG 이미지만 올릴 수 있습니다.');
      return null;
    }

    const fileSize = asset.fileSize ?? new File(asset.uri).size ?? 0;
    if (fileSize <= 0) {
      setError('이미지 정보를 읽지 못했습니다. 다른 사진으로 다시 시도해주세요.');
      return null;
    }

    return { uri: asset.uri, mimeType, fileSize };
  };

  const pickFromGallery = async () => {
    setReceiptDropdownVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) return;

    setError(null);
    const evidence = toEvidence(result.assets[0]);
    if (evidence) setReceipt(evidence);
  };

  const pickFromCamera = async () => {
    setReceiptDropdownVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;

    setError(null);
    const evidence = toEvidence(result.assets[0]);
    if (evidence) setReceipt(evidence);
  };

  // 증빙은 선택이 아니라 필수다. 기타 태그는 무엇에 썼는지가 사유만으로는 남지 않아 상세를 함께 받는다.
  const canSubmit = Boolean(
    amount.trim()
    && description.trim()
    && spentOn
    && receipt
    && (tag !== 'OTHER' || otherDetail.trim()),
  );

  const handleAmountChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setAmount(digits ? Number(digits).toLocaleString('ko-KR') : '');
  };

  const handleClose = () => {
    if (isSubmitting) return;

    setAmount('');
    setDescription('');
    setSpentOn('');
    setTag('MEAL');
    setOtherDetail('');
    setReceipt(null);
    setReceiptDropdownVisible(false);
    setDateVisible(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    // 두 번 누르면 증빙이 두 번 올라가고 지출도 두 건이 된다.
    if (!canSubmit || isSubmitting || !receipt) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        amount: Number(amount.replace(/,/g, '')),
        reason: description.trim(),
        spentOn,
        tag,
        otherDetail: tag === 'OTHER' ? otherDetail.trim() : null,
        evidence: receipt,
      });
      setIsSubmitting(false);
      handleClose();
    } catch (submitError: unknown) {
      const apiError = submitError as { message?: string } | undefined;
      setError(apiError?.message ?? '지출을 신청하지 못했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      {/* 루트 View: KeyboardAvoidingView + DateSheet 겹침 */}
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.overlay}>
              <TouchableWithoutFeedback>
                <View style={styles.card}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.cardContent}
                  >
                  <Text style={styles.title}>예산 사용</Text>

                  {/* 영수증 첨부 */}
                  <View style={styles.receiptWrapper}>
                    {receipt ? (
                      <TouchableOpacity onPress={() => setReceiptDropdownVisible(v => !v)} activeOpacity={0.8}>
                        <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} resizeMode="cover" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.receiptBtn}
                        onPress={() => setReceiptDropdownVisible(v => !v)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.receiptBtnText}>영수증 첨부 (필수)</Text>
                      </TouchableOpacity>
                    )}
                    {receiptDropdownVisible && (
                      <View style={styles.receiptDropdown}>
                        <TouchableOpacity
                          style={styles.receiptOption}
                          onPress={pickFromGallery}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.receiptOptionText}>사진 보관함에서 선택</Text>
                        </TouchableOpacity>
                        <View style={styles.receiptDivider} />
                        <TouchableOpacity
                          style={styles.receiptOption}
                          onPress={pickFromCamera}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.receiptOptionText}>카메라로 촬영</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* 사용 금액 */}
                  <View style={styles.field}>
                    <Text style={styles.label}>사용 금액</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.inputFlex}
                        placeholder="사용 금액을 입력하세요"
                        placeholderTextColor="#a3a29c"
                        value={amount}
                        onChangeText={handleAmountChange}
                        keyboardType="numeric"
                      />
                      {!!amount && <Text style={styles.inputSuffix}>원</Text>}
                    </View>
                  </View>

                  {/* 설명 */}
                  <View style={styles.field}>
                    <Text style={styles.label}>설명</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="설명을 입력하세요"
                      placeholderTextColor="#a3a29c"
                      value={description}
                      onChangeText={setDescription}
                    />
                  </View>

                  {/* 날짜 */}
                  <View style={styles.field}>
                    <Text style={styles.label}>날짜</Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setDateVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={spentOn ? styles.dateText : styles.datePlaceholder}>
                        {spentOn ? spentOn.replace(/-/g, '.') : '날짜 선택'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 태그 */}
                  <View style={styles.field}>
                    <Text style={styles.label}>태그</Text>
                    <View style={styles.tagRow}>
                      {SPENDING_TAGS.map(t => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.tag, tag === t && styles.tagActive]}
                          onPress={() => setTag(t)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.tagText, tag === t && styles.tagTextActive]}>
                            {SPENDING_TAG_LABEL[t]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 기타는 라벨만으로 무엇에 썼는지 남지 않는다. 결산 보고서에도 이 값이 함께 찍힌다. */}
                  {tag === 'OTHER' && (
                    <View style={styles.field}>
                      <Text style={styles.label}>기타 상세</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="어떤 지출인지 적어주세요"
                        placeholderTextColor="#a3a29c"
                        value={otherDetail}
                        onChangeText={setOtherDetail}
                      />
                    </View>
                  )}

                  {error && <Text style={styles.errorText}>{error}</Text>}

                  <TouchableOpacity
                    style={[styles.submitBtn, (!canSubmit || isSubmitting) && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                    disabled={!canSubmit || isSubmitting}
                  >
                    <Text style={styles.submitBtnText}>
                      {isSubmitting ? '제출 중...' : '제출하기'}
                    </Text>
                  </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        {/* DateSheet: KeyboardAvoidingView 바깥에서 absolute로 덮음 */}
        <DateSheet
          visible={dateVisible}
          onClose={() => setDateVisible(false)}
          onConfirm={(value) => { setSpentOn(value); setDateVisible(false); }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  errorText: {
    fontSize: 12.5,
    color: '#c85c5c',
    marginBottom: 12,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 30, 28, 0.45)',
    paddingHorizontal: 22.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '88%',
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
    marginBottom: 20,
  },
  receiptWrapper: {
    marginBottom: 20,
    zIndex: 10,
  },
  receiptBtn: {
    height: 52,
    borderWidth: 1,
    borderColor: '#e2e5ea',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  receiptPreview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
  },
  receiptBtnText: {
    fontSize: 14,
    color: '#a3a29c',
  },
  receiptDropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#e2e5ea',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
  receiptOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  receiptOptionText: {
    fontSize: 14,
    color: '#2b2b28',
    textAlign: 'center',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#f0f0ee',
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
    justifyContent: 'center',
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
  dateText: {
    fontSize: 14,
    color: '#000',
  },
  datePlaceholder: {
    fontSize: 14,
    color: '#a3a29c',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eef0f2',
  },
  tagActive: {
    backgroundColor: '#403a6b',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8a8a86',
  },
  tagTextActive: {
    color: '#fff',
  },
  submitBtn: {
    height: 50,
    backgroundColor: '#403a6b',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#a3a29c',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

const dt = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(30, 30, 28, 0.3)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2b2b28',
    marginBottom: 16,
    marginTop: 8,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 16, color: '#8a8a86' },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b2b28',
    minWidth: 100,
    textAlign: 'center',
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8a8a86',
    paddingVertical: 6,
  },
  sun: { color: '#e06c6c' },
  sat: { color: '#5b8dee' },
  daysGrid: { marginBottom: 12 },
  weekRow2: { flexDirection: 'row' },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  dayCellSelected: { backgroundColor: '#403a6b' },
  dayText: { fontSize: 14, color: '#2b2b28' },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  drumRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0ee',
    paddingTop: 8,
  },
  confirmBtn: {
    height: 50,
    backgroundColor: '#403a6b',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
