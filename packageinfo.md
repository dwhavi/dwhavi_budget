---
summary: "개인 가계부 웹 애플리케이션 - 수입/지출 관리, 통계, 예산 관리"
icon: "💰"
tags: ["finance", "budget", "tracker", "dashboard"]
serviceUrl: "https://vmi3199497.contaboserver.net/budget/"
deployType: "both"
serviceStatus: "active"
---

# 사용 기술

## 프론트엔드
- React 19
- Vite 8
- TypeScript
- Tailwind CSS 4

## 백엔드
- Express 5
- TypeScript
- Sequelize 6
- SQLite

## 인증
- JWT (액세스 토큰 15분 + 리프레시 토큰 7일)

## 테스트
- Vitest
- supertest
- React Testing Library

# 프로젝트 구조

```
client/              # 프론트엔드 (React + Vite)
server/              # 백엔드 (Express + TypeScript)
docs/                # 문서
  getting-started.md
  architecture.md
  deployment.md
  testing.md
  knowledge-base.md
data/                # 데이터베이스 파일
```

# 기능

## 거래내역 관리
- 수입/지출 내역 등록, 수정, 삭제, 복구

## 카테고리 관리
- 전역 카테고리 (기본 제공)
- 개인 커스텀 카테고리

## 결제수단 관리
- 신용카드, 체크카드, 현금 등 결제수단 등록

## 고정 지출 관리
- 매월 반복되는 지출 (월세, 구독 등) 자동 추적

## 예산 설정
- 카테고리별 월 예산 설정
- 달성률 확인

## 통계 대시보드
- 월별 추이
- 카테고리별 통계 차트
- 결제수단별 통계

## 서브카테고리 자동완성
- 거래 입력 시 서브카테고리 자동 추천

## 관리자 페이지
- 사용자 관리
- 전역 카테고리 관리
- 시스템 설정

# API

| 기능 | 경로 |
|------|------|
| 인증 | `/api/auth` |
| 거래내역 | `/api/transactions` |
| 카테고리 | `/api/categories` |
| 결제수단 | `/api/payment-methods` |
| 서브카테고리 | `/api/subcategories` |
| 고정 지출 | `/api/recurring-expenses` |
| 예산 | `/api/budgets` |
| 통계 | `/api/stats` |
| 관리자 | `/api/admin` |
