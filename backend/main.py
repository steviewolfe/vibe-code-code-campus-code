from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator
import sqlite3
import json
from typing import List, Optional
from datetime import datetime, timedelta
import bcrypt
import jwt
import re
import asyncio
from pathlib import Path
import sys

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from agent import chat_with_agent
from models import ChatResponse as AgentChatResponse

app = FastAPI(
    title="Campus Customs API",
    description="Backend API for Campus Customs e-commerce platform",
    version="1.0.0"
)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path - resolve relative to this file
DATABASE_PATH = str(Path(__file__).parent.parent / "data" / "campus_customs.db")

# Security Configuration
SECRET_KEY = "your-secret-key-change-in-production-12345"  # Change in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
PASSWORD_MIN_LENGTH = 8

# =====================
# Pydantic Models
# =====================

class Product(BaseModel):
    product_id: str
    name: str
    garment_type: str
    description: str
    colors: List[str]
    price: float
    image_file_path: str

class InventoryItem(BaseModel):
    product_id: str
    size: str
    quantity: int

class ChatMessage(BaseModel):
    user_id: Optional[int] = None
    role: str  # "user" or "assistant"
    content: str
    products_json: Optional[str] = None

class ChatResponse(BaseModel):
    id: int
    user_id: Optional[int]
    role: str
    content: str
    products_json: Optional[str]
    created_at: str

class User(BaseModel):
    id: int
    name: str
    email: str
    first_name: str
    last_name: str

# =====================
# Authentication Models
# =====================

class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    password_confirm: str

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_names(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        if len(v) > 50:
            raise ValueError('Name must be less than 50 characters')
        return v.strip()

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < PASSWORD_MIN_LENGTH:
            raise ValueError(f'Password must be at least {PASSWORD_MIN_LENGTH} characters')
        if len(v) > 128:
            raise ValueError('Password must be less than 128 characters')
        # Check for at least one uppercase, one lowercase, one digit
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        return v

    @field_validator('password_confirm')
    @classmethod
    def validate_password_confirm(cls, v, info):
        if v != info.data.get('password'):
            raise ValueError('Passwords do not match')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class AuthError(BaseModel):
    detail: str

# =====================
# Database Functions
# =====================

def get_db_connection():
    """Get SQLite database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# =====================
# Security Functions
# =====================

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_access_token(user_id: int, email: str) -> str:
    """Create JWT access token"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# =====================
# Health Check
# =====================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Campus Customs API",
        "timestamp": datetime.now().isoformat()
    }

# =====================
# Authentication Endpoints
# =====================

@app.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister):
    """
    Register a new user account

    Password requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user_data.email,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Hash password
        password_hash = hash_password(user_data.password)
        full_name = f"{user_data.first_name} {user_data.last_name}"

        # Insert new user
        cursor.execute(
            """INSERT INTO users (name, email, password_hash, first_name, last_name, created_at)
               VALUES (?, ?, ?, ?, ?, datetime('now'))""",
            (full_name, user_data.email, password_hash, user_data.first_name, user_data.last_name)
        )
        conn.commit()

        user_id = cursor.lastrowid
        conn.close()

        # Generate token
        access_token = create_access_token(user_id, user_data.email)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user_id,
                "name": full_name,
                "email": user_data.email,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@app.post("/api/auth/login", response_model=TokenResponse)
def login(credentials: UserLogin):
    """
    Login with email and password
    Returns JWT access token
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Find user by email
        cursor.execute(
            "SELECT id, name, email, password_hash, first_name, last_name FROM users WHERE email = ?",
            (credentials.email,)
        )
        user = cursor.fetchone()
        conn.close()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Verify password
        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Generate token
        access_token = create_access_token(user["id"], user["email"])

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"]
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@app.post("/api/auth/verify")
def verify_auth(token: str):
    """Verify JWT token validity"""
    try:
        payload = verify_token(token)
        return {
            "valid": True,
            "user_id": payload.get("user_id"),
            "email": payload.get("email")
        }
    except HTTPException:
        raise

# =====================
# Products Endpoints
# =====================

@app.get("/api/products", response_model=List[dict])
def get_products(limit: int = 100, offset: int = 0):
    """Get all products from catalogue"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM catalogue LIMIT ? OFFSET ?",
            (limit, offset)
        )
        rows = cursor.fetchall()
        conn.close()

        products = []
        for row in rows:
            product = {
                "product_id": row["product_id"],
                "name": row["name"],
                "garment_type": row["garment_type"],
                "description": row["description"],
                "colors": json.loads(row["colors"]),
                "search_tags": json.loads(row["search_tags"]),
                "image_file_path": row["image_file_path"],
                "price": row["price"]
            }
            products.append(product)

        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/products/{product_id}", response_model=dict)
def get_product(product_id: str):
    """Get a specific product by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM catalogue WHERE product_id = ?", (product_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Product not found")

        product = {
            "product_id": row["product_id"],
            "name": row["name"],
            "garment_type": row["garment_type"],
            "description": row["description"],
            "colors": json.loads(row["colors"]),
            "search_tags": json.loads(row["search_tags"]),
            "image_file_path": row["image_file_path"],
            "price": row["price"]
        }

        return product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================
# Inventory Endpoints
# =====================

@app.get("/api/inventory/{product_id}")
def get_inventory(product_id: str):
    """Get inventory for a specific product"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM inventory WHERE product_id = ? ORDER BY size",
            (product_id,)
        )
        rows = cursor.fetchall()
        conn.close()

        inventory = [
            {
                "id": row["id"],
                "product_id": row["product_id"],
                "size": row["size"],
                "quantity": row["quantity"]
            }
            for row in rows
        ]

        return inventory
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================
# Chat Endpoints
# =====================

@app.post("/api/chat/message", response_model=ChatResponse)
def save_chat_message(message: ChatMessage):
    """Save a chat message to the database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """INSERT INTO chat_messages (user_id, role, content, products_json, created_at)
               VALUES (?, ?, ?, ?, datetime('now'))""",
            (message.user_id, message.role, message.content, message.products_json)
        )
        conn.commit()

        message_id = cursor.lastrowid
        cursor.execute("SELECT * FROM chat_messages WHERE id = ?", (message_id,))
        row = cursor.fetchone()
        conn.close()

        return ChatResponse(
            id=row["id"],
            user_id=row["user_id"],
            role=row["role"],
            content=row["content"],
            products_json=row["products_json"],
            created_at=row["created_at"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/history/{user_id}", response_model=List[ChatResponse])
def get_chat_history(user_id: int, limit: int = 50):
    """Get chat history for a user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT * FROM chat_messages
               WHERE user_id = ?
               ORDER BY created_at DESC
               LIMIT ?""",
            (user_id, limit)
        )
        rows = cursor.fetchall()
        conn.close()

        messages = [
            ChatResponse(
                id=row["id"],
                user_id=row["user_id"],
                role=row["role"],
                content=row["content"],
                products_json=row["products_json"],
                created_at=row["created_at"]
            )
            for row in reversed(rows)
        ]

        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_user_context(user_id: int) -> dict:
    """Get user information for agent context"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, first_name, last_name, email FROM users WHERE id = ?",
            (user_id,)
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                "id": row[0],
                "name": f"{row[1]} {row[2]}".strip(),
                "email": row[3]
            }
        return None
    except Exception as e:
        print(f"Error fetching user context: {e}")
        return None

def get_chat_history(user_id: int, limit: int = 10) -> List[dict]:
    """Get recent chat history for a user"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """SELECT role, content, created_at FROM chat_messages
               WHERE user_id = ?
               ORDER BY created_at DESC
               LIMIT ?""",
            (user_id, limit)
        )
        rows = cursor.fetchall()
        conn.close()

        # Reverse to get chronological order
        return [
            {
                "role": row[0],
                "content": row[1],
                "timestamp": row[2]
            }
            for row in reversed(rows)
        ]
    except Exception as e:
        print(f"Error fetching chat history: {e}")
        return []

def save_chat_message(user_id: int, role: str, content: str) -> bool:
    """Save a chat message to the database"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO chat_messages (user_id, role, content, created_at)
               VALUES (?, ?, ?, ?)""",
            (user_id, role, content, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving chat message: {e}")
        return False

def load_product_context(product_id: str) -> Optional[dict]:
    """Load catalogue details for the product page the user is viewing"""
    try:
        conn = get_db_connection()
        try:
            row = conn.execute(
                "SELECT * FROM catalogue WHERE product_id = ?", (product_id,)
            ).fetchone()
        finally:
            conn.close()
        if not row:
            return None
        return {
            "product_id": row["product_id"],
            "name": row["name"],
            "description": row["description"],
            "price": row["price"],
            "garment_type": row["garment_type"],
            "colors": json.loads(row["colors"]) if row["colors"] else []
        }
    except Exception as e:
        print(f"Error loading product context: {e}")
        return None

@app.post("/api/chat/respond")
async def chat_respond(message: str, user_id: int = None, product_id: str = None):
    """
    Generate a chatbot response using PydanticAI agent

    Saves chat history to database if user is logged in.
    Agent is aware of user identity, has access to chat history, and knows current product page.

    Args:
        message: User's chat message
        user_id: Optional user ID for personalization and history tracking
        product_id: Optional product ID if user is on a product page
    """
    try:
        # Blocking SQLite work runs in worker threads so the event loop stays free
        if user_id:
            await asyncio.to_thread(save_chat_message, user_id, "user", message)

        product_context = None
        if product_id:
            product_context = await asyncio.to_thread(load_product_context, product_id)

        agent_response = await chat_with_agent(message, user_id, product_context)

        if user_id:
            await asyncio.to_thread(
                save_chat_message, user_id, "assistant", agent_response.message
            )

        return {
            "message": agent_response.message,
            "products": agent_response.products or [],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Chat respond error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process chat message"
        )

# =====================
# Users Endpoints
# =====================

@app.get("/api/users/{user_id}", response_model=User)
def get_user(user_id: int):
    """Get user by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        return User(
            id=row["id"],
            name=row["name"],
            email=row["email"],
            first_name=row["first_name"] or "",
            last_name=row["last_name"] or ""
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================
# Search Endpoints
# =====================

@app.get("/api/search")
def search_products(q: str):
    """Search products by name, description, or tags"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        search_term = f"%{q}%"
        cursor.execute(
            """SELECT * FROM catalogue
               WHERE name LIKE ? OR description LIKE ? OR search_tags LIKE ?
               LIMIT 20""",
            (search_term, search_term, search_term)
        )
        rows = cursor.fetchall()
        conn.close()

        products = []
        for row in rows:
            product = {
                "product_id": row["product_id"],
                "name": row["name"],
                "garment_type": row["garment_type"],
                "description": row["description"],
                "colors": json.loads(row["colors"]),
                "search_tags": json.loads(row["search_tags"]),
                "image_file_path": row["image_file_path"],
                "price": row["price"]
            }
            products.append(product)

        return {
            "query": q,
            "count": len(products),
            "results": products
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================
# Root Endpoint
# =====================

@app.get("/")
def root():
    """Root endpoint with API documentation"""
    return {
        "service": "Campus Customs API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "products": "/api/products",
            "product_detail": "/api/products/{product_id}",
            "inventory": "/api/inventory/{product_id}",
            "search": "/api/search?q=query",
            "chat": "/api/chat/message",
            "chat_history": "/api/chat/history/{user_id}",
            "users": "/api/users/{user_id}"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
