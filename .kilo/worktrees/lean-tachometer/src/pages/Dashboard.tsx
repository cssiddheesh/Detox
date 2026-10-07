import { ArrowRight, Brain, Clock3, Leaf, Mic2, Sparkles, Target, TimerReset, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, PageHeading, ProgressBar, SectionTitle } from '../components/ui'
import { useAppData } from '../context/AppContext'
import { getMetrics } from '../utils/metrics'

export default function Dashboard() {
  const { data } = useAppData()
  const metrics = getMetrics(data)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const minutes = metrics.todayMinutes

  return (
    <div className="page-stack">
      <PageHeading eyebrow="YOUR DAILY RESET" title={`${greeting} 👋`} description="Ready to make technology work for you?" />

      <div className="dashboard-hero">
        <Card className="score-card">
          <div className="score-top"><span className="score-overline">YOUR WELLNESS SNAPSHOT</span><Sparkles size={18} /></div>
          <div className="score-display">
            <div className="score-ring" style={{ '--score-angle': `${metrics.score * 3.6}deg` } as React.CSSProperties}>
              <div className="score-ring-inner"><strong>{metrics.score}</strong><span>/ 100</span></div>
            </div>
            <div className="score-copy"><h2>AI 360 Score</h2><p>A little progress adds up. This is your personal activity snapshot, not a diagnosis.</p><Link to="/progress" className="text-link">See your progress <ArrowRight size={15} /></Link></div>
          </div>
          <div className="score-components">
            <div><span>Focus</span><strong>{metrics.focusScore}</strong><ProgressBar value={metrics.focusScore} /></div>
            <div><span>Digital balance</span><strong>{metrics.balanceScore}</strong><ProgressBar value={metrics.balanceScore} color="sage" /></div>
            <div><span>AI independence</span><strong>{metrics.independenceScore}%</strong><ProgressBar value={metrics.independenceScore} /></div>
          </div>
        </Card>
        <Card className="insight-card">
          <div className="insight-icon"><Sparkles size={19} /></div>
          <p className="eyebrow">TODAY'S INSIGHT</p>
          <h2>{minutes > 0 ? 'You showed up for your focus today.' : 'A small intentional step can change your day.'}</h2>
          <p>{minutes > 0
            ? `You have completed ${minutes} focused ${minutes === 1 ? 'minute' : 'minutes'} today. Try one more short, phone-free block when it feels right.`
            : 'Choose one task, give it your attention for a few minutes, and let everything else wait.'}</p>
          <Link to="/focus" className="insight-link">Plan a focus block <ArrowRight size={15} /></Link>
          <div className="insight-decoration"><Leaf size={72} /></div>
        </Card>
      </div>

      <div className="stat-grid">
        <MetricTile icon={<Clock3 />} label="Focus today" value={`${minutes} min`} note="A little more presence" tint="rose" />
        <MetricTile icon={<Brain />} label="AI check-ins" value={`${data.independenceScores.length}`} note="Thinking with intention" tint="pink" />
        <MetricTile icon={<Target />} label="Challenges" value={`${metrics.completedChallenges} / ${data.challenges.length}`} note="Small wins count" tint="sage" />
        <MetricTile icon={<Trophy />} label="Total XP" value={`${data.xp}`} note={metrics.level} tint="cream" />
      </div>

      <div className="section-row">
        <SectionTitle>Pick your next step</SectionTitle>
        <span className="muted-inline">No perfect streaks. Just progress.</span>
      </div>
      <div className="action-grid">
        <QuickAction to="/voice" icon={<Mic2 />} title="Talk it out" description="Ask your AI coach by voice" tone="rose" />
        <QuickAction to="/coach" icon={<Brain />} title="AI Coach" description="Make a simple, supportive plan" tone="pink" />
        <QuickAction to="/focus" icon={<TimerReset />} title="Start focus" description="Give one task your attention" tone="sage" />
        <QuickAction to="/challenges" icon={<Leaf />} title="Try a reset" description="Choose a small wellness challenge" tone="cream" />
      </div>

      <div className="bottom-grid">
        <Card className="next-challenge">
          <div className="challenge-illustration"><Leaf size={26} /></div>
          <div><p className="eyebrow">A GENTLE NUDGE</p><h3>Try a 10-minute reset</h3><p>Step away from non-essential screens and do one offline thing you enjoy.</p></div>
          <Link to="/challenges" aria-label="Explore challenges" className="round-arrow"><ArrowRight size={19} /></Link>
        </Card>
        <Card className="xp-card">
          <div className="xp-heading"><div><p className="eyebrow">YOUR JOURNEY</p><h3>{metrics.level}</h3></div><span className="level-icon"><Trophy size={19} /></span></div>
          <div className="xp-line"><span>{data.xp} XP</span><span>{metrics.nextLevelXp} XP to next level</span></div>
          <ProgressBar value={(data.xp % 150) / 1.5} color="sage" />
          <p className="xp-footnote">You’re building habits at your own pace.</p>
        </Card>
      </div>
    </div>
  )
}

function MetricTile({ icon, label, value, note, tint }: { icon: React.ReactNode; label: string; value: string; note: string; tint: string }) {
  return <Card className="metric-tile"><span className={`metric-icon ${tint}`}>{icon}</span><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div></Card>
}

function QuickAction({ to, icon, title, description, tone }: { to: string; icon: React.ReactNode; title: string; description: string; tone: string }) {
  return <Link to={to} className="quick-action"><span className={`quick-icon ${tone}`}>{icon}</span><span className="quick-copy"><strong>{title}</strong><small>{description}</small></span><ArrowRight className="quick-arrow" size={17} /></Link>
}
