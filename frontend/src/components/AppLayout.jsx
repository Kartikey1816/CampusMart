import { Heart, House, Menu, MessageCircle, Plus, Search, ShieldCheck, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const navigation = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/explore', label: 'Explore', icon: Search },
  { to: '/chats', label: 'Chats', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" onClick={closeMenu}>
          <span className="brand-mark">C</span>
          <span>CampusMart</span>
        </NavLink>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.slice(0, 2).map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          {user ? <><NavLink className="sell-button" to="/sell"><Plus size={18} /> Sell an item</NavLink><NavLink className="icon-button desktop-only" to="/saved" aria-label="Saved listings"><Heart size={20} /></NavLink><NavLink className="icon-button desktop-only" to="/chats" aria-label="Messages"><MessageCircle size={20} /></NavLink><NavLink className="avatar desktop-only" to="/profile" aria-label="Open profile">{user.name.slice(0, 2).toUpperCase()}</NavLink></> : <NavLink className="sell-button" to="/login"><UserRound size={18} /> Sign in</NavLink>}
          <button className="icon-button menu-button" type="button" aria-label="Open menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={closeMenu} className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}>
              <Icon size={19} /> {label}
            </NavLink>
          ))}
          {user ? <button type="button" className="logout-link" onClick={() => { logout(); closeMenu() }}>Sign out</button> : <NavLink to="/login" onClick={closeMenu} className="mobile-menu-link"><UserRound size={19} /> Sign in</NavLink>}
        </nav>
      )}

      <main><Outlet /></main>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navigation.slice(0, 2).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={20} /><span>{label}</span>
          </NavLink>
        ))}
        <NavLink className="bottom-sell" to="/sell" aria-label="Sell an item"><Plus size={23} /></NavLink>
        {navigation.slice(2).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={20} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <footer className="site-footer"><ShieldCheck size={16} /> A safer marketplace for verified students.</footer>
    </div>
  )
}

export default AppLayout
