import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { ArrowUpRight, Check, Cloud, Sparkles } from 'lucide-react'
import type { AIProviderName } from '../types'

export function PageHeading({ eyebrow, title, description, action }: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'sage'
}) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="section-title"><h2>{children}</h2>{action}</div>
}

export function ProgressBar({ value, color = 'rose' }: { value: number; color?: 'rose' | 'sage' }) {
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span className={`progress-fill ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function StateNote({ children, kind = 'info' }: { children: ReactNode; kind?: 'info' | 'success' | 'error' }) {
  return <div className={`state-note ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>
}

export function DemoPill({ provider = 'demo' }: { provider?: AIProviderName }) {
  const label = provider === 'demo' ? 'DEMO MODE' : provider.toUpperCase()
  const Icon = provider === 'demo' ? Sparkles : Cloud
  return <span className="demo-pill" aria-label={provider === 'demo' ? 'Demo Mode active' : `${provider} selected; server connection may fall back to Demo Mode`}><Icon size={12} /> {label}</span>
}

export function TinyCheck({ children }: { children: ReactNode }) {
  return <span className="tiny-check"><Check size={14} />{children}</span>
}

export function LinkAction({ children }: { children: ReactNode }) {
  return <span className="link-action">{children}<ArrowUpRight size={15} /></span>
}
