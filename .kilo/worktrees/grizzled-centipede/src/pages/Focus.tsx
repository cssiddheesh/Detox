import { Check, Pause, Play, RotateCcw, Timer, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, PageHeading, ProgressBar } from '../components/ui'
import { useAppData } from '../context/AppContext'
import type { FocusSession } from '../types'

const durations = [15, 25, 45]

export default function Focus() {
  const { completeFocus } = useAppData()
  const [duration, setDuration] = useState(25)
  const [remaining, setRemaining] = useState(25 * 60)
  const [task, setTask] = useState('')
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [rating, setRating] = useState(4)
  const [awaitingRating, setAwaitingRating] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!running || paused) return
    const timer = window.setInterval(() => setRemaining((time) => Math.max(0, time - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [running, paused])

  useEffect(() => {
    if (running && remaining === 0) {
      setRunning(false)
      setAwaitingRating(true)
    }
  }, [remaining, running])

  function selectDuration(value: number) {
    if (running) return
    setDuration(value)
    setRemaining(value * 60)
  }

  function start() {
    if (!task.trim()) return
    setSaved(false)
    setAwaitingRating(false)
    setPaused(false)
    if (remaining === 0) setRemaining(duration * 60)
    setRunning(true)
  }

  function finish() {
    setRunning(false)
    setPaused(false)
    setAwaitingRating(true)
  }

  function saveSession() {
    const elapsed = Math.max(1, Math.floor((duration * 60 - remaining) / 60))
    const session: FocusSession = {
      id: crypto.randomUUID(),
      task: task.trim() || 'Focused work',
      durationMinutes: elapsed,
      focusRating: rating,
      completed: true,
      createdAt: new Date().toISOString(),
    }
    completeFocus(session)
    setAwaitingRating(false)
    setSaved(true)
    setRemaining(duration * 60)
  }

  function reset() {
    setRunning(false)
    setPaused(false)
    setAwaitingRating(false)
    setRemaining(duration * 60)
    setSaved(false)
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')
  const progress = (1 - remaining / (duration * 60)) * 100

  return (
    <div className="page-stack focus-page">
      <PageHeading eyebrow="ONE THING AT A TIME" title="Focus mode" description="A little space for the work that matters right now." />
      <div className="focus-layout">
        <Card className={`focus-main ${running ? 'in-session' : ''}`}>
          {!running && !awaitingRating && !saved && <>
            <div className="focus-welcome-icon"><Timer size={25} /></div>
            <p className="eyebrow">SET YOUR INTENTION</p>
            <h2>What would you like to focus on?</h2>
            <p className="focus-intro">Choose one task and a time that feels manageable. You can stop whenever you need.</p>
            <label className="field-label" htmlFor="focus-task">Your focus task</label>
            <input id="focus-task" className="text-input" value={task} onChange={(event) => setTask(event.target.value)} placeholder="e.g. Biology — revise cell structure" maxLength={100} />
            <span className="field-label duration-label">Choose a duration</span>
            <div className="duration-options">{durations.map((value) => <button key={value} className={duration === value ? 'selected' : ''} onClick={() => selectDuration(value)}>{value}<small>min</small></button>)}</div>
            <Button className="focus-start" onClick={start} disabled={!task.trim()}><Play size={17} fill="currentColor" /> Start focus</Button>
          </>}
          {(running || paused) && <>
            <div className="focus-session-top"><span className="live-badge"><i /> FOCUS SESSION</span><button className="icon-button" onClick={finish} aria-label="Finish focus session"><X size={19} /></button></div>
            <p className="eyebrow">{task || 'YOUR FOCUS'}</p>
            <div className="timer-display" aria-live="polite">{minutes}<span>:</span>{seconds}</div>
            <p className="timer-subtitle">{paused ? 'Take a breath. Resume when you’re ready.' : 'Stay with this one thing.'}</p>
            <ProgressBar value={progress} color="sage" />
            <div className="focus-controls"><Button variant={paused ? 'primary' : 'secondary'} onClick={() => setPaused(!paused)}>{paused ? <Play size={17} /> : <Pause size={17} />}{paused ? 'Resume' : 'Pause'}</Button><Button variant="quiet" onClick={finish}><Check size={17} /> Finish session</Button></div>
            <p className="gentle-reminder">Your progress is yours. A pause is part of the process.</p>
          </>}
          {awaitingRating && <div className="focus-rating"><div className="completion-mark"><Check size={27} /></div><p className="eyebrow">NICE WORK</p><h2>You made space to focus.</h2><p>How focused did you feel during this session?</p><div className="rating-options" role="group" aria-label="Focus rating">{[1, 2, 3, 4, 5].map((value) => <button key={value} className={rating === value ? 'selected' : ''} onClick={() => setRating(value)} aria-pressed={rating === value}>{value}</button>)}</div><div className="rating-scale"><span>Hard to settle in</span><span>Really present</span></div><Button onClick={saveSession}><Check size={17} /> Save focus session · +20 XP</Button></div>}
          {saved && <div className="focus-rating"><div className="completion-mark"><Check size={27} /></div><p className="eyebrow">SESSION SAVED</p><h2>One thoughtful step at a time.</h2><p>Your focus session and +20 XP have been added to your progress.</p><Button onClick={reset}><RotateCcw size={16} /> Start another session</Button></div>}
        </Card>
        <div className="focus-aside">
          <Card className="focus-tip"><span className="tip-number">01</span><p className="eyebrow">A GENTLE TIP</p><h3>Make starting easy.</h3><p>Put your phone out of reach, take one breath, and begin with the first small part of your task.</p><div className="tip-leaf">✳</div></Card>
          <Card className="focus-stat"><div className="focus-stat-icon"><Timer size={19} /></div><p className="eyebrow">FOCUSED TODAY</p><strong>{duration - Math.ceil(remaining / 60)} <small>min</small></strong><p>Every focused minute counts.</p></Card>
        </div>
      </div>
    </div>
  )
}
