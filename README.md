# 모아셈 - App

모임·동아리 공금 운영 서비스 프론트엔드 (React Native / Expo)

## 개요

자세한 서비스 기획은 백엔드 레포 또는 `모아셈_최종_기획안_v1.0` 참고.

## 기술 스택

- React Native (Expo)
- TypeScript
- React Navigation
- Zustand
- axios

## 시작하기

```bash
npm install
npx expo start
```

Expo Go 앱으로 QR코드 스캔하거나, `npm run android` / `npm run ios`로 실행.

## 문서

- [개발 컨벤션](./docs/CONVENTION.md) — 폴더 구조, 네이밍, Git 전략

## 폴더 구조

```
src/
├── screens/{auth,group,event,spending,report}
├── api/{auth,group,event,spending,report}
├── components/
├── navigation/
├── hooks/
├── store/
├── types/
└── constants/
```

자세한 설명은 [컨벤션 문서](./docs/CONVENTION.md#2-폴더-구조) 참고.
