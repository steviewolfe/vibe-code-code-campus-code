from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime

# =====================
# Enums
# =====================

class StockStatus(str, Enum):
    """Product stock status"""
    IN_STOCK = "in_stock"
    LIMITED = "limited"
    OUT_OF_STOCK = "out_of_stock"

class ChatRole(str, Enum):
    """Chat message role"""
    USER = "user"
    ASSISTANT = "assistant"

# =====================
# Product Models
# =====================

class ProductResult(BaseModel):
    """Product search result"""
    product_id: str
    name: str
    garment_type: str
    description: str
    price: float
    colors: List[str]
    in_stock: bool
    image_file_path: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "basic-hoodie-big-yale",
                "name": "Basic Hoodie Big Yale",
                "garment_type": "pullover hoodie",
                "description": "Navy pullover with white YALE lettering",
                "price": 68.0,
                "colors": ["navy", "black"],
                "in_stock": True,
                "image_file_path": "products/basic-hoodie-big-yale.jpg"
            }
        }

class ProductCard(BaseModel):
    """Product card for display in UI"""
    product_id: str = Field(..., description="Unique product identifier")
    name: str = Field(..., description="Product display name")
    price: float = Field(..., gt=0, description="Price in USD")
    image_url: str = Field(..., description="Path to product image")
    short_info: str = Field(..., max_length=200, description="Brief description (1-2 sentences)")
    in_stock: bool = Field(..., description="Stock availability")

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "basic-hoodie-big-yale",
                "name": "Basic Hoodie Big Yale",
                "price": 68.0,
                "image_url": "/products/basic-hoodie-big-yale.jpg",
                "short_info": "Navy pullover hoodie with white YALE lettering",
                "in_stock": True
            }
        }

class AvailableSize(BaseModel):
    """Available size with quantity"""
    size: str = Field(..., description="Size code (XS, S, M, L, XL, XXL)")
    quantity: int = Field(..., ge=0, description="Units in stock")

    class Config:
        json_schema_extra = {
            "example": {
                "size": "L",
                "quantity": 8
            }
        }

# =====================
# Inventory Models
# =====================

class InventoryResult(BaseModel):
    """Inventory check result for a specific product-size combination"""
    product_id: str
    size: str = Field(..., description="Size code")
    quantity: int = Field(..., ge=0, description="Available quantity")
    in_stock: bool = Field(..., description="Whether item is available")
    status: StockStatus = Field(
        default=StockStatus.OUT_OF_STOCK,
        description="Stock status level"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "basic-hoodie-big-yale",
                "size": "L",
                "quantity": 8,
                "in_stock": True,
                "status": "in_stock"
            }
        }

# =====================
# Cart Models
# =====================

class CartItem(BaseModel):
    """Item in shopping cart"""
    product_id: str
    name: str
    size: str
    quantity: int = Field(..., ge=1, description="Must be at least 1")
    price: float = Field(..., gt=0, description="Price per unit")

    @property
    def total_price(self) -> float:
        """Calculate total price for this item"""
        return self.price * self.quantity

# =====================
# Chat Models
# =====================

class ChatMessage(BaseModel):
    """Chat message (user or assistant)"""
    user_id: Optional[int] = Field(None, description="User ID if logged in")
    role: ChatRole = Field(..., description="Who sent the message")
    content: str = Field(..., min_length=1, description="Message text")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "role": "user",
                "content": "Do you have any Yale hoodies?",
                "timestamp": "2026-10-06T07:48:00Z"
            }
        }

class ChatResponse(BaseModel):
    """Response from chatbot agent"""
    message: str = Field(..., description="Main response message from agent")
    products: Optional[List[ProductCard]] = Field(
        None,
        description="Product cards for UI display (if search results)"
    )
    cart_items: Optional[List[CartItem]] = Field(
        None,
        description="Current cart contents if cart was updated"
    )
    suggested_products: Optional[List[ProductCard]] = Field(
        None,
        description="Similar/recommended product cards for display"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="When response was generated"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "message": "I found a Basic Hoodie Big Yale for $68. Would you like to know about sizes?",
                "products": [
                    {
                        "product_id": "basic-hoodie-big-yale",
                        "name": "Basic Hoodie Big Yale",
                        "garment_type": "pullover hoodie",
                        "description": "Navy pullover with white YALE lettering",
                        "price": 68.0,
                        "colors": ["navy"],
                        "in_stock": True
                    }
                ],
                "timestamp": "2026-10-06T07:48:00Z"
            }
        }
