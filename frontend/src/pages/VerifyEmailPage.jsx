import { CircleCheckBig } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'

function VerifyEmailPage() {
  const [params] = useSearchParams(); const [state, setState] = useState({ loading: true, error: '' })
  useEffect(() => { const token = params.get('token'); if (!token) { setState({ loading: false, error: 'This verification link is missing its token.' }); return }; api('/auth/verify-email', { method: 'POST', body: { token } }).then(() => setState({ loading: false, error: '' })).catch((err) => setState({ loading: false, error: err.message })) }, [params])
  return <section className="auth-page"><div className="auth-card verification-card"><CircleCheckBig size={45} /><p className="eyebrow">COLLEGE EMAIL</p><h1>{state.loading ? 'Verifying your email…' : state.error || 'Your email is verified.'}</h1><p className="auth-intro">{state.loading ? 'Just a moment.' : state.error ? 'Request a new verification email if this link has expired.' : 'You can now sign in and start buying or selling safely on campus.'}</p>{!state.loading && !state.error && <Link className="primary-button" to="/login">Sign in</Link>}</div></section>
}
export default VerifyEmailPage
