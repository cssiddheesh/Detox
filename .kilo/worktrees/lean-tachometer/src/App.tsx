import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  Activity, BookOpen, Brain, ChartNoAxesCombined, Compass, House, Leaf,
  Menu, Mic2, Settings, Sparkles, Timer, X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Coach from './pages/Coach'
import Voice from './pages/Voice'
import Focus from './pages/Focus'
import Independence from './pages/Independence'
import Study from './pages/Study'
import Challenges from './pages/Challenges'
import Progress from './pages/Progress'
import Journal from './pages/Journal'
import SettingsPage from './pages/Settings'
import { useAppData } from './context/AppContext'
import { DemoPill } from './components/ui'

const mainLinks = [
  { to: '/', label: 'Dashboard', icon: House, end: true },
  { to: '/coach', label: 'AI Coach', icon: Brain },
  { to: '/voice', label: 'Voice AI', icon: Mic2 },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/independence', label: 'AI Independence', icon: Compass },
  { to: '/study', label: 'Study Assistant', icon: BookOpen },
]
const moreLinks = [
  { to: '/challenges', label: 'Challenges', icon: Leaf },
  { to: '/progress', label: 'Progress', icon: ChartNoAxesCombined },
  { to: '/journal', label: 'Journal', icon: Activity },
]
const mobileLinks = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/coach', label: 'AI', icon: Brain },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/challenges', label: 'Challenges', icon: Leaf },
  { to: '/settings', label: 'Profile', icon: Settings },
]

function App() {
  const { data, storageWarning } = useAppData()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const allLinks = [...mainLinks, ...moreLinks, { to: '/settings', label: 'Settings', icon: Settings }]

  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      document.documentElement.dataset.theme = data.theme === 'system' ? (preference.matches ? 'dark' : 'light') : data.theme
    }
    applyTheme()
    preference.addEventListener('change', applyTheme)
    return () => preference.removeEventListener('change', applyTheme)
  }, [data.theme])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const links = (items: typeof mainLinks) => items.map(({ to, label, icon: Icon, ...options }) => (
    <NavLink key={to} to={to} end={'end' in options ? options.end : false} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
    </NavLink>
  ))

  return (
    <div className="app-frame">
      <aside className={`sidebar${menuOpen ? ' open' : ''}`} aria-label="Main navigation">
        <div className="brand-row">
          <div className="brand-mark"><span>ai</span><i>360</i></div>
          <button className="icon-button mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <p className="brand-tagline">Smarter habits.<br />Better thinking.</p>
        <div className="nav-label">YOUR SPACE</div>
        <nav className="nav-list">{links(mainLinks)}</nav>
        <div className="nav-label nav-label-lower">GROW AT YOUR PACE</div>
        <nav className="nav-list">{links(moreLinks)}</nav>
        <div className="sidebar-bottom">
          <div className="sidebar-quote"><Sparkles size={17} /><p>Use AI. Understand AI.<br /><strong>Don't depend on AI.</strong></p></div>
          {links([{ to: '/settings', label: 'Settings', icon: Settings }])}
          <p className="sidebar-copyright">AI 360 <span>·</span> Your progress stays yours</p>
        </div>
      </aside>
      {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="breadcrumb"><span>AI 360</span><span className="breadcrumb-slash">/</span><strong>{allLinks.find((item) => item.to === location.pathname)?.label ?? 'Dashboard'}</strong></div>
          <div className="topbar-right">
            <DemoPill provider={data.provider} />
            <span className="user-avatar" aria-label="Your profile">S</span>
          </div>
        </header>
        {storageWarning && <div className="storage-warning">Browser storage is unavailable; your progress will remain for this session only.</div>}
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/voice" element={<Voice />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/independence" element={<Independence />} />
            <Route path="/study" element={<Study />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">{links(mobileLinks)}</nav>
    </div>
  )
}

export default App
