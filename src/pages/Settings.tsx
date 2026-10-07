import { Bug, Check, Cloud, Database, Download, Link2, Moon, Monitor, RotateCcw, Search, ShieldCheck, Sparkles, Sun, Trash2, Upload, Wifi } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, PageHeading, StateNote } from '../components/ui'
import { useAppData } from '../context/AppContext'
import { initialData } from '../data/initialData'
import { AIService, setSessionApiKey } from '../services/ai'
import type { AIProviderName, AISettings } from '../types'

const providerOptions: { id: AIProviderName; title: string; description: string }[] = [
  { id: 'demo', title: 'Demo Mode', description: 'Private, instant demo responses. No key or network needed.' },
  { id: 'groq', title: 'Groq', description: 'Use your Cloudflare secret, or connect directly with a session-only key.' },
  { id: 'openai-compatible', title: 'OpenAI Compatible', description: 'OpenAI API, compatible hosted services, Ollama, or LM Studio.' },
  { id: 'custom', title: 'Custom AI Endpoint', description: 'Connect an OpenAI-compatible chat completions API.' },
  { id: 'local', title: 'Local AI Server', description: 'Use a local or LAN endpoint such as Ollama or LM Studio.' },
  { id: 'openrouter', title: 'OpenRouter', description: 'Use your Cloudflare secret or a session-only OpenRouter key.' },
]

export default function SettingsPage() {
  const { data, updateData, clearData } = useAppData()
  const [notice, setNotice] = useState('')
  const [noticeKind, setNoticeKind] = useState<'success' | 'error'>('success')
  const [apiKey, setApiKey] = useState('')
  const [search, setSearch] = useState('')
  const [checking, setChecking] = useState(false)
  const [discovering, setDiscovering] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const importRef = useRef<HTMLInputElement>(null)
  const provider = data.provider
  const aiSettings = data.aiSettings
  const configuredAIUrl = import.meta.env.VITE_AI_API_URL?.trim().replace(/\/+$/, '') ?? ''
  const cloudflareEndpoint = configuredAIUrl.endsWith('/api/ai') ? configuredAIUrl : `${configuredAIUrl}/api/ai`
  const matches = (text: string) => !search.trim() || text.toLowerCase().includes(search.trim().toLowerCase())

  function inform(message: string, kind: 'success' | 'error' = 'success') {
    setNotice(message)
    setNoticeKind(kind)
  }

  function defaultSettings(forProvider: AIProviderName): AISettings {
    switch (forProvider) {
      case 'groq':
        return { providerName: 'Groq', baseUrl: import.meta.env.VITE_GROQ_API_URL || 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', temperature: 0.6, maxTokens: 350 }
      case 'openrouter':
        return { providerName: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini', temperature: 0.6, maxTokens: 350 }
      case 'openai-compatible':
        return { providerName: 'OpenAI Compatible', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', temperature: 0.6, maxTokens: 350 }
      case 'local':
        return { providerName: 'Local AI', baseUrl: 'http://localhost:11434/v1', model: 'llama3', temperature: 0.6, maxTokens: 350 }
      case 'custom':
        return { providerName: 'Custom Provider', baseUrl: '', model: '', temperature: 0.6, maxTokens: 350 }
      case 'demo':
        return data.aiSettings
    }
  }

  function changeProvider(provider: AIProviderName) {
    setApiKey('')
    setSessionApiKey('')
    updateData((current) => ({ ...current, provider, aiSettings: defaultSettings(provider) }))
    setModels([])
    inform(provider === 'demo' ? 'Demo Mode is now active. Core features work offline.' : `${providerOptions.find((option) => option.id === provider)?.title} selected. Configure its endpoint and model, then test the connection.`)
  }

  function updateAISettings(patch: Partial<AISettings>) {
    updateData((current) => ({ ...current, aiSettings: { ...current.aiSettings, ...patch } }))
  }

  async function testConnection() {
    setChecking(true)
    setNotice('')
    try {
      await AIService.testConnection(provider, aiSettings)
      inform(`Connection successful: ${aiSettings.providerName || 'AI provider'} responded to a test prompt.`)
    } catch (error) {
      inform(error instanceof Error ? error.message : 'Connection test failed. Check the endpoint and try again.', 'error')
    } finally {
      setChecking(false)
    }
  }

  async function discoverModels() {
    setDiscovering(true)
    setNotice('')
    try {
      const found = await AIService.discoverModels(provider, aiSettings)
      const modelIds = found.map((model) => model.id)
      setModels(modelIds)
      if (!modelIds.length) inform('The endpoint is reachable but did not provide a model list. Enter a model ID manually.', 'error')
      else inform(`Found ${modelIds.length} model${modelIds.length === 1 ? '' : 's'}.`)
    } catch (error) {
      inform(error instanceof Error ? error.message : 'Could not discover models from this endpoint.', 'error')
    } finally {
      setDiscovering(false)
    }
  }

  function exportSettings() {
    const payload = {
      provider: data.provider,
      theme: data.theme,
      aiSettings: data.aiSettings,
      voiceSettings: data.voiceSettings,
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'ai360-settings.json'
    anchor.click()
    URL.revokeObjectURL(url)
    inform('Settings exported. API keys are never included.')
  }

  async function importSettings(file?: File) {
    if (!file) return
    try {
      const value: unknown = JSON.parse(await file.text())
      if (!value || typeof value !== 'object') throw new Error('Settings file must contain a JSON object.')
      const candidate = value as Record<string, unknown>
      const validProviders = providerOptions.map((option) => option.id)
      if (!validProviders.includes(candidate.provider as AIProviderName)
        || (candidate.theme !== 'light' && candidate.theme !== 'dark' && candidate.theme !== 'system')
        || !candidate.aiSettings || typeof candidate.aiSettings !== 'object'
        || !candidate.voiceSettings || typeof candidate.voiceSettings !== 'object') {
        throw new Error('Settings file is missing valid provider, appearance, AI, or voice preferences.')
      }
      const ai = candidate.aiSettings as Partial<AISettings>
      const voice = candidate.voiceSettings as Partial<typeof data.voiceSettings>
      if (typeof ai.providerName !== 'string' || typeof ai.baseUrl !== 'string' || typeof ai.model !== 'string'
        || typeof ai.temperature !== 'number' || ai.temperature < 0 || ai.temperature > 2
        || typeof ai.maxTokens !== 'number' || ai.maxTokens < 1 || ai.maxTokens > 4096
        || typeof voice.language !== 'string' || typeof voice.voiceURI !== 'string'
        || typeof voice.rate !== 'number' || voice.rate < 0.5 || voice.rate > 2
        || typeof voice.pitch !== 'number' || voice.pitch < 0 || voice.pitch > 2
        || typeof voice.volume !== 'number' || voice.volume < 0 || voice.volume > 1) {
        throw new Error('Settings file contains invalid AI or voice values.')
      }
      updateData((current) => ({
        ...current,
        provider: candidate.provider as AIProviderName,
        theme: candidate.theme as typeof current.theme,
        aiSettings: ai as AISettings,
        voiceSettings: voice as typeof current.voiceSettings,
      }))
      setModels([])
      inform('Settings imported. API keys were not imported; enter them again if needed.')
    } catch (error) {
      inform(error instanceof Error ? error.message : 'Could not import this settings file.', 'error')
    } finally {
      if (importRef.current) importRef.current.value = ''
    }
  }

  function resetSettings() {
    if (!window.confirm('Reset provider, appearance, and voice settings to defaults? Your progress and journal will be kept.')) return
    setSessionApiKey('')
    setApiKey('')
    setModels([])
    updateData((current) => ({
      ...current,
      provider: 'demo',
      theme: initialData.theme,
      aiSettings: structuredClone(initialData.aiSettings),
      voiceSettings: structuredClone(initialData.voiceSettings),
    }))
    inform('Settings reset to defaults. Your progress and journal were kept.')
  }

  function clearAll() {
    if (!window.confirm('Clear all AI 360 data stored in this browser? This will reset your local progress, journal, settings, and exhibition sample data.')) return
    clearData()
    setSessionApiKey('')
    setApiKey('')
    inform('Your local AI 360 data has been cleared and reset.')
  }

  function restoreDemo() {
    if (!window.confirm('Restore the exhibition sample journey? This replaces your current progress and journal with demo data.')) return
    setApiKey('')
    setSessionApiKey('')
    updateData(() => structuredClone(initialData))
    inform('The exhibition sample journey has been restored.')
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="YOUR APP, YOUR WAY" title="Settings" description="Choose how AI 360 works for you. Your local preferences stay on this device." />
      <label className="settings-search"><Search size={17} /><input aria-label="Search settings" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search settings…" /></label>
      {notice && <StateNote kind={noticeKind}>{notice}</StateNote>}
      <div className="settings-layout">
        <div className="settings-main">
          {matches('appearance theme light dark system') && <details className="card settings-card" open><summary className="settings-section-heading"><span className="settings-icon"><Sun size={19} /></span><div><h2>Appearance</h2><p>Choose a comfortable look for your space.</p></div></summary><div className="appearance-options">{([{ id: 'light', label: 'Light', icon: Sun }, { id: 'dark', label: 'Dark', icon: Moon }, { id: 'system', label: 'System', icon: Monitor }] as const).map(({ id, label, icon: Icon }) => <button key={id} className={`appearance-option ${data.theme === id ? 'selected' : ''}`} onClick={() => updateData((current) => ({ ...current, theme: id }))}><Icon size={18} /><span>{label}</span>{data.theme === id && <Check size={15} />}</button>)}</div></details>}
          {matches('ai provider groq openai compatible custom endpoint local ollama lm studio model url key temperature tokens') && <details className="card settings-card" open><summary className="settings-section-heading"><span className="settings-icon rose-icon"><Sparkles size={19} /></span><div><h2>AI provider</h2><p>Select a provider and configure its OpenAI-compatible chat endpoint. Provider settings are saved locally; API keys stay in memory only for this tab.</p></div></summary>
            <label className="field-label" htmlFor="ai-provider">Provider</label>
            <select id="ai-provider" value={provider} onChange={(event) => changeProvider(event.target.value as AIProviderName)}>{providerOptions.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}</select>
            {provider !== 'demo' && <>
              <div className="settings-field-grid">
                <label className="settings-field"><span>Provider name</span><input value={aiSettings.providerName} onChange={(event) => updateAISettings({ providerName: event.target.value })} maxLength={60} /></label>
                <label className="settings-field"><span>Base URL</span><input value={aiSettings.baseUrl} onChange={(event) => updateAISettings({ baseUrl: event.target.value })} placeholder="https://host.example/v1" type="url" autoCapitalize="none" /></label>
                <label className="settings-field"><span>API key <small>(not saved)</small></span><input value={apiKey} onChange={(event) => { setApiKey(event.target.value); setSessionApiKey(event.target.value) }} placeholder={(provider === 'groq' || provider === 'openrouter') ? 'Leave blank to use Cloudflare secret' : 'Enter key if required'} type="password" autoComplete="new-password" /></label>
                <label className="settings-field"><span>Model</span><input list="provider-model-list" value={aiSettings.model} onChange={(event) => updateAISettings({ model: event.target.value })} placeholder="Select or enter a model ID" /><datalist id="provider-model-list">{(provider === 'groq' ? ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b', ...models] : provider === 'local' ? ['llama3', 'mistral', 'gemma', 'qwen', 'deepseek', ...models] : models).filter((model, index, list) => list.indexOf(model) === index).map((model) => <option key={model} value={model} />)}</datalist></label>
                <label className="settings-field"><span>Temperature <output>{aiSettings.temperature.toFixed(1)}</output></span><input type="range" min="0" max="2" step="0.1" value={aiSettings.temperature} onChange={(event) => updateAISettings({ temperature: Number(event.target.value) })} /></label>
                <label className="settings-field"><span>Max tokens <output>{aiSettings.maxTokens}</output></span><input type="number" min="1" max="4096" step="1" value={aiSettings.maxTokens} onChange={(event) => updateAISettings({ maxTokens: Math.max(1, Math.min(4096, Number(event.target.value) || 1)) })} /></label>
              </div>
              <div className="provider-notice"><Cloud size={16} /><span>{provider === 'groq' || provider === 'openrouter' ? 'With no API key entered, live requests use the Cloudflare Pages Function and its encrypted provider secret. A key entered here is sent directly to the provider and is not saved.' : provider === 'local' ? 'Local endpoints are called directly from this browser. Use a reachable LAN address on other devices and enable CORS on the local server.' : 'This endpoint is called directly from this browser; enable CORS on your provider. An entered API key is held only in memory and is never exported.'}</span></div>
              <div className="settings-action-row"><Button onClick={() => void testConnection()} disabled={checking || !aiSettings.model.trim()}><Wifi size={15} /> {checking ? 'Testing…' : 'Test connection'}</Button><Button variant="secondary" onClick={() => void discoverModels()} disabled={discovering || !aiSettings.baseUrl.trim()}><RotateCcw size={15} /> {discovering ? 'Loading models…' : 'Discover models'}</Button></div>
            </>}
          </details>}
          {matches('voice speech recognition text to speech rate pitch volume') && <details className="card settings-card"><summary className="settings-section-heading"><span className="settings-icon sage-icon"><Sparkles size={19} /></span><div><h2>Voice</h2><p>Speech recognition, voice selection, rate, pitch, and volume are configurable on the Voice AI page.</p></div></summary><Link className="text-link" to="/voice">Open voice settings <Link2 size={15} /></Link></details>}
          {matches('advanced import export reset json settings') && <details className="card settings-card"><summary className="settings-section-heading"><span className="settings-icon"><Database size={19} /></span><div><h2>Advanced</h2><p>Transfer your preferences or reset settings without deleting your progress.</p></div></summary><div className="settings-action-row"><Button variant="secondary" onClick={exportSettings}><Download size={15} /> Export settings</Button><Button variant="secondary" onClick={() => importRef.current?.click()}><Upload size={15} /> Import settings</Button><Button variant="quiet" onClick={resetSettings}><RotateCcw size={15} /> Reset settings</Button><input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void importSettings(event.target.files?.[0])} /></div></details>}
          {matches('debug diagnostics status endpoint speech provider browser') && <details className="card settings-card"><summary className="settings-section-heading"><span className="settings-icon"><Bug size={19} /></span><div><h2>Debug</h2><p>Connection diagnostics without exposing saved credentials.</p></div></summary><div className="debug-list"><p><strong>Selected provider</strong><span>{providerOptions.find((option) => option.id === provider)?.title ?? provider}</span></p><p><strong>Model</strong><span>{provider === 'demo' ? 'On-device demo' : aiSettings.model || 'Not selected'}</span></p><p><strong>Endpoint</strong><span>{provider === 'demo' ? 'No network required' : ((provider === 'groq' || provider === 'openrouter') && !apiKey ? cloudflareEndpoint : aiSettings.baseUrl || 'Not configured')}</span></p><p><strong>Connection</strong><span>{navigator.onLine ? 'Browser is online' : 'Browser is offline'}</span></p><p><strong>Credentials</strong><span>{provider === 'groq' || provider === 'openrouter' ? apiKey ? 'Session-only provider key entered' : 'Cloudflare secret (server-side)' : apiKey ? 'Session-only key entered' : 'No browser key entered'}</span></p></div><div className="settings-action-row"><Button variant="secondary" onClick={() => void testConnection()} disabled={checking || provider === 'demo' || !aiSettings.model.trim()}><Wifi size={15} /> {checking ? 'Testing…' : 'Run connection test'}</Button></div></details>}
          {matches('exhibition sample mode reminders notifications') && <details className="card settings-card"><summary className="settings-section-heading"><span className="settings-icon sage-icon"><Sparkles size={19} /></span><div><h2>Exhibition mode</h2><p>Keep a realistic sample journey ready for quick demonstrations.</p></div></summary><button className={`toggle-row ${data.exhibitionMode ? 'on' : ''}`} role="switch" aria-checked={data.exhibitionMode} onClick={() => updateData((current) => ({ ...current, exhibitionMode: !current.exhibitionMode }))}><span><strong>{data.exhibitionMode ? 'Sample journey is ready' : 'Sample journey is off'}</strong><small>Uses sample activity, with no account needed.</small></span><i className="toggle-track"><b /></i></button><button className={`toggle-row ${data.notificationsEnabled ? 'on' : ''}`} role="switch" aria-checked={data.notificationsEnabled} onClick={() => updateData((current) => ({ ...current, notificationsEnabled: !current.notificationsEnabled }))}><span><strong>Gentle reminders</strong><small>Future-ready preference. No notifications are sent by this web MVP.</small></span><i className="toggle-track"><b /></i></button></details>}
          {matches('privacy data local storage clear') && <details className="card settings-card privacy-card"><summary className="settings-section-heading"><span className="settings-icon sage-icon"><ShieldCheck size={19} /></span><div><h2>Privacy & data</h2><p>Understand what stays here, and what leaves your browser.</p></div></summary><div className="privacy-list"><div><Database size={16} /><p><strong>Stored on this device</strong><small>Progress, settings, challenges, and journal entries are saved in this browser’s local storage.</small></p></div><div><Cloud size={16} /><p><strong>AI requests</strong><small>When you choose a live provider, submitted text is sent either through the Cloudflare Function or directly to your selected provider. Provider retention terms apply.</small></p></div><div><ShieldCheck size={16} /><p><strong>Minimal by design</strong><small>No registration or account is required. Never share passwords or sensitive personal information in an AI prompt.</small></p></div></div><div className="clear-data-row"><div><strong>Clear my data</strong><p>Remove local app data and reset the exhibition sample journey.</p></div><Button variant="secondary" onClick={clearAll}><Trash2 size={15} /> Clear data</Button></div></details>}
        </div>
        <aside className="settings-side"><Card className="about-card"><div className="about-mark">ai<span>360</span></div><p className="eyebrow">ABOUT AI 360</p><h3>Smarter technology.<br />Healthier habits.</h3><p>AI 360 helps you focus, learn with AI, and keep your own thinking at the center.</p><div className="about-tagline">Use AI. Understand AI.<br /><strong>Don’t depend on AI.</strong></div><small>Version 1.0.0 · Local-first preview</small></Card><Card className="settings-safety"><span><ShieldCheck size={19} /></span><div><strong>Your data, your choice.</strong><p>Clear your local data at any time. AI 360 does not require an account.</p></div></Card><Button variant="quiet" onClick={restoreDemo}><RotateCcw size={15} /> Restore demo sample data</Button></aside>
      </div>
    </div>
  )
}
