import { Check, Cloud, Database, Moon, Monitor, RotateCcw, ShieldCheck, Sparkles, Sun, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, PageHeading, StateNote } from '../components/ui'
import { useAppData } from '../context/AppContext'
import { initialData } from '../data/initialData'
import type { AIProviderName } from '../types'

const providerOptions: { id: AIProviderName; title: string; description: string }[] = [
  { id: 'demo', title: 'Demo Mode', description: 'Private, instant demo responses. No key or network needed.' },
  { id: 'groq', title: 'Groq', description: 'Connect through your secured Cloudflare API endpoint.' },
  { id: 'openrouter', title: 'OpenRouter', description: 'Choose a model through your secured Cloudflare API endpoint.' },
]

export default function SettingsPage() {
  const { data, updateData, clearData } = useAppData()
  const [notice, setNotice] = useState('')

  function changeProvider(provider: AIProviderName) {
    updateData((current) => ({ ...current, provider }))
    setNotice(provider === 'demo' ? 'Demo Mode is now active. Core features work offline.' : 'Provider selected. If its secure endpoint is not configured, responses will automatically use Demo Mode.')
  }

  function clearAll() {
    if (!window.confirm('Clear all AI 360 data stored in this browser? This will reset your local progress, journal, settings, and exhibition sample data.')) return
    clearData()
    setNotice('Your local AI 360 data has been cleared and reset.')
  }

  function restoreDemo() {
    if (!window.confirm('Restore the exhibition sample journey? This replaces your current progress and journal with demo data.')) return
    updateData(() => structuredClone(initialData))
    setNotice('The exhibition sample journey has been restored.')
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="YOUR APP, YOUR WAY" title="Settings" description="Choose how AI 360 works for you. Your local preferences stay on this device." />
      {notice && <StateNote kind="success">{notice}</StateNote>}
      <div className="settings-layout">
        <div className="settings-main">
          <Card className="settings-card"><div className="settings-section-heading"><span className="settings-icon"><Sun size={19} /></span><div><h2>Appearance</h2><p>Choose a comfortable look for your space.</p></div></div><div className="appearance-options">{([{ id: 'light', label: 'Light', icon: Sun }, { id: 'dark', label: 'Dark', icon: Moon }, { id: 'system', label: 'System', icon: Monitor }] as const).map(({ id, label, icon: Icon }) => <button key={id} className={`appearance-option ${data.theme === id ? 'selected' : ''}`} onClick={() => updateData((current) => ({ ...current, theme: id }))}><Icon size={18} /><span>{label}</span>{data.theme === id && <Check size={15} />}</button>)}</div></Card>
          <Card className="settings-card"><div className="settings-section-heading"><span className="settings-icon rose-icon"><Sparkles size={19} /></span><div><h2>AI provider</h2><p>AI requests go through a secure server endpoint. No provider keys are stored in this app.</p></div></div><div className="provider-options">{providerOptions.map((provider) => <button key={provider.id} className={`provider-option ${data.provider === provider.id ? 'selected' : ''}`} onClick={() => changeProvider(provider.id)}><span className={`provider-dot ${provider.id}`} /><span className="provider-option-copy"><strong>{provider.title}</strong><small>{provider.description}</small></span><span className="provider-radio">{data.provider === provider.id && <i />}</span></button>)}</div>{data.provider !== 'demo' && <div className="provider-notice"><Cloud size={16} /><span>Live provider selected. Requests use the server-side Cloudflare endpoint. If it is unavailable, responses fall back to Demo Mode.</span></div>}</Card>
          <Card className="settings-card"><div className="settings-section-heading"><span className="settings-icon sage-icon"><Sparkles size={19} /></span><div><h2>Exhibition mode</h2><p>Keep a realistic sample journey ready for quick demonstrations.</p></div></div><button className={`toggle-row ${data.exhibitionMode ? 'on' : ''}`} role="switch" aria-checked={data.exhibitionMode} onClick={() => updateData((current) => ({ ...current, exhibitionMode: !current.exhibitionMode }))}><span><strong>{data.exhibitionMode ? 'Sample journey is ready' : 'Sample journey is off'}</strong><small>Uses sample activity, with no account needed.</small></span><i className="toggle-track"><b /></i></button><button className={`toggle-row ${data.notificationsEnabled ? 'on' : ''}`} role="switch" aria-checked={data.notificationsEnabled} onClick={() => updateData((current) => ({ ...current, notificationsEnabled: !current.notificationsEnabled }))}><span><strong>Gentle reminders</strong><small>Future-ready preference. No notifications are sent by this web MVP.</small></span><i className="toggle-track"><b /></i></button></Card>
          <Card className="settings-card privacy-card"><div className="settings-section-heading"><span className="settings-icon sage-icon"><ShieldCheck size={19} /></span><div><h2>Privacy & data</h2><p>Understand what stays here, and what leaves your browser.</p></div></div><div className="privacy-list"><div><Database size={16} /><p><strong>Stored on this device</strong><small>Progress, settings, challenges, and journal entries are saved in this browser’s local storage.</small></p></div><div><Cloud size={16} /><p><strong>AI requests</strong><small>When you choose a live provider, the text you submit is sent to your configured provider through the server endpoint. The provider’s own retention terms apply.</small></p></div><div><ShieldCheck size={16} /><p><strong>Minimal by design</strong><small>No registration or account is required. Never share passwords or sensitive personal information in an AI prompt.</small></p></div></div><div className="clear-data-row"><div><strong>Clear my data</strong><p>Remove local app data and reset the exhibition sample journey.</p></div><Button variant="secondary" onClick={clearAll}><Trash2 size={15} /> Clear data</Button></div></Card>
        </div>
        <aside className="settings-side"><Card className="about-card"><div className="about-mark">ai<span>360</span></div><p className="eyebrow">ABOUT AI 360</p><h3>Smarter technology.<br />Healthier habits.</h3><p>AI 360 helps you focus, learn with AI, and keep your own thinking at the center.</p><div className="about-tagline">Use AI. Understand AI.<br /><strong>Don’t depend on AI.</strong></div><small>Version 1.0.0 · Local-first preview</small></Card><Card className="settings-safety"><span><ShieldCheck size={19} /></span><div><strong>Your data, your choice.</strong><p>Clear your local data at any time. AI 360 does not require an account.</p></div></Card><Button variant="quiet" onClick={restoreDemo}><RotateCcw size={15} /> Restore demo defaults</Button></aside>
      </div>
    </div>
  )
}
