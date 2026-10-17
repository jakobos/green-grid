import { useState } from 'react'
import { Header } from './components/Header'
import { Canvas } from './components/Canvas'
import { Sidebar } from './components/Sidebar'

export function App(): JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
        <Canvas />
      </main>
    </div>
  )
}
