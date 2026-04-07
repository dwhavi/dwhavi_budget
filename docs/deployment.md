# Docker 배포

## Dockerfile

프로젝트 루트에 `Dockerfile`을 생성합니다.

```dockerfile
# 빌드 스테이지
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm run install:all

COPY . .
RUN cd server && npm run build
RUN cd client && npm run build

# 프로덕션 스테이지
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/client/dist ./public

RUN npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - DB_PATH=/app/data/budget.db
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - JWT_EXPIRES_IN=15m
      - JWT_REFRESH_EXPIRES_IN=7d
    volumes:
      - app-data:/app/data

volumes:
  app-data:
```

## 실행 명령어

```bash
# 이미지 빌드
docker compose build

# 백그라운드 실행
docker compose up -d

# 로그 확인
docker compose logs -f

# 중지
docker compose down
```

SQLite 데이터는 `app-data` 볼륨에 저장되어 컨테이너를 재시작해도 유지됩니다.

---

## 배포 스크립트 (`deploy.sh`)

프로젝트 루트의 `deploy.sh`를 사용하면 빌드 + 실행을 한 번에 처리할 수 있습니다.

```bash
bash deploy.sh
```
