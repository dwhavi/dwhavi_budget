# 빠른 시작

## 사전 요구사항

- Node.js 20 이상
- npm 10 이상

## 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd budget-app

# 2. 전체 의존성 설치 (루트 + 서버 + 클라이언트)
npm run install:all

# 3. 환경변수 설정
cp .env.example .env
# .env 파일을 열어 JWT_SECRET, JWT_REFRESH_SECRET을 실제 값으로 변경

# 4. 서버용 .env 파일도 생성
cp .env.example server/.env

# 5. 기본 카테고리 시드
cd server && npm run db:seed && cd ..

# 6. 개발 서버 실행 (서버 + 클라이언트 동시 실행)
npm run dev
```

서버는 `http://localhost:3000`, 클라이언트는 `http://localhost:5173`에서 실행됩니다.

## 개별 실행

```bash
# 서버만 실행
npm run dev:server

# 클라이언트만 실행
npm run dev:client
```

## 프로덕션 빌드

```bash
# 서버 빌드
cd server && npm run build

# 클라이언트 빌드
cd client && npm run build
```

---

## 환경변수

`.env.example`을 복사해서 `.env` 파일을 만들고 필요에 따라 값을 수정하세요.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3000` | 서버 포트 |
| `NODE_ENV` | `development` | 실행 환경 |
| `DB_PATH` | `./data/budget.db` | SQLite 데이터베이스 파일 경로 |
| `JWT_SECRET` | `your-secret-key-here` | 액세스 토큰 서명 키 (**반드시 변경**) |
| `JWT_REFRESH_SECRET` | `your-refresh-secret-key-here` | 리프레시 토큰 서명 키 (**반드시 변경**) |
| `JWT_EXPIRES_IN` | `15m` | 액세스 토큰 만료 시간 |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | 리프레시 토큰 만료 시간 |
| `VITE_API_URL` | `http://localhost:3000/api` | 클라이언트에서 사용하는 API 기본 URL |
