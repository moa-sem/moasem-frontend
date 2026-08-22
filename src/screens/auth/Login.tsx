import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import type { RootStackParamList } from '../../navigation/RootNavigator';

WebBrowser.maybeCompleteAuthSession();

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(60)).current;

  // TODO: Google Cloud Console에서 클라이언트 ID 발급 후 입력
  const [, response, promptAsync] = Google.useAuthRequest({
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  });

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(buttonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(buttonTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      // TODO: 백엔드 로그인 API 호출 후 navigation.replace('Home')
      navigation.replace('Home');
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoSection, { opacity: logoOpacity }]}>
        <View style={styles.logoMark}>
          <View style={styles.circleLeft} />
          <View style={styles.circleRight} />
        </View>
        <Text style={styles.title}>모아셈</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.buttonSection,
          { paddingBottom: insets.bottom + 24, opacity: buttonOpacity, transform: [{ translateY: buttonTranslateY }] },
        ]}
      >
        <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()} activeOpacity={0.8}>
          <Image source={require('../../../assets/google_logo.png')} style={styles.googleLogo} resizeMode="contain" />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
        {/* TODO: 개발용 임시 버튼 - 배포 전 제거 */}
        <TouchableOpacity onPress={() => navigation.replace('Home')} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: '#a3a29c', fontSize: 13 }}>홈으로 바로 이동 (개발용)</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const CIRCLE_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f3',
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  logoMark: {
    width: 88,
    height: CIRCLE_SIZE,
    position: 'relative',
  },
  circleLeft: {
    position: 'absolute',
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#403a6b',
  },
  circleRight: {
    position: 'absolute',
    left: 32,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#e8a87c',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
  },
  buttonSection: {
    paddingHorizontal: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 51,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e5ea',
    backgroundColor: '#fff',
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3c4043',
  },
});
