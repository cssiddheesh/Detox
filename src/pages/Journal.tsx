import { ArrowRight, BookHeart, Edit3, LoaderCircle, Save, Sparkles, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, PageHeading, StateNote } from '../components/ui'
import { useAppData } from '../context/AppContext'
import { AIService } from '../services/ai'
import type { JournalEntry } from '../types'

export default function Journal() {
  const { data, saveJournal, deleteJournal } = useAppData()
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function reflect() {
    if (!text.trim() || loading) return
    setLoading(true)
    setError('')
    setNotice('')
    setInsight('')
    let streamed = ''
    try {
      const response = await AIService.chat([{ id: crypto.randomUUID(), role: 'user', content: text, createdAt: new Date().toISOString() }], { feature: 'journal' }, data.provider, data.aiSettings, (chunk) => {
        streamed = chunk ? streamed + chunk : ''
        setInsight(streamed)
      })
      setInsight(response.text)
      if (response.usedFallback) setNotice(`${response.fallbackReason ?? 'The selected provider is unavailable.'} Demo Mode created your reflection; retry or switch providers in Settings.`)
    } catch {
      setError('Reflection help is unavailable right now. Your entry is still safe to save without it.')
    } finally {
      setLoading(false)
    }
  }

  function saveEntry() {
    const content = text.trim()
    if (!content) return
    const previous = data.journalEntries.find((entry) => entry.id === editingId)
    const entry: JournalEntry = {
      id: editingId ?? crypto.randomUUID(),
      text: content,
      happened: content,
      trigger: 'A moment to notice, without judging yourself.',
      worked: 'You made time to reflect.',
      experiment: insight || previous?.experiment || 'Choose one small, kind experiment for tomorrow.',
      createdAt: previous?.createdAt ?? new Date().toISOString(),
    }
    saveJournal(entry)
    setText('')
    setInsight('')
    setEditingId(null)
    setError('')
    setNotice('Your reflection is saved on this device.')
  }

  function editEntry(entry: JournalEntry) {
    setText(entry.text)
    setInsight(entry.experiment)
    setEditingId(entry.id)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="NOTICE, REFLECT, BEGIN AGAIN" title="Reflection journal" description="A private place to notice your digital habits and decide what you want to try next." />
      <div className="journal-layout">
        <Card className="journal-compose"><div className="journal-compose-title"><span><BookHeart size={19} /></span><div><p className="eyebrow">YOUR PRIVATE SPACE</p><h2>{editingId ? 'Edit your reflection' : 'What’s on your mind today?'}</h2></div></div>
          <label className="field-label" htmlFor="journal-text">Write or dictate your thoughts</label>
          <textarea id="journal-text" className="journal-textarea" value={text} onChange={(event) => { setText(event.target.value); setInsight('') }} placeholder="Today I noticed…" maxLength={1500} rows={7} />
          <div className="journal-compose-footer"><span>{text.length} / 1500 · Saved only on this device</span><Button variant="secondary" onClick={(event) => {
            const Speech = window as Window & { SpeechRecognition?: new () => { lang: string; onresult: (result: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; start: () => void }; webkitSpeechRecognition?: new () => { lang: string; onresult: (result: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; start: () => void } }
            const Constructor = Speech.SpeechRecognition ?? Speech.webkitSpeechRecognition
            if (!Constructor) { setError('Dictation is not available in this browser. You can type your reflection instead.'); return }
            const recognition = new Constructor()
            recognition.lang = 'en-US'
            recognition.onresult = (result) => setText((current) => `${current}${current ? ' ' : ''}${result.results[0]?.[0]?.transcript ?? ''}`)
            try { recognition.start() } catch { setError('Microphone access is unavailable. You can type your reflection instead.') }
            void event
          }}><Edit3 size={15} /> Dictate</Button></div>
          {error && <StateNote kind="error">{error}</StateNote>}
          {notice && <StateNote kind="success">{notice}</StateNote>}
          {insight && <div className="journal-insight"><span><Sparkles size={17} /></span><div><p className="eyebrow">A GENTLE PERSPECTIVE</p><p>{insight}</p></div></div>}
          <div className="journal-actions"><Button variant="quiet" onClick={() => { setText(''); setInsight(''); setEditingId(null) }} disabled={!text && !editingId}><X size={15} /> Clear</Button><Button variant="secondary" onClick={() => void reflect()} disabled={!text.trim() || loading}>{loading ? <><LoaderCircle className="spin" size={15} /> Reflecting…</> : <><Sparkles size={15} /> Reflect with AI</>}</Button><Button onClick={saveEntry} disabled={!text.trim()}><Save size={15} /> Save entry</Button></div>
        </Card>
        <aside className="journal-prompt"><Card><span className="journal-flower">✳</span><p className="eyebrow">A GENTLE PROMPT</p><h3>What helped you feel present today?</h3><p>You don’t have to write a lot. One honest sentence is enough to begin.</p><div className="journal-prompt-divider" /><p className="privacy-note"><span>✓</span> Your journal stays on this device. It is only sent to an AI provider when you choose “Reflect with AI”.</p></Card></aside>
      </div>

      <section className="journal-history"><div className="journal-history-title"><div><p className="eyebrow">YOUR REFLECTIONS</p><h2>A record of your own learning</h2></div><span>{data.journalEntries.length} {data.journalEntries.length === 1 ? 'entry' : 'entries'}</span></div>
        {data.journalEntries.length === 0 ? <Card className="journal-empty"><div><BookHeart size={21} /></div><h3>Your first reflection will live here.</h3><p>When you’re ready, save a thought to keep it close.</p><ArrowRight size={17} /></Card> : <div className="journal-entry-list">{data.journalEntries.map((entry) => <Card key={entry.id} className="journal-entry"><div className="entry-date">{new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div><p>{entry.text}</p><div className="entry-reflection"><Sparkles size={14} /><span>{entry.experiment}</span></div><div className="entry-actions"><button onClick={() => editEntry(entry)}><Edit3 size={14} /> Edit</button><button onClick={() => { if (window.confirm('Delete this reflection from this device?')) deleteJournal(entry.id) }}><Trash2 size={14} /> Delete</button></div></Card>)}</div>}
      </section>
    </div>
  )
}
