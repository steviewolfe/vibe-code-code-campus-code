import { useState, useEffect } from 'react'
import '../styles/product-detail.css'

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

interface InventoryItem {
  id: number
  product_id: string
  size: string
  quantity: number
}

interface ProductDetailProps {
  productId: string
  onBackClick: () => void
}

export function ProductDetail({ productId, onBackClick }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all products
        const productsResponse = await fetch('/products.json')
        const allProducts = await productsResponse.json()
        const foundProduct = allProducts.find((p: Product) => p.product_id === productId)
        setProduct(foundProduct)

        // Fetch inventory
        const inventoryResponse = await fetch('/inventory.json')
        const allInventory = await inventoryResponse.json()
        const productInventory = allInventory.filter((item: InventoryItem) => item.product_id === productId)
        setInventory(productInventory)

        // Set default size if available
        if (productInventory.length > 0) {
          setSelectedSize(productInventory[0].size)
        }
      } catch (error) {
        console.error('Error loading product details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [productId])

  if (loading) return <div className="product-detail-container"><p>Loading product...</p></div>
  if (!product) return <div className="product-detail-container"><p>Product not found</p></div>

  const selectedInventory = inventory.find(item => item.size === selectedSize)
  const colors = JSON.parse(product.colors)
  const tags = JSON.parse(product.search_tags)

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return 'Out of Stock'
    if (quantity < 5) return 'Low Stock'
    if (quantity < 15) return 'Limited Stock'
    return 'In Stock'
  }

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

  return (
    <div className="product-detail-page">
      <button className="back-button" onClick={onBackClick}>← Back</button>

      <div className="product-detail-layout">
        {/* Image */}
        <div className="product-image-container">
          <div className="product-image-sticky">
            <div className="product-image-large">
              <img
                src={`/${product.image_file_path}`}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.src = '/products/placeholder.jpg'
                }}
              />
            </div>
            <div className="product-image-caption" lang="ja">商品</div>
          </div>
        </div>

        {/* Details */}
        <div className="product-details">
          <div className="product-details-header">
            <p className="detail-number">No. {product.product_id.slice(0, 3).toUpperCase()}</p>
            <h1 className="detail-name">{product.name}</h1>
            <p className="detail-price">${product.price.toFixed(2)}</p>
          </div>

          <p className="detail-description">{product.description}</p>

          <div className="detail-options">
            {/* Color selection */}
            {colors && colors.length > 0 && (
              <div className="option-group">
                <label className="option-label" lang="ja">色 (Color)</label>
                <div className="product-colors">
                  {colors.slice(0, 5).map((color: string, idx: number) => (
                    <div
                      key={idx}
                      className="color-dot"
                      style={{ backgroundColor: colorMap[color.toLowerCase()] || '#cccccc' }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selection */}
            <div className="option-group">
              <label className="option-label" lang="ja">サイズ (Size)</label>
              <div className="size-options">
                {inventory.length > 0 ? (
                  inventory.map(item => {
                    const isOutOfStock = item.quantity === 0
                    const isLowStock = item.quantity > 0 && item.quantity < 5
                    return (
                      <button
                        key={item.size}
                        className={`size-btn ${selectedSize === item.size ? 'selected' : ''}`}
                        onClick={() => !isOutOfStock && setSelectedSize(item.size)}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? '完売' : `${item.quantity} available`}
                      >
                        {item.size}
                        {isOutOfStock && <span className="sold-out-badge">完売</span>}
                        {isLowStock && <span className="low-stock-badge">残りわずか - {item.quantity}</span>}
                      </button>
                    )
                  })
                ) : (
                  <p>No sizes available</p>
                )}
              </div>
            </div>
          </div>

          <button
            className="add-to-cart-btn"
            disabled={!selectedInventory || selectedInventory.quantity === 0}
            onClick={() => {
              if (selectedInventory && selectedInventory.quantity > 0) {
                console.log(`Added ${product.name} (Size ${selectedSize}) to cart`)
              }
            }}
          >
            {!selectedInventory || selectedInventory.quantity === 0 ? '完売' : 'ADD TO CART  カートに入れる'}
          </button>

          <div className="detail-specs">
            <div className="spec-list">
              <div className="spec-item">
                <div className="spec-label">Type</div>
                <div className="spec-value">{product.garment_type}</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">Product ID</div>
                <div className="spec-value">{product.product_id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
