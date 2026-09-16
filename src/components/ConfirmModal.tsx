import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  errorMessage?: string;
};

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = '확인',
  cancelText,
  onConfirm,
  onCancel,
  isLoading = false,
  disabled = false,
  errorMessage,
}: Props) {
  const isInteractionDisabled = isLoading || disabled;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isInteractionDisabled ? () => undefined : (onCancel ?? onConfirm)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
          <View style={styles.btnRow}>
            {cancelText && (
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel, isInteractionDisabled && styles.btnDisabled]}
                onPress={onCancel}
                activeOpacity={0.8}
                disabled={isInteractionDisabled}
              >
                <Text style={styles.btnCancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnConfirm,
                !cancelText && styles.btnFull,
                isInteractionDisabled && styles.btnDisabled,
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
              disabled={isInteractionDisabled}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnConfirmText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 13.5,
    color: '#8a8a86',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorMessage: {
    fontSize: 13,
    color: '#c85c5c',
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFull: {
    flex: 1,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnCancel: {
    backgroundColor: '#eef0f2',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b2b28',
  },
  btnConfirm: {
    backgroundColor: '#403a6b',
  },
  btnConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
