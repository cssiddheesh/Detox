import { ArrowUp, Brain, CircleHelp, LoaderCircle, Sparkles, UserRound } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, PageHeading, StateNote } from '../components/ui'
import { useAppData } from '../context/AppContext'
import { AIService } from '../services/ai'
import type { AIMessage } from '../types'

const prompts = ['Help me focus', 'I used AI for all my homework', 'Give me a gentle detox challenge', 'Make a 25-minute focus plan']

export default function Coach() {
  const { data } = useAppData()
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  async function sendMessage(content: string) {
    const trimmed = content.trim()
    if (!trimmed || loading) return
    const userMessage: AIMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed, createdAt: new Date().toISOString() }
    const next = [...messages, userMessage]
    setMessages(next)
    setText('')
    setLoading(true)
    setNotice('')
    try {
      const response = await AIService.chat(next, { feature: 'coach' }, data.provider)
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: response.text, createdAt: new Date().toISOString() }])
      if (response.usedFallback) setNotice('Your selected AI is unavailable right now, so a helpful Demo Mode response is shown.')
      window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 40)
    } catch {
      setNotice('The coach could not respond right now. Please try again or switch to Demo Mode in Settings.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage(text)
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="A LITTLE SUPPORT, WHEN YOU NEED IT" title="AI Coach" description="A thoughtful space to build focus and use AI with intention." />
      <div className="coach-layout">
        <Card className="chat-card">
          <div className="chat-topline"><div className="coach-avatar"><Brain size={21} /></div><div><strong>Your AI Coach</strong><span><i className="online-dot" /> Here to help you think it through</span></div><span className="chat-label">SUPPORTIVE · NO JUDGMENT</span></div>
          <div className="chat-thread" aria-live="polite">
            {messages.length === 0 && <div className="welcome-message"><div className="welcome-sparkle"><Sparkles size={22} /></div><h2>What's on your mind?</h2><p>Tell me what’s getting in the way, or choose a prompt to get started. We’ll find one manageable next step together.</p><div className="prompt-list">{prompts.map((prompt) => <button key={prompt} onClick={() => void sendMessage(prompt)}>{prompt}<ArrowUp size={14} /></button>)}</div></div>}
            {messages.map((message) => <div key={message.id} className={`chat-message ${message.role}`}><span className="message-avatar">{message.role === 'user' ? <UserRound size={16} /> : <Brain size={16} />}</span><div><span className="message-name">{message.role === 'user' ? 'You' : 'AI Coach'}</span><p>{message.content}</p>{message.role === 'assistant' && <Link to="/focus" className="message-followup">Start a focus block <ArrowUp size={13} /></Link>}</div></div>)}
            {loading && <div className="chat-message assistant"><span className="message-avatar"><Brain size={16} /></span><div><span className="message-name">AI Coach</span><p className="typing-text"><LoaderCircle className="spin" size={15} /> Thinking of a helpful next step…</p></div></div>}
            <div ref={endRef} />
          </div>
          {notice && <StateNote kind="info">{notice}</StateNote>}
          <form className="chat-composer" onSubmit={handleSubmit}>
            <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Share what’s on your mind…" rows={1} maxLength={1200} aria-label="Message your AI coach" onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(text) }
            }} />
            <span className="composer-note">Your thinking stays at the center.</span>
            <button className="send-button" type="submit" disabled={!text.trim() || loading} aria-label="Send message"><ArrowUp size={18} /></button>
          </form>
        </Card>
        <aside className="coach-side">
          <Card className="coach-principles"><span className="side-icon"><CircleHelp size={19} /></span><p className="eyebrow">HOW YOUR COACH HELPS</p><h3>Hints before answers.</h3><p>We’ll help you pause, think, and find a practical next step. You stay in charge of your choices.</p><ul><li>Encourages independent thinking</li><li>Small, realistic actions</li><li>No shame, no diagnosis</li></ul></Card>
          <Card className="coach-side-note"><Sparkles size={18} /><p><strong>Private by design</strong><br />Keep personal details out of your chat. Your messages only go to a provider if you select one in Settings.</p></Card>
          <Button variant="secondary" onClick={() => setMessages([])} disabled={!messages.length}>Start a fresh conversation</Button>
        </aside>
      </div>
    </div>
  )
}
