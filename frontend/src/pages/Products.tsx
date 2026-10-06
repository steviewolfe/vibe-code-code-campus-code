import { useState, useEffect } from 'react'
import '../styles/pages.css'

interface Product {
  product_id: string
  name: string
  garment_type: string
  description: string
  colors: string
  search_tags: string
  image_file_path: string
  price: number
}

interface ProductsProps {
  onSelectProduct: (productId: string) => void
}

const CATEGORIES = ['ALL', 'T-SHIRTS', 'HOODIES', 'JACKETS', 'CREWNECK']

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

export function Products({ onSelectProduct }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('featured')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/products.json')
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = selectedCategory === 'ALL'
    ? products
    : products.filter(p => {
        const type = p.garment_type.toUpperCase().replace(/&|AND/g, '').replace(/\s+/g, '')
        const category = selectedCategory.replace(/&|AND/g, '').replace(/\s+/g, '')
        return type.includes(category)
      })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.product_id.localeCompare(a.product_id)
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      default:
        return 0
    }
  })

  const colorMap: { [key: string]: string } = {
    black: '#000000',
    white: '#ffffff',
    navy: '#001f3f',
    red: '#ff4136',
    blue: '#0074d9',
    green: '#2ecc40',
    yellow: '#ffdc00',
    gray: '#aaaaaa',
  }

  const getColorDots = (colorStr: string) => {
    if (!colorStr) return []
    return colorStr.split(',').map(c => c.trim().toLowerCase()).slice(0, 3)
  }

  return (
    <div className="products-page">
      {/* Header */}
      <div className="products-header">
        <h2>The Collection</h2>
        <div className="products-count">{sortedProducts.length} pieces</div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="products-toolbar">
        {/* Filters */}
        <div className="products-filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-toggle ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="sort-control">
          <label htmlFor="sort-select" className="sort-label">Sort:</label>
          <select
            id="sort-select"
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="products-page" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <p>Loading products...</p>
        </div>
      ) : (
        <div className="products-grid">
          {sortedProducts.map(product => {
            const colors = getColorDots(product.colors)
            const isOutOfStock = false // placeholder

            return (
              <div
                key={product.product_id}
                className={`product-card ${isOutOfStock ? 'sold-out' : ''}`}
                onClick={() => onSelectProduct(product.product_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSelectProduct(product.product_id)
                  }
                }}
              >
                <div className="product-plate">
                  <div className="product-image">
                    <img
                      src={`/${product.image_file_path}`}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.src = '/products/placeholder.jpg'
                      }}
                    />
                  </div>
                </div>

                <div className="product-info">
                  <span className="product-number">No. {product.product_id.slice(0, 3).toUpperCase()}</span>
                  <span className="product-type">{product.garment_type.toUpperCase()}</span>
                </div>

                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">${product.price.toFixed(2)}</p>

                {colors.length > 0 && (
                  <div className="product-colors">
                    {colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="color-dot"
                        style={{
                          backgroundColor: colorMap[color] || '#cccccc',
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                )}

                <p className="product-stock">
                  {isOutOfStock ? <span className="sold-out">完売</span> : <span>在庫あり</span>}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
