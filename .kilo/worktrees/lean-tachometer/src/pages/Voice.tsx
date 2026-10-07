import { AudioLines, CircleStop, Headphones, Mic2, MicOff, RotateCcw, Send, Sparkles, Volume2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, PageHeading, StateNote } from '../components/ui'
import { useAppData } from '../context/AppContext'
import { AIService } from '../services/ai'

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
interface RecognitionResultEvent extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}
interface RecognitionErrorEvent extends Event {
  error: string
}
interface BrowserRecognition {
  lang: string
  interimResults: boolean
  onresult: ((event: RecognitionResultEvent) => void) | null
  onerror: ((event: RecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
interface RecognitionConstructor {
  new(): BrowserRecognition
}

export default function Voice() {
  const { data } = useAppData()
  const [state, setState] = useState<VoiceState>('idle')
  const [text, setText] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')
  const [usedFallback, setUsedFallback] = useState(false)
  const recognitionRef = useRef<BrowserRecognition | null>(null)
  const recognitions = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  const Recognition = recognitions.SpeechRecognition ?? recognitions.webkitSpeechRecognition

  function startListening() {
    setError('')
    setResponse('')
    if (!Recognition) {
      setState('error')
      setError('Microphone speech recognition is not available in this browser. Type your message below to keep talking with the AI.')
      return
    }
    try {
      const recognition = new Recognition()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? ''
        setText(transcript)
        if (transcript.trim()) void respond(transcript)
      }
      recognition.onerror = () => {
        setState('error')
        setError('We couldn’t hear that clearly. Try again or use the text box.')
      }
      recognition.onend = () => setState((current) => current === 'listening' ? 'idle' : current)
      recognitionRef.current = recognition
      setState('listening')
      recognition.start()
    } catch {
      setState('error')
      setError('Microphone access was unavailable. Check browser permissions or continue with text.')
    }
  }

  async function respond(rawText: string) {
    const content = rawText.trim()
    if (!content) return
    recognitionRef.current?.stop()
    setState('processing')
    setError('')
    setResponse('')
    try {
      const result = await AIService.chat([{ id: crypto.randomUUID(), role: 'user', content, createdAt: new Date().toISOString() }], { feature: 'voice' }, data.provider)
      setResponse(result.text)
      setUsedFallback(result.usedFallback)
      setState('idle')
    } catch {
      setState('error')
      setError('Your voice message could not be processed. Please try again or continue in text.')
    }
  }

  function speak() {
    if (!response || !('speechSynthesis' in window)) {
      setError('Audio playback is unavailable here. Your response is still ready to read.')
      setState('error')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(response)
    utterance.onend = () => setState('idle')
    utterance.onerror = () => {
      setState('error')
      setError('Audio playback stopped. You can still read the response or try again.')
    }
    setState('speaking')
    window.speechSynthesis.speak(utterance)
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
    error: 'Text is always available',
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="HUMAN–AI, NATURALLY" title="Voice AI" description="Say what’s on your mind. Your own voice—and your own thinking—lead the way." />
      <div className="voice-layout">
        <Card className="voice-card">
          <div className={`voice-orb-wrap ${state}`}><div className="voice-orb"><span className="orb-core"><AudioLines size={36} /></span><i /><i /><i /></div></div>
          <span className={`voice-status ${state}`}><span />{stateLabel[state]}</span>
          <p className="voice-hint">{state === 'listening' ? 'Go ahead, we’re listening.' : state === 'processing' ? 'Finding a thoughtful next step…' : 'Tap the microphone to speak, or type below.'}</p>
          <div className="voice-controls">
            {state === 'listening'
              ? <Button variant="sage" onClick={() => recognitionRef.current?.stop()}><CircleStop size={18} /> Stop listening</Button>
              : <Button onClick={startListening} disabled={state === 'processing'}><Mic2 size={18} /> Tap to speak</Button>}
            {state === 'speaking' && <Button variant="secondary" onClick={() => { window.speechSynthesis.cancel(); setState('idle') }}><MicOff size={17} /> Stop audio</Button>}
          </div>
          <form className="voice-input" onSubmit={handleSubmit}><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Or type your message here…" maxLength={1000} aria-label="Type a voice AI message" /><button type="submit" disabled={!text.trim() || state === 'processing'} aria-label="Send message"><Send size={18} /></button></form>
        </Card>
        <div className="voice-result-column">
          <Card className="voice-transcript"><div className="voice-panel-heading"><div><span className="voice-panel-icon"><Headphones size={17} /></span><strong>Your words</strong></div><span>VOICE · TEXT</span></div><p className={text ? 'transcript-text' : 'placeholder-text'}>{text || 'Your words will appear here. You can edit them before sending.'}</p></Card>
          {error && <StateNote kind="error">{error}</StateNote>}
          {response ? <Card className="voice-response"><div className="voice-panel-heading"><div><span className="voice-panel-icon response-icon"><Sparkles size={17} /></span><strong>A thoughtful next step</strong></div><button className="audio-button" onClick={speak} aria-label="Read response aloud"><Volume2 size={17} /> {state === 'speaking' ? 'Speaking' : 'Play audio'}</button></div><p>{response}</p>{usedFallback && <small className="fallback-note">Demo response used because the selected provider wasn’t available.</small>}<Link to="/focus" className="text-link">Start a focus session <RotateCcw size={14} /></Link></Card> : <Card className="voice-empty"><div className="empty-wave"><AudioLines size={22} /></div><h3>Your response will appear here</h3><p>Voice input uses your browser’s speech recognition when available. Text chat is always ready as a fallback.</p></Card>}
          <p className="voice-privacy">Voice uses your browser’s speech-recognition service when available; its handling depends on your browser. Avoid sharing sensitive information.</p>
        </div>
      </div>
    </div>
  )
}
