import {
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type UsageItem = {
  id: string;
  name: string;
  amount: string;
  category: string;
  date: string;
  description?: string;
};

type Props = {
  visible: boolean;
  item: UsageItem | null;
  onClose: () => void;
};

export default function UsageDetailModal({ visible, item, onClose }: Props) {
  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* 영수증 사진 */}
              <View style={styles.receiptBox}>
                <Text style={styles.receiptText}>영수증 사진</Text>
              </View>

              {/* 제목 */}
              <Text style={styles.title}>{item.description || '-'}</Text>

              {/* 정보 카드 */}
              <View style={styles.infoCard}>
                <InfoRow label="날짜" value={item.date} />
                <InfoRow label="작성자" value={item.name} />
                <InfoRow label="금액" value={item.amount} />
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>태그</Text>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}># {item.category}</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  receiptBox: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 14,
    backgroundColor: '#eef0f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptText: {
    fontSize: 12.5,
    color: '#a3a29c',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2b2b28',
    marginBottom: 24,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#f2f3f5',
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 12.5,
    color: '#a3a29c',
  },
  rowValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2b2b28',
  },
  tag: {
    backgroundColor: '#dbe8f7',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2b2b28',
  },
});
