# 모아셈 프론트엔드 컨벤션

작성일 2026-08-10 · 대상: 프론트엔드 팀 전원
기준 문서: `모아셈 최종 기획안 v1.0`, 백엔드 `docs/CONVENTION.md`

이 문서는 착수 시점 기준이며 팀 논의로 계속 갱신한다.

---

## 1. 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | React Native (Expo) | Expo Go / EAS Build 사용 |
| 언어 | TypeScript | |
| 네비게이션 | React Navigation (Native Stack) | |
| 상태 관리 | Zustand | 전역 상태, Redux 대비 보일러플레이트 적음 |
| HTTP 클라이언트 | axios | 공통 인스턴스 `src/api/client.ts` |
| 인증 | expo-auth-session (기본) → `@react-native-google-signin/google-signin` 전환 검토 | 구글 로그인 전용 라이브러리가 공식 권장, EAS Build 필요 |

---

## 2. 폴더 구조

RN/Expo 관례상 **기술 레이어 우선 + 도메인 하위 분리**를 사용한다. 백엔드처럼 도메인을 최상위로 두지 않는다
(네비게이션/화면 중심 개발 흐름과 안 맞기 때문).

```
src/
├── screens/          # 화면 컴포넌트, 도메인별 하위 폴더
│   ├── auth/
│   ├── group/
│   ├── event/
│   ├── spending/
│   └── report/
├── api/                # axios 함수, 도메인별 하위 폴더
│   ├── client.ts     # 공통 axios 인스턴스
│   ├── auth/
│   ├── group/
│   ├── event/
│   ├── spending/
│   └── report/
├── components/    # 재사용 UI 컴포넌트 (도메인 무관 공통 요소)
├── navigation/    # Stack/Tab 네비게이터 설정
├── hooks/            # 커스텀 훅
├── store/            # zustand 전역 상태
├── types/            # 공통 타입 (백엔드 enum과 1:1 매칭 유지)
└── constants/    # 색상, 라벨 등 상수
```

**도메인 폴더 배치 기준**: 화면·API가 기획안 5개 핵심 흐름(auth/group/event/spending/report) 중
어디에 속하는지로 판단한다. 여러 도메인에 걸치면(예: 마감·보고서 화면이 event와 report 둘 다 관련)
주된 흐름 기준으로 하나만 선택하고 헷갈리면 팀 논의.

---

## 3. 네이밍 컨벤션

| 유형 | 규칙 | 예시 |
|---|---|---|
| 화면 컴포넌트 | `{도메인}{화면명}Screen` | `EventDetailScreen`, `SpendingRequestScreen` |
| 공통 컴포넌트 | 파스칼케이스, 역할 명확히 | `ConfirmModal`, `ReceiptImagePicker` |
| API 함수 | 동사 시작, `{도메인}Api.ts` 파일에 모음 | `createEvent()`, `approveSpending()` |
| 타입/인터페이스 | 파스칼케이스, Request/Response 접미사 | `CreateEventRequest`, `EventDetailResponse` |
| 커스텀 훅 | `use{기능}` | `useAuth()`, `useSpendingForm()` |
| zustand 스토어 | `use{도메인}Store` | `useAuthStore()` |

파일명은 컴포넌트/함수명과 동일하게 (`EventDetailScreen.tsx`, `useAuth.ts`).

---

## 4. 코드 스타일

- 함수형 컴포넌트 + Hooks만 사용. 클래스 컴포넌트 사용하지 않는다.
- Props 타입은 컴포넌트 파일 상단에 `interface {컴포넌트명}Props`로 명시.
- 모든 금액은 `number`(정수, 원 단위)로 다루고 절대 소수점 연산 하지 않는다 — 백엔드와 동일 원칙.
- API 응답 타입은 `src/types`에 정의하고 백엔드 DTO 변경 시 함께 갱신한다.
- 스타일링 방식(StyleSheet vs NativeWind 등)은 팀 논의 후 확정 (1주차 목표).

---

## 5. Git 컨벤션

백엔드와 동일한 규칙을 사용한다.

- 브랜치: `main` (배포) ← `develop` (통합) ← `feature/{도메인}-{작업명}`, `fix/{도메인}-{버그명}`
- 커밋: `{type}: {요약}` — `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`
- PR: 작은 단위, 1인 이상 리뷰 승인 후 squash merge

---

## 6. 백엔드 연동 시 주의사항

- 백엔드 enum(`SpendingTag`, `SpendingStatus`, `EventStatus`, `GroupRole`) 값은
  `src/types/common.ts`에서 관리하며, 백엔드 변경 시 반드시 함께 갱신한다.
- 모든 변경 API 호출 전, 화면에서 버튼을 숨기는 것과 별개로 백엔드가 권한을 재검증한다는 전제로 개발한다
  (프론트 권한 체크는 UX용이지 보안 수단이 아님).
- 증빙 이미지는 JPG/PNG 1장만 허용 — 업로드 전 클라이언트 단에서도 확장자/용량 1차 검증한다.
