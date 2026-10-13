import { Header } from './components/Header'
import { Canvas } from './components/Canvas'

export function App(): JSX.Element {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <Canvas />
      </main>
    </div>
  )
}
