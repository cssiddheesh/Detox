import { ArrowUpRight, Award, Brain, CalendarDays, ChartNoAxesCombined, Clock3, Flame, Leaf, Sparkles, Target, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, PageHeading, ProgressBar, SectionTitle } from '../components/ui'
import { useAppData } from '../context/AppContext'
import { getMetrics } from '../utils/metrics'

export default function Progress() {
  const { data } = useAppData()
  const metrics = getMetrics(data)
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const now = new Date()
  const week = weekDays.map((label, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - ((now.getDay() + 6) % 7) + index)
    const minutes = data.focusSessions.filter((session) => {
      const sessionDate = new Date(session.createdAt)
      return session.completed && sessionDate.toDateString() === date.toDateString()
    }).reduce((total, session) => total + session.durationMinutes, 0)
    return { label, minutes, date }
  })
  const maxMinutes = Math.max(30, ...week.map((day) => day.minutes))
  const averageIndependence = Math.round(data.independenceScores.reduce((total, score) => total + score, 0) / Math.max(1, data.independenceScores.length))
  const totalChallenges = data.challenges.filter((challenge) => challenge.completed).length
  const scoreHistory = data.scoreHistory.slice(-6)
  if (!scoreHistory.length || scoreHistory.at(-1) !== metrics.score) scoreHistory.push(metrics.score)

  return (
    <div className="page-stack">
      <PageHeading eyebrow="NOTICE YOUR OWN PROGRESS" title="Your progress" description="A calm look at what you’re building—one small choice at a time." action={<span className="period-label"><CalendarDays size={15} /> This week</span>} />
      <div className="progress-summary-grid">
        <Card className="progress-score-card"><div className="progress-score-top"><span className="score-mini-icon"><Sparkles size={17} /></span><span className="eyebrow">AI 360 SCORE</span><span className="score-change">YOUR JOURNEY</span></div><div className="progress-score-value">{metrics.score}<span>/100</span></div><p>Your personal wellness activity snapshot.</p><ProgressBar value={metrics.score} /></Card>
        <ProgressSummary icon={<Clock3 />} label="Focus time" value={`${Math.floor(metrics.totalMinutes / 60)}h ${metrics.totalMinutes % 60}m`} note="Total completed sessions" />
        <ProgressSummary icon={<Brain />} label="AI independence" value={`${metrics.independenceScore}%`} note={`${averageIndependence}% reflection average`} />
        <ProgressSummary icon={<Leaf />} label="Challenges" value={`${totalChallenges}`} note="Small wins you completed" />
      </div>

      <div className="progress-charts-grid">
        <Card className="chart-card"><div className="chart-card-title"><div><p className="eyebrow">SHOWING UP FOR YOURSELF</p><h2>Focus minutes</h2></div><span className="chart-pill"><Clock3 size={14} /> this week</span></div><div className="focus-chart" role="img" aria-label={`Weekly focus minutes: ${week.map((item) => `${item.label} ${item.minutes}`).join(', ')}`}>{week.map((item, index) => <div className="chart-column" key={`${item.label}-${index}`}><div className="chart-bar-area"><span className="bar-tooltip">{item.minutes} min</span><div className={`chart-bar ${item.date.toDateString() === now.toDateString() ? 'today' : ''}`} style={{ height: `${Math.max(4, item.minutes / maxMinutes * 100)}%` }} /></div><span className="chart-day">{item.label}</span></div>)}</div><div className="chart-foot"><span><i className="legend-dot" /> Focus time</span><span>Total · {metrics.totalMinutes} min</span></div></Card>
        <Card className="independence-trend-card"><div className="chart-card-title"><div><p className="eyebrow">THINKING FOR YOURSELF</p><h2>AI independence</h2></div><Brain className="chart-heading-icon" size={19} /></div><div className="independence-current"><strong>{metrics.independenceScore}%</strong><span>latest reflection</span></div><div className="independence-sparkline" aria-label="Independence reflection scores">{data.independenceScores.slice(-7).map((score, index) => <span key={`${index}-${score}`} style={{ height: `${Math.max(16, score)}%` }} title={`${score}%`} />)}</div><p className="trend-caption">Use each reflection as a learning moment, not a grade.</p><Link to="/independence" className="text-link">Reflect on your AI use <ArrowUpRight size={15} /></Link></Card>
        <Card className="score-history-card"><div className="chart-card-title"><div><p className="eyebrow">YOUR WELLNESS JOURNEY</p><h2>AI 360 Score</h2></div><Sparkles className="chart-heading-icon" size={18} /></div><div className="score-history-chart" role="img" aria-label={`AI 360 score history: ${scoreHistory.join(', ')}`}>{scoreHistory.map((score, index) => <div className="score-history-point" key={`${index}-${score}`}><span className="score-history-value">{score}</span><div className="score-history-column"><i style={{ height: `${score}%` }} /></div><small>{index === scoreHistory.length - 1 ? 'NOW' : `STEP ${index + 1}`}</small></div>)}</div><p className="trend-caption">Your score reflects activity in this app. It’s an educational metric, not a diagnosis.</p></Card>
      </div>

      <Card className="weekly-report"><div className="report-icon"><ChartNoAxesCombined size={20} /></div><div className="weekly-report-copy"><p className="eyebrow">YOUR WEEKLY REFLECTION</p><h2>Look how far a few small steps can take you.</h2><p>You’ve logged {metrics.totalMinutes} minutes of focus and completed {totalChallenges} {totalChallenges === 1 ? 'challenge' : 'challenges'}. Your strongest habit is the one you keep coming back to.</p></div><div className="weekly-highlight"><span><Target size={17} /></span><strong>{data.focusSessions.length}</strong><small>focus sessions</small></div><div className="weekly-highlight"><span><Trophy size={17} /></span><strong>{data.xp}</strong><small>XP earned</small></div></Card>

      <section className="badges-section"><SectionTitle>Milestones you’ve earned</SectionTitle><div className="badge-grid">{['First Focus', 'AI Independent', 'Focus Builder', 'Challenge Master', 'Voice Explorer', 'Digital Balance', 'AI Wise User'].map((badge, index) => {
        const earned = data.badges.includes(badge)
        const Icon = [Target, Brain, Flame, Leaf, Sparkles, Award, Trophy][index]
        return <Card key={badge} className={`badge-card ${earned ? 'earned' : 'locked'}`}><span className="badge-icon"><Icon size={19} /></span><div><strong>{badge}</strong><small>{earned ? 'Earned · your way' : 'Ready when you are'}</small></div>{earned && <span className="earned-check">✓</span>}</Card>
      })}</div></section>
    </div>
  )
}

function ProgressSummary({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <Card className="progress-summary"><span className="progress-summary-icon">{icon}</span><span className="eyebrow">{label}</span><strong>{value}</strong><small>{note}</small></Card>
}
