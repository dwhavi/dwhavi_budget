#!/bin/bash

# 에러 발생 시 진행 중단
set -e

TARGET_DIR="/opt/budget-app"

echo "🚀 로컬 빌드 및 $TARGET_DIR 폴더 반영을 시작합니다..."

# 스크립트가 위치한 개발 폴더로 이동
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "📦 1/5. 로컬 패키지 의존성 설치 중..."
npm run install:all

echo "🏗️ 2/5. 클라이언트(프론트엔드) 빌드 중..."
cd client
npm run build
cd ..

echo "🏗️ 3/5. 서버(백엔드) 빌드 중..."
cd server
npm run build
cd ..

echo "🚚 4/5. 빌드 결과물을 $TARGET_DIR 에 복사하는 중..."
# 대상 폴더가 없으면 생성하고, 현재 사용자에게 폴더 권한 부여 (필요 시 sudo 비밀번호 요구)
sudo mkdir -p "$TARGET_DIR"
sudo chown -R $USER:$USER "$TARGET_DIR"

# rsync를 사용해 변경된 파일만 동기화 (기존 DB 데이터, .git, 로컬 모듈 등 불필요한 폴더는 제외)
rsync -avz --exclude '.git' --exclude 'node_modules' --exclude 'server/node_modules' --exclude 'client/node_modules' --exclude 'data' ./ "$TARGET_DIR/"

echo "📦 5/5. 운영 폴더($TARGET_DIR) 내 백엔드 패키지 재단일화 적용..."
# 복사된 운영 폴더의 서버 디렉토리로 이동하여 백엔드 구동용 패키지를 설치합니다
cd "$TARGET_DIR/server"
npm install --omit=dev  # 프로덕션 운영에 필요한 패키지만 가볍게 설치

echo "🔄 6/6. PM2 서비스 재시작 중..."
# 프로젝트가 PM2 어디에 위치하는지에 따라 맞게 구동
# (권한에 따라 sudo 유무가 작동할 수 있도록 fallback 처리)
pm2 restart all || sudo pm2 restart all || echo "⚠️ PM2 재시작 실패"

echo "🎉 $TARGET_DIR 로 최종 반영 및 서비스 재시작이 완료되었습니다!"
