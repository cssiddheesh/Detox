import { ArrowRight, Check, CircleCheck, Clock3, Leaf, Play, Sparkles, Target } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, PageHeading, ProgressBar, StateNote } from '../components/ui'
import { useAppData } from '../context/AppContext'

export default function Challenges() {
  const { data, completeChallenge } = useAppData()
  const [started, setStarted] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState<string | null>(null)
  const done = data.challenges.filter((challenge) => challenge.completed).length

  function finish(id: string) {
    completeChallenge(id)
    setStarted(null)
    setJustCompleted(id)
    window.setTimeout(() => setJustCompleted(null), 3500)
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="SMALL HABITS, REAL MOMENTUM" title="Challenges" description="Pick one gentle challenge that fits your day. Your pace is the right pace." action={<Link to="/progress" className="button button-secondary"><Target size={16} /> View progress</Link>} />
      <Card className="challenge-progress-banner"><div className="challenge-banner-mark"><Leaf size={24} /></div><div className="challenge-progress-copy"><p className="eyebrow">YOUR SMALL WINS</p><h2>{done} of {data.challenges.length} challenges complete</h2><p>Every challenge is an invitation, not a rule.</p></div><div className="challenge-banner-progress"><strong>{Math.round(done / Math.max(1, data.challenges.length) * 100)}%</strong><ProgressBar value={done / Math.max(1, data.challenges.length) * 100} color="sage" /></div></Card>
      {justCompleted && <StateNote kind="success"><CircleCheck size={17} /> Challenge complete! Your XP has been added to your progress.</StateNote>}
      <div className="challenge-grid">{data.challenges.map((challenge, index) => <Card key={challenge.id} className={`challenge-card ${challenge.completed ? 'completed' : ''}`}><div className={`challenge-card-icon challenge-tone-${index % 4}`}>{challenge.completed ? <Check size={22} /> : index === 0 ? <Leaf size={22} /> : index === 1 ? <Sparkles size={22} /> : <Target size={22} />}</div><div className="challenge-meta"><span className="challenge-type">{challenge.completed ? 'COMPLETED' : 'A GENTLE CHALLENGE'}</span>{challenge.completed && <span className="completed-chip"><Check size={12} /> Done</span>}</div><h3>{challenge.title}</h3><p className="challenge-description">{challenge.description}</p><div className="challenge-details"><span><Clock3 size={15} /> {challenge.durationMinutes} min</span><span className="xp-reward">+{challenge.xp} XP</span></div>{started === challenge.id ? <div className="challenge-started"><p>Take this moment to complete your challenge. Ready to mark it done?</p><Button variant="sage" onClick={() => finish(challenge.id)}><Check size={15} /> Complete challenge</Button><button className="cancel-start" onClick={() => setStarted(null)}>Not yet</button></div> : <Button variant={challenge.completed ? 'quiet' : 'secondary'} onClick={() => setStarted(challenge.id)} disabled={challenge.completed}>{challenge.completed ? 'Completed' : <><Play size={15} /> Start challenge</>}</Button>}</Card>)}</div>
      <Card className="challenge-reminder"><span><Sparkles size={17} /></span><div><strong>Make it your own</strong><p>It’s okay to pause, adjust, or skip a challenge. Healthy habits should support your life—not add pressure.</p></div><Link to="/journal" aria-label="Reflect in your journal"><ArrowRight size={18} /></Link></Card>
    </div>
  )
}
