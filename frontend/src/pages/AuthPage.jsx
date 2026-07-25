import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'

function AuthPage({ mode }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage(''); setIsSubmitting(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
        navigate(location.state?.from || '/explore', { replace: true })
      } else {
        const data = await api('/auth/signup', { method: 'POST', body: form })
        setMessage(data.verification?.message || 'Check your college inbox to verify your account.')
      }
    } catch (err) { setError(err.message) } finally { setIsSubmitting(false) }
  }

  return <section className="auth-page"><div className="auth-card"><span className="brand-mark">C</span><p className="eyebrow">{isLogin ? 'WELCOME BACK' : 'CAMPUS-ONLY MARKETPLACE'}</p><h1>{isLogin ? 'Sign in to CampusMart' : 'Join your campus marketplace'}</h1><p className="auth-intro">{isLogin ? 'Find great things from verified students near you.' : 'Use your college email so every exchange starts with more trust.'}</p>{isLogin && import.meta.env.DEV && <p className="dev-login-hint">Local test login: <strong>admin</strong> / <strong>12345678</strong></p>}
    <form className="form-stack" onSubmit={submit}>
      {!isLogin && <label>Full name<div className="input-with-icon"><UserRound size={18} /><input required minLength="2" value={form.name} onChange={update('name')} placeholder="Your name" /></div></label>}
      <label>{isLogin ? 'College email or test username' : 'College email'}<div className="input-with-icon"><Mail size={18} /><input required type={isLogin ? 'text' : 'email'} value={form.email} onChange={update('email')} placeholder={isLogin ? 'you@college.edu or admin' : 'you@college.edu'} /></div></label>
      <label>Password<div className="input-with-icon"><LockKeyhole size={18} /><input required type="password" minLength="8" value={form.password} onChange={update('password')} placeholder="At least 8 characters" /></div></label>
      {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success">{message} Then <Link to="/login">sign in</Link> once verified.</p>}
      <button className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isLogin ? <>Sign in <ArrowRight size={18} /></> : 'Create account'}</button>
    </form>
    <p className="auth-switch">{isLogin ? 'New here?' : 'Already verified?'} <Link to={isLogin ? '/signup' : '/login'}>{isLogin ? 'Create an account' : 'Sign in'}</Link></p>
  </div></section>
}
export default AuthPage
