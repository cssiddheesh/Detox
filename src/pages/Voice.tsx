import { AudioLines, CircleStop, Headphones, Mic2, Pause, Play, RotateCcw, Send, Sparkles, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, PageHeading, StateNote } from '../components/ui'
import { useAppData } from '../context/AppContext'
import { AIService } from '../services/ai'

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused' | 'error'
interface RecognitionResultEvent extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string } & { isFinal?: boolean }>>
}
interface RecognitionErrorEvent extends Event { error: string }
interface BrowserRecognition {
  lang: string
  interimResults: boolean
  continuous?: boolean
  onresult: ((event: RecognitionResultEvent) => void) | null
  onerror: ((event: RecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
interface RecognitionConstructor { new(): BrowserRecognition }

export default function Voice() {
  const { data, updateData } = useAppData()
  const [state, setState] = useState<VoiceState>('idle')
  const [text, setText] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')
  const [usedFallback, setUsedFallback] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const recognitionRef = useRef<BrowserRecognition | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const recognitions = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  const Recognition = recognitions.SpeechRecognition ?? recognitions.webkitSpeechRecognition
  const voiceSettings = data.voiceSettings

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices())
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      recognitionRef.current?.stop()
      requestRef.current?.abort()
      window.speechSynthesis.cancel()
    }
  }, [])

  function startListening() {
    setError('')
    setResponse('')
    if (!Recognition) {
      setState('error')
      setError('Speech recognition is not supported in this browser. Type your message below instead.')
      return
    }
    try {
      const recognition = new Recognition()
      recognition.lang = voiceSettings.language
      recognition.interimResults = true
      recognition.continuous = true
      recognition.onresult = (event) => {
        setText(Array.from(event.results, (result) => result[0]?.transcript ?? '').join(' ').trim())
      }
      recognition.onerror = (event) => {
        setState('error')
        setError(event.error === 'not-allowed'
          ? 'Microphone permission was denied. Allow microphone access in your browser or type your message.'
          : `Speech recognition stopped (${event.error}). Try again or use the text box.`)
      }
      recognition.onend = () => setState((current) => current === 'listening' ? 'idle' : current)
      recognitionRef.current = recognition
      setState('listening')
      recognition.start()
    } catch {
      setState('error')
      setError('Microphone access is unavailable. Check browser permissions or continue with text.')
    }
  }

  async function respond(rawText: string) {
    const content = rawText.trim()
    if (!content || state === 'processing') return
    recognitionRef.current?.stop()
    setState('processing')
    setError('')
    setResponse('')
    const controller = new AbortController()
    requestRef.current = controller
    let streamed = ''
    try {
      const result = await AIService.chat(
        [{ id: crypto.randomUUID(), role: 'user', content, createdAt: new Date().toISOString() }],
        { feature: 'voice' },
        data.provider,
        data.aiSettings,
        (chunk) => {
          streamed = chunk ? streamed + chunk : ''
          setResponse(streamed)
        },
        controller.signal,
      )
      setResponse(result.text)
      setUsedFallback(result.usedFallback)
      setState('idle')
      if (result.usedFallback) setError(`${result.fallbackReason ?? 'The selected provider is unavailable.'} A Demo Mode response is shown; retry or switch providers in Settings.`)
    } catch (cause) {
      setState('error')
      setError(cause instanceof Error ? cause.message : 'Your voice message could not be processed. Please retry.')
    } finally {
      if (requestRef.current === controller) requestRef.current = null
    }
  }

  function speak() {
    if (!response || !('speechSynthesis' in window)) {
      setError('Audio playback is not supported here. Your response is still ready to read.')
      return
    }
    if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('speaking')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(response)
    utterance.lang = voiceSettings.language
    utterance.rate = voiceSettings.rate
    utterance.pitch = voiceSettings.pitch
    utterance.volume = voiceSettings.volume
    utterance.voice = voices.find((voice) => voice.voiceURI === voiceSettings.voiceURI) ?? null
    utterance.onend = () => setState('idle')
    utterance.onerror = () => {
      setState('error')
      setError('Audio playback stopped. You can still read the response or try again.')
    }
    setError('')
    setState('speaking')
    window.speechSynthesis.speak(utterance)
  }

  function stopAudio() {
    window.speechSynthesis.cancel()
    setState('idle')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void respond(text)
  }

  const stateLabel: Record<VoiceState, string> = {
    idle: 'Ready when you are',
    listening: 'Listening…',
    processing: 'Thinking it through…',
    speaking: 'Speaking…',
    paused: 'Audio paused',
    error: 'Text is always available',
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="HUMAN–AI, NATURALLY" title="Voice AI" description="Speak, edit your transcript, and choose how responses sound." />
      <div className="voice-layout">
        <Card className="voice-card">
          <div className={`voice-orb-wrap ${state}`}><div className="voice-orb"><span className="orb-core"><AudioLines size={36} /></span><i /><i /><i /></div></div>
          <span className={`voice-status ${state}`}><span />{stateLabel[state]}</span>
          <p className="voice-hint">{state === 'listening' ? 'Your transcript updates as you speak. Stop recording when ready.' : state === 'processing' ? 'Finding a thoughtful next step…' : 'Tap the microphone to speak, or type below.'}</p>
          <div className="voice-controls">
            {state === 'processing'
              ? <Button variant="secondary" onClick={() => requestRef.current?.abort()}><CircleStop size={18} /> Cancel request</Button>
              : state === 'listening'
              ? <Button variant="sage" onClick={() => { recognitionRef.current?.stop(); setState('idle') }}><CircleStop size={18} /> Stop recording</Button>
              : <Button onClick={startListening}><Mic2 size={18} /> Start recording</Button>}
          </div>
          <form className="voice-input" onSubmit={handleSubmit}><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Or type your message here…" maxLength={1000} aria-label="Type a voice AI message" /><button type="submit" disabled={!text.trim() || state === 'processing'} aria-label="Send message"><Send size={18} /></button></form>
        </Card>
        <div className="voice-result-column">
          <Card className="voice-transcript"><div className="voice-panel-heading"><div><span className="voice-panel-icon"><Headphones size={17} /></span><strong>Your words</strong></div><span>VOICE · TEXT</span></div><p className={text ? 'transcript-text' : 'placeholder-text'}>{text || 'Your words will appear here. You can edit them before sending.'}</p></Card>
          {error && <StateNote kind="error">{error}</StateNote>}
          {response ? <Card className="voice-response"><div className="voice-panel-heading"><div><span className="voice-panel-icon response-icon"><Sparkles size={17} /></span><strong>A thoughtful next step</strong></div><div className="audio-controls">{state === 'speaking' ? <button className="audio-button" onClick={() => { window.speechSynthesis.pause(); setState('paused') }} aria-label="Pause audio"><Pause size={16} /> Pause</button> : <button className="audio-button" onClick={speak} aria-label={state === 'paused' ? 'Resume audio' : 'Read response aloud'}>{state === 'paused' ? <Play size={16} /> : <Volume2 size={17} />} {state === 'paused' ? 'Resume' : 'Play'}</button>}{(state === 'speaking' || state === 'paused') && <button className="audio-button" onClick={stopAudio} aria-label="Stop audio"><CircleStop size={16} /> Stop</button>}</div></div><p>{response}</p>{usedFallback && <small className="fallback-note">Demo response used. See the message above for the provider issue and retry options.</small>}<Link to="/focus" className="text-link">Start a focus session <RotateCcw size={14} /></Link></Card> : <Card className="voice-empty"><div className="empty-wave"><AudioLines size={22} /></div><h3>Your response will appear here</h3><p>Speech recognition depends on your browser and may require internet access. Text chat remains available when unsupported.</p></Card>}
          <Card className="voice-settings-card">
            <h2>Voice preferences</h2>
            <label className="field-label" htmlFor="voice-language">Recognition language</label>
            <select id="voice-language" value={voiceSettings.language} onChange={(event) => updateData((current) => ({ ...current, voiceSettings: { ...current.voiceSettings, language: event.target.value } }))}><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="en-IN">English (India)</option><option value="es-ES">Español</option><option value="fr-FR">Français</option><option value="de-DE">Deutsch</option><option value="hi-IN">हिन्दी</option></select>
            <label className="field-label" htmlFor="voice-choice">Speech voice</label>
            <select id="voice-choice" value={voiceSettings.voiceURI} onChange={(event) => updateData((current) => ({ ...current, voiceSettings: { ...current.voiceSettings, voiceURI: event.target.value } }))}><option value="">System default</option>{voices.filter((voice) => voice.lang.startsWith(voiceSettings.language.split('-')[0])).map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}</select>
            {([
              ['rate', 'Speech rate', 0.5, 2, 0.1],
              ['pitch', 'Pitch', 0, 2, 0.1],
              ['volume', 'Volume', 0, 1, 0.05],
            ] as const).map(([field, label, min, max, step]) => <label className="range-setting" key={field}><span>{label}<output>{voiceSettings[field].toFixed(2)}</output></span><input type="range" min={min} max={max} step={step} value={voiceSettings[field]} onChange={(event) => updateData((current) => ({ ...current, voiceSettings: { ...current.voiceSettings, [field]: Number(event.target.value) } }))} /></label>)}
          </Card>
          <p className="voice-privacy">Voice uses your browser’s speech-recognition service when available; its handling depends on your browser. Avoid sharing sensitive information.</p>
        </div>
      </div>
    </div>
  )
}
