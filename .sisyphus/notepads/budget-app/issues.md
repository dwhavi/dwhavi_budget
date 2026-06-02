# Issues - Budget App

## Vercel GitHub 연동 미설정
- `vercel --prod` 수동 배포 필요 (git push만으로는 자동 배포 안 됨)
- Vercel 프로젝트 설정에서 GitHub 연동 확인 필요

## 구버전 코드 중복
- components/TransactionForm.tsx, pages/ 디렉토리에 구버전 코드 존재
- App.tsx 라우팅은 features/ 디렉토리 참조 → 혼란 방지
- 필요시 pages/, components/ 정리

## PWA 서비스워커 캐시 갱신 주기
- 현재 Workbox runtimeCaching은 `NetworkFirst`로 설정
- 배포 후 사용자 브라우저에 이전 서비스워커 캐시가 남아있으면 구 코드 동작 가능
- registerType: 'autoUpdate' 설정되어 있으나 즉시 적용되지 않을 수 있음
