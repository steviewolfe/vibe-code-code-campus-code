import { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { ChatPanel } from './components/ChatPanel'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Products } from './pages/Products'
import { AboutUs } from './pages/AboutUs'
import { ProductDetail } from './pages/ProductDetail'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import './App.css'

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [authPage, setAuthPage] = useState<'login' | 'register' | null>(null)

  const renderPage = () => {
    if (authPage === 'login') {
      return (
        <Login
          onLoginSuccess={() => {
            setAuthPage(null)
            setCurrentPage('home')
          }}
          onSwitchToRegister={() => setAuthPage('register')}
        />
      )
    }

    if (authPage === 'register') {
      return (
        <Register
          onRegisterSuccess={() => {
            setAuthPage(null)
            setCurrentPage('home')
          }}
          onSwitchToLogin={() => setAuthPage('login')}
        />
      )
    }

    if (selectedProductId) {
      return (
        <ProductDetail
          productId={selectedProductId}
          onBackClick={() => {
            setSelectedProductId(null)
            setCurrentPage('products')
          }}
        />
      )
    }

    switch (currentPage) {
      case 'products':
        return <Products onSelectProduct={setSelectedProductId} />
      case 'about':
        return <AboutUs />
      case 'home':
      default:
        return <Home onNavigate={handleNavigation} />
    }
  }

  const handleNavigation = (page: string) => {
    setCurrentPage(page)
    setSelectedProductId(null)
    setAuthPage(null)
    window.scrollTo(0, 0)
  }

  const handleAuthPageOpen = (page: 'login' | 'register') => {
    setAuthPage(page)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <Navbar onNavigate={handleNavigation} onAuthPageOpen={handleAuthPageOpen} />
      {renderPage()}
      <ChatPanel />
      <Footer />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
