import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function RequireAuth({ children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <section className="detail-state"><p className="eyebrow">CAMPUSMART</p><h1>Checking your account…</h1></section>
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
}

export default RequireAuth
