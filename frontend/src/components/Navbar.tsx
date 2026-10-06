import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

interface NavbarProps {
  onNavigate: (page: string) => void
  onAuthPageOpen: (page: 'login' | 'register') => void
}

export function Navbar({ onNavigate, onAuthPageOpen }: NavbarProps) {
  const { isAuthenticated, user, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)

  const mastheadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Use IntersectionObserver to detect when masthead is out of view
    // This avoids expensive scroll events and causes smooth condensing
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '0px' }
    )

    if (mastheadRef.current) {
      observer.observe(mastheadRef.current)
    }

    return () => {
      if (mastheadRef.current) {
        observer.unobserve(mastheadRef.current)
      }
    }
  }, [])

  const handleLogout = () => {
    logout()
    onNavigate('home')
  }

  return (
    <nav className={`navbar ${isScrolled ? 'navbar--condensed' : ''}`}>
      {/* Masthead (full version) */}
      <div className="navbar-masthead" ref={mastheadRef}>
        <div className="masthead-dateline">EST. NEW HAVEN <span lang="ja">新学期</span> AUTUMN 2026</div>
        <h1 className="masthead-wordmark" onClick={() => onNavigate('home')}>
          CAMPUS <em>Customs</em>
        </h1>
        <div className="masthead-rules">
          <div className="rule"></div>
          <div className="rule-gap"></div>
          <div className="rule"></div>
        </div>
      </div>

      {/* Navigation row */}
      <div className="navbar-wrapper">
        <ul className="navbar-nav">
          <li>
            <a onClick={() => onNavigate('home')} className="nav-link">
              <span className="nav-label">home</span>
              <span className="nav-kanji" lang="ja">ホーム</span>
            </a>
          </li>
          <li>
            <a onClick={() => onNavigate('products')} className="nav-link">
              <span className="nav-label">products</span>
              <span className="nav-kanji" lang="ja">商品</span>
            </a>
          </li>
          <li>
            <a onClick={() => onNavigate('about')} className="nav-link">
              <span className="nav-label">about us</span>
              <span className="nav-kanji" lang="ja">私たちについて</span>
            </a>
          </li>
        </ul>

        <div className="navbar-right">
          {isAuthenticated && user ? (
            <>
              <span className="user-greeting">{user.first_name}</span>
              <button
                className="navbar-auth-btn"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                className="navbar-auth-btn"
                onClick={() => onAuthPageOpen('login')}
              >
                Log in
              </button>
              <button
                className="navbar-auth-btn"
                onClick={() => onAuthPageOpen('register')}
              >
                Create account
              </button>
            </>
          )}
          <button className="navbar-cart" aria-label="Cart" title="Cart">
            Cart (0)
          </button>
        </div>
      </div>

      {/* Hairline separator */}
      <div className="navbar-separator"></div>
    </nav>
  )
}
