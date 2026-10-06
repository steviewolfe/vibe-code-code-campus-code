import { useState, useContext, useEffect, useRef } from 'react'
import { AuthContext } from '../context/AuthContext'
import './ChatPanel.css'

interface ProductCard {
  product_id: string
  name: string
  price: number
  image_url: string
  short_info: string
  in_stock: boolean
}

interface ChatMessage {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  products?: ProductCard[]
}

const API_BASE_URL = 'http://localhost:8000'

function getCurrentProductId(): string | null {
  const pathMatch = window.location.pathname.match(/\/product\/([^/]+)/)
  return pathMatch ? pathMatch[1] : null
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function renderMarkdown(text: string): React.ReactNode {
  // Simple markdown: **bold**, - lists, line breaks
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  // First, handle line breaks
  const lines = text.split('\n')

  return lines.map((line, lineIdx) => {
    // Handle bold text
    const boldRegex = /\*\*(.*?)\*\*/g
    const lineParts: React.ReactNode[] = []
    let lastIdx = 0
    let match

    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        lineParts.push(line.substring(lastIdx, match.index))
      }
      lineParts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>)
      lastIdx = boldRegex.lastIndex
    }

    if (lastIdx < line.length) {
      lineParts.push(line.substring(lastIdx))
    }

    if (lineParts.length === 0) {
      lineParts.push(line)
    }

    return (
      <div key={lineIdx}>
        {lineParts}
      </div>
    )
  })
}

// SVG Icons as inline components
const HankoSealIcon = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
    <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="500" fill="currentColor" fontFamily="serif">
      問
    </text>
  </svg>
)

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const MonogramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s.5-2 4-2 4 2 4 2M9 9h.01M15 9h.01" />
  </svg>
)

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
)

interface SuggestionChip {
  text: string
  id: string
}

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [showLabel, setShowLabel] = useState(true)
  const [hasUnread, setHasUnread] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userHasInteracted, setUserHasInteracted] = useState(false)
  const [showContextNudge, setShowContextNudge] = useState(false)
  const [contextChip, setContextChip] = useState<{ id: string; name: string; price: number; image_url: string } | null>(null)

  const { user } = useContext(AuthContext) || {}
  const currentProductId = getCurrentProductId()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const focusTrapRef = useRef<HTMLDivElement>(null)
  const nudgeTimeoutRef = useRef<NodeJS.Timeout>()

  const suggestionChips: SuggestionChip[] = currentProductId
    ? [
        { text: 'What sizes are available?', id: 'size-check' },
        { text: 'Is this in another color?', id: 'color-check' },
        { text: 'Similar styles', id: 'similar' }
      ]
    : [
        { text: 'Show me hoodies', id: 'hoodies' },
        { text: "What's new", id: 'new' },
        { text: 'Gift ideas', id: 'gifts' }
      ]

  // Initialize greeting on mount
  useEffect(() => {
    const greeting = user?.first_name
      ? `${getTimeOfDayGreeting()}, ${user.first_name}. I can help you find a piece, check sizing, or confirm what's in stock.`
      : 'Welcome to Campus Customs. I can help you find a piece, check sizing, or confirm what\'s in stock.'

    setMessages([{
      id: 1,
      text: greeting,
      sender: 'bot',
      timestamp: new Date()
    }])

    // Hide label after 3 seconds
    setTimeout(() => setShowLabel(false), 3000)
  }, [user?.first_name])

  // Load persisted open state
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('chat-panel-open')
      if (saved === 'true') {
        setIsOpen(true)
      }
    } catch (e) {
      // Fail silently
    }
  }, [])

  // Persist open state
  useEffect(() => {
    try {
      sessionStorage.setItem('chat-panel-open', String(isOpen))
    } catch (e) {
      // Fail silently
    }
  }, [isOpen])

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus trap
  useEffect(() => {
    if (!isOpen || !focusTrapRef.current) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Context nudge timeout
  useEffect(() => {
    if (!isOpen && currentProductId) {
      nudgeTimeoutRef.current = setTimeout(() => {
        setShowContextNudge(true)
        // Dismiss after 5 seconds or when user interacts
        setTimeout(() => setShowContextNudge(false), 5000)
      }, 8000)
    }

    return () => {
      if (nudgeTimeoutRef.current) clearTimeout(nudgeTimeoutRef.current)
    }
  }, [isOpen, currentProductId])

  // Load product context if on product page
  useEffect(() => {
    const loadProductContext = async () => {
      if (!currentProductId) {
        setContextChip(null)
        return
      }

      try {
        const response = await fetch('/products.json')
        const products = await response.json()
        const product = products.find((p: any) => p.product_id === currentProductId)
        if (product) {
          setContextChip({
            id: product.product_id,
            name: product.name,
            price: product.price,
            image_url: product.image_file_path ? `/${product.image_file_path}` : '/products/placeholder.jpg'
          })
        }
      } catch (e) {
        // Fail silently
      }
    }

    loadProductContext()
  }, [currentProductId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setUserHasInteracted(true)
    setShowContextNudge(false)

    const userMessage = inputValue.trim()
    const userChatMessage: ChatMessage = {
      id: messages.length + 1,
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages([...messages, userChatMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const params = new URLSearchParams()
      params.append('message', userMessage)
      if (user?.id) {
        params.append('user_id', String(user.id))
      }
      if (currentProductId) {
        params.append('product_id', currentProductId)
      }

      const response = await fetch(
        `${API_BASE_URL}/api/chat/respond?${params.toString()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const botMessage: ChatMessage = {
        id: messages.length + 2,
        text: data.message || 'Sorry, I could not generate a response. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        products: data.products || undefined
      }

      setMessages(prev => [...prev, botMessage])
      setHasUnread(false)
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: messages.length + 2,
        text: 'Sorry, I encountered an error. Please make sure the backend server is running and try again.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearConversation = () => {
    const greeting = user?.first_name
      ? `${getTimeOfDayGreeting()}, ${user.first_name}. I can help you find a piece, check sizing, or confirm what's in stock.`
      : 'Welcome to Campus Customs. I can help you find a piece, check sizing, or confirm what\'s in stock.'

    setMessages([{
      id: 1,
      text: greeting,
      sender: 'bot',
      timestamp: new Date()
    }])
    setUserHasInteracted(false)
  }

  const handleOpenPanel = () => {
    setIsOpen(true)
    setHasUnread(false)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as any)
    }
  }

  const handleAutoGrow = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = '44px'
    const newHeight = Math.min(textarea.scrollHeight, 176) // Max 4 lines
    textarea.style.height = `${newHeight}px`
    setInputValue(textarea.value)
  }

  return (
    <>
      {/* Launcher */}
      {!isOpen && (
        <div className="chat-launcher-container">
          {showLabel && (
            <div className="chat-launcher-label">
              <span>Ask our stylist</span>
              <ChevronDownIcon />
            </div>
          )}
          {showContextNudge && currentProductId && contextChip && (
            <div className="context-nudge">
              Questions about the {contextChip.name}?
            </div>
          )}
          <button
            className="chat-launcher"
            onClick={handleOpenPanel}
            aria-label="Open chat"
          >
            <HankoSealIcon />
            {hasUnread && <span className="unread-dot" />}
          </button>
        </div>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="chat-panel" ref={focusTrapRef} role="dialog" aria-labelledby="chat-header-title">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <span className="chat-monogram"><MonogramIcon /></span>
              <div>
                <h3 id="chat-header-title">Campus Customs</h3>
                <p className="chat-subtitle">Personal Stylist</p>
              </div>
            </div>
            <div className="chat-header-right">
              <button
                className="chat-minimize"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize chat"
              >
                <ChevronDownIcon />
              </button>
              <div className="chat-menu-container">
                <button
                  className="chat-menu-btn"
                  aria-label="Chat menu"
                >
                  <MenuIcon />
                </button>
                <div className="chat-menu-dropdown">
                  <button onClick={handleClearConversation}>Clear conversation</button>
                  <button disabled>Email transcript</button>
                </div>
              </div>
            </div>
          </div>

          <div className="chat-status">
            <span className="status-dot" />
            Typically replies instantly
          </div>

          {/* Context Chip */}
          {contextChip && (
            <div className="context-chip">
              <img src={contextChip.image_url} alt={contextChip.name} className="context-chip-image" />
              <div className="context-chip-text">
                <p className="context-chip-label">Viewing</p>
                <p className="context-chip-name">{contextChip.name}</p>
                <p className="context-chip-price">${contextChip.price.toFixed(2)}</p>
              </div>
              <button
                className="context-chip-close"
                onClick={() => setContextChip(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages" aria-live="polite" aria-atomic="false">
            {messages.map(message => (
              <div key={message.id}>
                <div className={`chat-message ${message.sender}`}>
                  <div className="message-content">
                    {renderMarkdown(message.text)}
                  </div>
                  <span className="message-timestamp">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Product Carousel */}
                {message.products && message.products.length > 0 && (
                  <div className="product-carousel-container">
                    <div className="product-carousel">
                      {message.products.map(product => (
                        <a
                          key={product.product_id}
                          href={`/product/${product.product_id}`}
                          className="carousel-card"
                        >
                          <div className="carousel-image">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/products/placeholder.jpg'
                              }}
                            />
                            {!product.in_stock && (
                              <span className="sold-out-tag">Sold out</span>
                            )}
                          </div>
                          <p className="carousel-name">{product.name}</p>
                          <p className="carousel-price">${product.price.toFixed(2)}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Suggestion Chips */}
            {!userHasInteracted && (
              <div className="suggestion-chips">
                {suggestionChips.map(chip => (
                  <button
                    key={chip.id}
                    className="suggestion-chip"
                    onClick={() => {
                      setInputValue(chip.text)
                      setUserHasInteracted(true)
                    }}
                  >
                    {chip.text}
                  </button>
                ))}
              </div>
            )}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="chat-message bot">
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
                <span className="sr-only">Stylist is typing</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="chat-composer">
            <form onSubmit={handleSendMessage} className="composer-form">
              <textarea
                ref={inputRef}
                className="composer-input"
                placeholder="Ask about a product, size, or color"
                value={inputValue}
                onChange={handleAutoGrow}
                onKeyDown={handleInputKeyDown}
                disabled={isLoading}
                rows={1}
                style={{ resize: 'none' }}
              />
              <button
                type="submit"
                className="composer-send"
                disabled={!inputValue.trim() || isLoading}
                aria-label="Send message"
              >
                <ArrowIcon />
              </button>
            </form>
            <p className="composer-footer">AI stylist. Verify details at checkout.</p>
          </div>
        </div>
      )}
    </>
  )
}
