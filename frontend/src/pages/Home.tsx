import { useState, useEffect } from 'react'
import { ClothingRain } from '../components/ClothingRain'
import '../styles/pages.css'

interface Product {
  product_id: string
  name: string
  price: number
  image_file_path: string
  garment_type: string
}

interface HomeProps {
  onSelectProduct?: (productId: string) => void
  onNavigate?: (page: string) => void
}

export function Home({ onSelectProduct, onNavigate }: HomeProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const response = await fetch('/products.json')
        const data = await response.json()
        // Get first 4 products as featured
        setFeaturedProducts(data.slice(0, 4))
      } catch (error) {
        console.error('Error loading featured products:', error)
      }
    }
    loadFeaturedProducts()
  }, [])

  const handleShopClick = () => {
    if (onNavigate) {
      onNavigate('products')
    }
  }

  return (
    <div className="home-page">
      <ClothingRain />
      {/* Hero section */}
      <section className="home-hero">
        <div className="hero-canvas">
          <div className="hero-content">
            <h1 className="hero-title">
              <span>The Yale</span>
              <span>Edit</span>
            </h1>
            {/* Hanko seal */}
            <svg className="hanko-seal" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" fill="none" stroke="var(--shu)" strokeWidth="2" />
              <circle cx="40" cy="40" r="36" fill="none" stroke="var(--shu)" strokeWidth="1" opacity="0.5" />
              <text x="40" y="48" textAnchor="middle" fontSize="24" fontWeight="500" fill="var(--shu)" fontFamily="var(--font-jp)" lang="ja">
                校
              </text>
            </svg>

            <div className="hero-issue">Vol. 01 — The Yale Edit</div>
            <p className="hero-tagline">Discover officially licensed Yale merchandise designed for students and alumni.</p>

            <button className="hero-cta" onClick={handleShopClick}>
              Enter Campus Customs <span>→</span>
            </button>
          </div>

          {/* Vertical caption on the right */}
          <div className="hero-caption" lang="ja">
            <span>新</span><span>着</span>
          </div>
        </div>
      </section>

      {/* Editorial features section */}
      <section className="home-features">
        <div className="features-list">
          <div className="feature-item">
            <span className="feature-index">01</span>
            <div className="feature-content">
              <h3>Official <span lang="ja">公式</span></h3>
              <p>Officially licensed Yale University merchandise backed by quality and authenticity.</p>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-index">02</span>
            <div className="feature-content">
              <h3>Premium <span lang="ja">品質</span></h3>
              <p>High-quality apparel from trusted brands designed for durability and comfort.</p>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-index">03</span>
            <div className="feature-content">
              <h3>Shipping <span lang="ja">配送</span></h3>
              <p>Quick delivery to get your Yale gear when you need it most.</p>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-index">04</span>
            <div className="feature-content">
              <h3>Spirit <span lang="ja">精神</span></h3>
              <p>Represent your Yale pride with iconic designs and exclusive collections.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured collections carousel */}
      <section className="home-collections">
        <div className="collections-header">
          <h2>Featured Collections</h2>
          <div className="collections-progress">
            <div className="progress-bar"></div>
          </div>
        </div>

        <div className="collections-carousel">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product, idx) => (
              <div
                key={product.product_id}
                className="collection-card"
                onClick={() => onSelectProduct?.(product.product_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSelectProduct?.(product.product_id)
                  }
                }}
              >
                <div className="collection-number">{String(idx + 1).padStart(2, '0')}</div>
                <div className="collection-thumb">
                  <img
                    src={`/${product.image_file_path}`}
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.src = '/products/placeholder.jpg'
                    }}
                  />
                </div>
                <h4>{product.name}</h4>
                <p className="collection-type">{product.garment_type}</p>
                <p className="collection-price">${product.price.toFixed(2)}</p>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
              <p>Loading featured collection...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}