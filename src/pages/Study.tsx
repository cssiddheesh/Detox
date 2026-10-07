import { ArrowRight, BookOpen, Check, Lightbulb, MessageCircleQuestion, RotateCcw, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, PageHeading, StateNote } from '../components/ui'
import { useAppData } from '../context/AppContext'
import { AIService } from '../services/ai'

const modes = [
  { name: 'Explain', icon: BookOpen, detail: 'Make a tricky idea clearer' },
  { name: 'Hint', icon: Lightbulb, detail: 'Get a nudge, not the answer' },
  { name: 'Quiz', icon: MessageCircleQuestion, detail: 'Check what you remember' },
  { name: 'Check', icon: Check, detail: 'Review your own attempt' },
  { name: 'Learn', icon: Sparkles, detail: 'Follow a short learning path' },
] as const
type StudyMode = typeof modes[number]['name']

export default function Study() {
  const { data } = useAppData()
  const [mode, setMode] = useState<StudyMode>('Explain')
  const [topic, setTopic] = useState('')
  const [attempt, setAttempt] = useState('')
  const [quizAnswer, setQuizAnswer] = useState('')
  const [quizFeedback, setQuizFeedback] = useState(false)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [quizStep, setQuizStep] = useState(0)

  async function requestHelp(prompt: string, requestedMode: StudyMode = mode) {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setNotice('')
    try {
      const response = await AIService.chat([{ id: crypto.randomUUID(), role: 'user', content: prompt, createdAt: new Date().toISOString() }], { feature: 'study', mode: requestedMode }, data.provider)
      setAnswer(response.text)
      if (response.usedFallback) setNotice('Demo Mode stepped in because the selected AI provider was unavailable.')
    } catch {
      setNotice('Your study helper is unavailable right now. Please retry or select Demo Mode in Settings.')
    } finally {
      setLoading(false)
    }
  }

  async function ask(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!topic.trim()) return
    setAnswer('')
    setQuizAnswer('')
    setQuizFeedback(false)
    const prompt = `${topic.trim()}${attempt.trim() ? `\nMy attempt: ${attempt.trim()}` : ''}`
    await requestHelp(prompt)
  }

  async function checkQuizAnswer() {
    if (!quizAnswer.trim()) return
    const prompt = `Topic: ${topic}\nQuiz question: ${answer}\nStudent answer: ${quizAnswer.trim()}\nGive supportive, concise feedback, correct misconceptions gently, and ask the student to explain one step in their own words.`
    setQuizAnswer('')
    setQuizFeedback(true)
    await requestHelp(prompt, 'Check')
  }

  function nextQuizStep() {
    setAnswer('')
    setQuizAnswer('')
    setQuizFeedback(false)
    const next = quizStep + 1
    setQuizStep(next)
    void requestHelp(`Ask me one new short quiz question about ${topic}. This is question number ${next + 1}; do not reveal the answer.`, 'Quiz')
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="LEARN, DON'T JUST FINISH" title="Study Assistant" description="A patient study partner that helps you understand—not just get to an answer." />
      <div className="study-layout">
        <div className="study-main">
          <div className="study-mode-grid">{modes.map(({ name, icon: Icon, detail }) => <button key={name} className={`study-mode ${mode === name ? 'selected' : ''}`} onClick={() => { setMode(name); setAnswer(''); setQuizAnswer(''); setQuizFeedback(false); setQuizStep(0); setNotice('') }} aria-pressed={mode === name}><span className="study-mode-icon"><Icon size={18} /></span><strong>{name}</strong><small>{detail}</small></button>)}</div>
          <Card className="study-prompt-card">
            <div className="study-card-head"><span className="study-big-icon"><BookOpen size={22} /></span><div><p className="eyebrow">{mode.toUpperCase()} MODE</p><h2>{mode === 'Hint' ? 'Where are you stuck?' : mode === 'Quiz' ? 'What are you learning?' : 'What are you working on?'}</h2></div></div>
            <form onSubmit={(event) => void ask(event)}>
              <label className="field-label" htmlFor="study-topic">Topic or question</label>
              <textarea id="study-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Explain how photosynthesis works…" rows={3} maxLength={1200} className="study-topic-input" />
              {(mode === 'Check' || mode === 'Explain') && <><label className="field-label" htmlFor="study-attempt">Your attempt (optional)</label><textarea id="study-attempt" value={attempt} onChange={(event) => setAttempt(event.target.value)} placeholder="Share what you have tried so far…" rows={2} maxLength={1200} className="study-topic-input smaller" /></>}
              <div className="study-submit-row"><span>Start by thinking it through yourself.</span><Button type="submit" disabled={!topic.trim() || loading}>{loading ? 'Preparing…' : <><Sparkles size={16} /> {mode === 'Quiz' ? 'Start a quiz' : 'Get help'}</>}</Button></div>
            </form>
            {notice && <StateNote>{notice}</StateNote>}
            {answer && <div className="study-answer" aria-live="polite"><div className="answer-title"><span><Sparkles size={17} /></span><div><p className="eyebrow">YOUR STUDY PARTNER</p><strong>{mode === 'Quiz' ? (quizFeedback ? 'Your feedback' : `Question ${quizStep + 1}`) : 'A helpful nudge'}</strong></div></div><p>{answer}</p>{mode === 'Quiz' && <div className="quiz-answer-form">{!quizFeedback && <><label className="field-label" htmlFor="quiz-answer">Your answer</label><textarea id="quiz-answer" className="study-topic-input smaller" value={quizAnswer} onChange={(event) => setQuizAnswer(event.target.value)} placeholder="Try to explain it in your own words…" rows={2} maxLength={1000} /><Button variant="secondary" onClick={() => void checkQuizAnswer()} disabled={!quizAnswer.trim() || loading}>Check my answer</Button></>}<Button variant="quiet" onClick={nextQuizStep} disabled={loading}><RotateCcw size={15} /> Another question</Button></div>}</div>}
          </Card>
        </div>
        <aside className="study-aside"><Card className="study-principle"><span className="principle-flower">✳</span><p className="eyebrow">OUR PROMISE</p><h3>Hints before full solutions.</h3><p>Try a step yourself first. If you get stuck, ask for a clue, an explanation, or a similar example.</p><div className="study-path"><div><span>1</span><p><strong>Think</strong><small>What do you already know?</small></p></div><div><span>2</span><p><strong>Try</strong><small>Make your best attempt.</small></p></div><div><span>3</span><p><strong>Learn</strong><small>Ask for a useful hint.</small></p></div></div></Card>
          <Card className="study-next"><p className="eyebrow">READY TO FOCUS?</p><p>Put your learning into practice with one intentional study block.</p><Link to="/focus" className="text-link">Set up focus time <ArrowRight size={15} /></Link></Card></aside>
      </div>
    </div>
  )
}
