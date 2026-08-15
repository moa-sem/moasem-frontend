import axios from 'axios';

// TODO: 환경별 baseURL 분리 (local/dev/prod) - .env 또는 app.config.ts 활용 예정
const BASE_URL = 'http://localhost:8080';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// TODO: 인증 토큰 인터셉터 추가 (로그인 구현 후)
// api.interceptors.request.use((config) => { ... });

// TODO: 공통 에러 핸들링 인터셉터 추가
// api.interceptors.response.use((res) => res, (error) => { ... });
