import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useMemo,
  lazy,
  Suspense,
} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const ThemeContext = createContext({
  dark: true,
  toggle: () => {},
})

const LazyDetails = lazy(() =>
  Promise.resolve({
    default: () => (
      <div style={{ padding: '0.5rem', border: '1px dashed #777' }}>
        <strong>Lazy loaded</strong>
        <p style={{ margin: 0 }}>This component was loaded with React.lazy + Suspense.</p>
      </div>
    ),
  }),
)

function Counter() {
  const [n, setN] = useState(0)
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div>Simple state demo (Counter): <strong>{n}</strong></div>
      <div style={{ marginTop: '0.4rem' }}>
        <button onClick={() => setN((s) => s + 1)} className="primary">+1</button>{' '}
        <button onClick={() => setN((s) => s - 1)} className="primary">-1</button>
      </div>
    </div>
  )
}

function Todos() {
  const [items, setItems] = useState<string[]>(['Try the demo', 'Edit src/App.tsx'])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const add = () => {
    const v = inputRef.current?.value?.trim()
    if (v) {
      setItems((s) => [v, ...s])
      if (inputRef.current) inputRef.current.value = ''
      inputRef.current?.focus()
    }
  }
  return (
    <div style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
      <div><strong>List & controlled input</strong></div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
        <input ref={inputRef} placeholder="Add todo..." />
        <button onClick={add} className="primary">Add</button>
      </div>
      <ul style={{ marginTop: '0.5rem' }}>
        {items.map((it, i) => (
          <li key={i}>
            {it}{' '}
            <button onClick={() => setItems((s) => s.filter((_, idx) => idx !== i))}>remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FetchDemo() {
  const [title, setTitle] = useState<string | null>(null)
  useEffect(() => {
    let mounted = true
    fetch('https://jsonplaceholder.typicode.com/todos/1')
      .then((r) => r.json())
      .then((json) => {
        if (mounted) setTitle(String(json.title))
      })
      .catch(() => {
        if (mounted) setTitle('Failed to fetch (offline?)')
      })
    return () => {
      mounted = false
    }
  }, [])
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div><strong>Effect & fetch demo</strong></div>
      <div style={{ marginTop: '0.4rem' }}>{title ?? 'Loading...'}</div>
    </div>
  )
}

function ComputationDemo({ items }: { items: number[] }) {
  const sum = useMemo(() => items.reduce((a, b) => a + b, 0), [items])
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div><strong>Memoized computation</strong></div>
      <div style={{ marginTop: '0.4rem' }}>Sum of sample values: {sum}</div>
    </div>
  )
}

function ThemeToggle() {
  const ctx = useContext(ThemeContext)
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div><strong>Context + theme toggle</strong></div>
      <div style={{ marginTop: '0.4rem' }}>
        <button onClick={ctx.toggle}>{ctx.dark ? 'Switch to light' : 'Switch to dark'}</button>
      </div>
    </div>
  )
}

function App() {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }, [dark])

  const theme = { dark, toggle: () => setDark((s) => !s) }

  return (
    <ThemeContext.Provider value={theme}>
      <div className="app-container">
        <header className="app-header">
          <div className="app-brand" aria-hidden>
            <a href="https://vite.dev" target="_blank" rel="noreferrer">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank" rel="noreferrer">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1>Vite + React — POC demo</h1>
          </div>
        </header>

        <main>
          <div className="card">
            <ThemeToggle />
            <Counter />
            <Todos />
            <FetchDemo />
            <ComputationDemo items={[10, 20, 30, 40]} />

            <div style={{ marginTop: '0.5rem' }}>
              <div><strong>Lazy loading</strong></div>
              <Suspense fallback={<div>Loading details...</div>}>
                <LazyDetails />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </ThemeContext.Provider>
  )
}

export default App
