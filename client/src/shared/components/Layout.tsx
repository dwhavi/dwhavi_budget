// 앱 레이아웃 셸 — Outlet + 하단 탭바(모바일) / 사이드바(데스크톱)
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar />
      <main className="max-w-lg mx-auto pb-20 px-4 lg:max-w-none lg:mx-0 lg:pb-0 lg:pl-64">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
