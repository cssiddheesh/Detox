import { ArrowRight, Brain, Check, CircleHelp, Lightbulb, Sparkles, Target } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, PageHeading, StateNote } from '../components/ui'
import { useAppData } from '../context/AppContext'
import { AIService } from '../services/ai'
import { scoreHistoryFor } from '../utils/metrics'
import type { AIAnalysis } from '../types'

const examples = [
  'I asked AI to solve my entire maths assignment.',
  'I used AI to explain a topic I didn’t understand, then tried the questions myself.',
  'I asked AI to check my essay ideas and improve my outline.',
]

export default function Independence() {
  const { data, updateData } = useAppData()
  const [description, setDescription] = useState('')
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fallback, setFallback] = useState(false)
  const [earned, setEarned] = useState(false)

  async function analyze(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!description.trim() || loading) return
    setLoading(true)
    setError('')
    setAnalysis(null)
    setEarned(false)
    try {
      const result = await AIService.analyzeIndependence(description, data.provider, data.aiSettings)
      setAnalysis(result.analysis)
      setFallback(result.usedFallback)
      if (result.usedFallback) setError(`${result.fallbackReason ?? 'The selected provider is unavailable.'} Demo Mode provided this reflection; retry or switch providers in Settings.`)
      updateData((current) => {
        const next = { ...current, independenceScores: [...current.independenceScores, result.analysis.score].slice(-12) }
        return { ...next, scoreHistory: scoreHistoryFor(next) }
      })
    } catch {
      setError('We couldn’t review that just now. Try again or use Demo Mode in Settings.')
    } finally {
      setLoading(false)
    }
  }

  function markIndependent() {
    if (earned) return
    updateData((current) => {
      const next = { ...current, xp: current.xp + 10, badges: current.badges.includes('AI Independent') ? current.badges : [...current.badges, 'AI Independent'] }
      return { ...next, scoreHistory: scoreHistoryFor(next) }
    })
    setEarned(true)
  }

  const categoryClass = analysis?.category === 'Productive' ? 'productive' : analysis?.category === 'Moderate' ? 'moderate' : 'dependent'

  return (
    <div className="page-stack">
      <PageHeading eyebrow="KEEP YOUR THINKING IN THE LOOP" title="AI Independence" description="Reflect on how you use AI. No judgement—just a chance to build a balance that works for you." />
      <div className="independence-layout">
        <div className="independence-main">
          <Card className="analyzer-card">
            <div className="analyzer-icon"><Brain size={22} /></div>
            <p className="eyebrow">A QUICK REFLECTION</p>
            <h2>How did AI help you recently?</h2>
            <p>Describe one recent moment. The more honest you are, the more useful this reflection can be.</p>
            <form onSubmit={(event) => void analyze(event)}>
              <textarea className="reflection-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="For example: I used AI to solve my maths assignment, and I copied the answers without checking the steps…" maxLength={1000} rows={5} aria-label="Describe how you used AI" />
              <div className="analyzer-form-bottom"><span>{description.length} / 1000</span><Button type="submit" disabled={!description.trim() || loading}>{loading ? 'Reflecting…' : <><Sparkles size={16} /> Reflect with AI</>}</Button></div>
            </form>
            {error && <StateNote kind="error">{error}</StateNote>}
            {analysis && <section className="analysis-result" aria-live="polite">
              <div className="analysis-result-top"><div className={`analysis-score ${categoryClass}`}><strong>{analysis.score}</strong><span>/100</span></div><div><p className="eyebrow">YOUR REFLECTION</p><h3 className={`category-label ${categoryClass}`}>{analysis.category}</h3><p className="disclaimer">An educational prompt—not a clinical assessment.</p></div></div>
              <div className="analysis-observation"><h4><CircleHelp size={16} /> What happened?</h4><p>{analysis.happened}</p></div>
              <div className="analysis-observation better"><h4><Lightbulb size={16} /> A more independent approach</h4><p>{analysis.betterApproach}</p></div>
              {fallback && <StateNote>Demo Mode provided this reflection because the selected AI provider was unavailable.</StateNote>}
              <div className="independent-action"><span><Target size={18} /></span><div><strong>One small experiment</strong><p>{analysis.independentAction}</p></div></div>
              <Button variant={earned ? 'sage' : 'primary'} onClick={markIndependent} disabled={earned}>{earned ? <><Check size={16} /> +10 XP added</> : 'I’ll try this independently · +10 XP'}</Button>
            </section>}
          </Card>
          <Card className="think-first-card">
            <div className="think-first-heading"><span className="think-first-icon"><Lightbulb size={19} /></span><div><p className="eyebrow">THINK BEFORE AI</p><h2>Pause. Try. Then ask.</h2></div></div>
            <p>Keep yourself in the learning loop with three quick steps before asking AI for an answer.</p>
            <div className="think-steps"><div><span>01</span><strong>What do I know?</strong><small>Write down what already makes sense.</small></div><div><span>02</span><strong>What could work?</strong><small>Pick a concept or method to try.</small></div><div><span>03</span><strong>Try one step.</strong><small>Then ask AI for a hint or explanation.</small></div></div>
            <Link to="/study" className="text-link">Try it in Study Assistant <ArrowRight size={15} /></Link>
          </Card>
        </div>
        <aside className="independence-aside">
          <Card className="independence-guide"><p className="eyebrow">A HELPFUL LENS</p><h3>AI is a learning partner—not a stand-in.</h3><p>How you use AI can change from task to task. These labels are conversation starters, not grades.</p><div className="guide-row"><span className="guide-dot green" /><div><strong>Productive</strong><small>Hints, explanations, brainstorming</small></div></div><div className="guide-row"><span className="guide-dot yellow" /><div><strong>Moderate</strong><small>AI helps a lot; you still participate</small></div></div><div className="guide-row"><span className="guide-dot rose" /><div><strong>High dependence</strong><small>AI does most of the thinking</small></div></div></Card>
          <Card className="example-card"><p className="eyebrow">NEED AN EXAMPLE?</p><p className="example-card-copy">Choose one, then reflect on what you might try next time.</p>{examples.map((example) => <button key={example} className="example-button" onClick={() => { setDescription(example); setAnalysis(null) }}>{example}<ArrowRight size={14} /></button>)}</Card>
        </aside>
      </div>
    </div>
  )
}
