import { Header } from './components/Header'

export function App(): JSX.Element {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30" />
    </div>
  )
}
