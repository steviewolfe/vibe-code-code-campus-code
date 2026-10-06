# Campus Customs System Harness

## Overview

Campus Customs is a full-stack e-commerce platform for Yale merchandise with an integrated AI stylist chatbot. This harness document defines the system architecture, data models, agent capabilities, safety guardrails, and operational specifications.

**Technology Stack:**
- **Frontend:** React + Vite + TypeScript (localhost:5173)
- **Backend:** FastAPI + SQLite (localhost:8000)
- **AI Agent:** OpenAI (gpt-5.6-luna via Portkey API gateway)
- **Database:** SQLite (102 products, 612 inventory entries)
- **Auth:** JWT tokens + bcrypt password hashing

---

## Part 1: Data Models & Schema

### Why Pydantic Models Matter

Campus Customs uses Pydantic models to define strict contracts between frontend, backend, and AI agent. Each model is designed for a specific purpose:

1. **Type Safety** — Catches invalid data before it reaches the agent
2. **Agent Clarity** — AI knows exactly what fields to expect
3. **API Contracts** — Frontend and backend speak the same language
4. **Validation** — Price > 0, quantity >= 0, size must exist

### Core Enums

#### `StockStatus` — User-Friendly Stock Messages
```python
class StockStatus(str, Enum):
    IN_STOCK = "in_stock"        # quantity >= 5
    LIMITED = "limited"           # quantity 1-4
    OUT_OF_STOCK = "out_of_stock" # quantity == 0
```

**Why:** Raw numbers (e.g., "2 in stock") feel different than "limited" or "in stock". Status enums guide agent response tone:
- `in_stock` → "We have plenty available!"
- `limited` → "Only a few left"
- `out_of_stock` → "Unfortunately sold out, but here are alternatives..."

---

### Product Models

#### `ProductResult` — What Agent Receives from Database

**Fields:**
| Field | Type | Why Included |
|-------|------|-------------|
| `product_id` | str | Unique identifier for follow-up queries |
| `name` | str | Display name to user |
| `garment_type` | str | Filter results ("hoodies" vs "t-shirts") |
| `description` | str | Rich context for agent reasoning |
| `price` | float | **Critical** — never omit from agent responses |
| `colors` | List[str] | Answer color questions without extra queries |
| `in_stock` | bool | Quick availability indicator |
| `image_file_path` | Optional[str] | URL for frontend display |

**Why These Fields:**
- **price** is mandatory — never let agent guess costs
- **colors** included to avoid extra database queries for simple questions ("available in...?")
- **garment_type** enables semantic filtering and finding alternatives
- **in_stock** provides quick status; tool calls `check_inventory()` for detailed quantities

**Example:**
```python
ProductResult(
    product_id="basic-hoodie-big-yale",
    name="Basic Hoodie Big Yale",
    garment_type="pullover hoodie",
    description="Navy pullover with white YALE lettering. 80% cotton, 20% polyester.",
    price=68.0,
    colors=["navy", "black", "gray"],
    in_stock=True,
    image_file_path="products/basic-hoodie-big-yale.jpg"
)
```

---

#### `ProductCard` — What Frontend Displays

**Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| `product_id` | str | Link to `/product/{product_id}` detail page |
| `name` | str | Card heading |
| `price` | float | Display cost |
| `image_url` | str | Product thumbnail |
| `short_info` | str | 1-2 sentence description (max 200 chars) |
| `in_stock` | bool | Show "Out of Stock" badge if false |

**Why Separate from ProductResult:**
- ProductResult has full description; ProductCard has truncated `short_info` for UI
- ProductCard formatted for frontend display (image URL path, short text)
- Keeps UI and agent concerns separate

---

#### `AvailableSize` — Quantity Per Size

**Fields:**
```python
class AvailableSize(BaseModel):
    size: str = Field(..., description="Size code (XS, S, M, L, XL, XXL)")
    quantity: int = Field(..., ge=0, description="Units in stock")
```

**Why:**
Tool `get_available_sizes()` returns **only in-stock sizes** with quantities. Agent responds:
- "We have L (8 available), M (5 available), XL (2 available)" — **informative**
- NOT "We have L, M, XL" — lacks quantity info

---

#### `InventoryResult` — Stock Check Response

**Fields:**
```python
class InventoryResult(BaseModel):
    product_id: str
    size: str
    quantity: int              # Exact units available
    in_stock: bool             # Quick boolean flag
    status: StockStatus        # Enum: in_stock / limited / out_of_stock
```

**Why:**
- `quantity` and `status` are **both included** so agent can say "8 available (in stock)" or "2 left (limited)"
- Status enum guides response tone
- Never guess stock levels — always from database

---

### Chat & Response Models

#### `ChatMessage` — User and Assistant Messages

**Fields:**
```python
class ChatMessage(BaseModel):
    user_id: Optional[int]     # Null if guest user
    role: ChatRole             # "user" or "assistant"
    content: str               # Message text
    timestamp: datetime        # When sent
```

**Why:**
- Logged-in users' chat history is saved to database
- Guest users (no user_id) have ephemeral conversations
- Role field enables conversation playback and debugging

---

#### `ChatResponse` — What Agent Sends Back

**Fields:**
```python
class ChatResponse(BaseModel):
    message: str                               # Main text response
    products: Optional[List[ProductCard]]      # Search results (if any)
    cart_items: Optional[List[CartItem]]       # Updated cart
    suggested_products: Optional[List[ProductCard]]  # Alternatives
    timestamp: datetime                        # Response time
```

**Why This Structure:**
- **message** — conversational reply
- **products** — if agent called `search_products()`, these display as cards below the message
- **suggested_products** — when primary product out of stock, show alternatives
- **cart_items** — if customer added items, return current cart state
- Multiple optional fields prevent over-inclusion; only populated when relevant

**Example:** Agent searches for hoodies
```json
{
  "message": "Here are our Yale hoodies! Would you like to know about sizes or colors?",
  "products": [
    {"product_id": "basic-hoodie-big-yale", "name": "Basic Hoodie Big Yale", ...},
    {"product_id": "brooks-hoodie-yale", "name": "Brooks Brothers Hoodie", ...}
  ],
  "suggested_products": null,
  "cart_items": null,
  "timestamp": "2026-10-06T13:45:00Z"
}
```

---

#### `CartItem` — Shopping Cart Entry

**Fields:**
```python
class CartItem(BaseModel):
    product_id: str
    name: str
    size: str                  # User's selected size
    quantity: int              # Units to buy
    price: float               # Price per unit
    
    @property
    def total_price(self) -> float:
        return self.price * self.quantity
```

**Why:**
- Preserves exact product name and price at time of cart addition (prices may change)
- Size selection required before adding to cart
- Computed `total_price` for cart summary

---

## Part 2: Agent Tools & Capabilities

### Tool Philosophy

**Core Principle:** Agent **never guesses**. Every response backed by database queries.

---

### Available Tools

#### 1. `search_products(query, limit=5)`

**Returns:** `List[ProductResult]`

**What It Does:**
- Searches catalogue by keyword, garment type, or color
- Queries: `SELECT * FROM catalogue WHERE description LIKE "%query%" OR garment_type LIKE "%query%"`
- Returns up to 5 results with price, colors, and stock status

**When to Use:**
- Customer: "Show me hoodies"
- Customer: "What t-shirts do you have?"
- Customer: "Do you have anything in navy?"

**Example:**
```
Agent calls: search_products("hoodie", limit=5)
Returns: [
  ProductResult(product_id="basic-hoodie-big-yale", name="Basic Hoodie Big Yale", price=68.0, ...),
  ProductResult(product_id="brooks-hoodie-yale", name="Brooks Brothers Hoodie", price=95.0, ...)
]
```

---

#### 2. `get_product_details(product_id)`

**Returns:** `Optional[ProductResult]`

**What It Does:**
- Returns full product information for a single product
- Same fields as `search_products()` but with **complete description**

**When to Use:**
- Customer on product page asks "Tell me about this"
- Customer: "How much is the [product name]?"
- Customer: "What materials is it made from?"

**Why Separate Tool:**
- Avoids searching when product_id already known
- Loads full description (up to 500 chars vs truncated short_info)

---

#### 3. `check_inventory(product_id, size)`

**Returns:** `Optional[InventoryResult]`

**What It Does:**
- Checks stock for specific product-size combination
- Queries: `SELECT quantity, status FROM inventory WHERE product_id=? AND size=?`
- Returns exact quantity and status enum

**When to Use:**
- Customer: "Do you have size L?"
- Customer: "Is this in stock?"
- Customer: "What sizes are available?" (prompts use of next tool)

**Example:**
```
Agent calls: check_inventory("basic-hoodie-big-yale", "M")
Returns: InventoryResult(
    product_id="basic-hoodie-big-yale",
    size="M",
    quantity=5,
    in_stock=True,
    status=StockStatus.IN_STOCK
)
Response: "Yes! We have size M in stock with 5 units available."
```

---

#### 4. `get_available_sizes(product_id)`

**Returns:** `List[AvailableSize]`

**What It Does:**
- Lists all in-stock sizes for a product with exact quantities
- Filters: `SELECT size, quantity FROM inventory WHERE product_id=? AND quantity > 0`
- Returns **only sizes with quantity > 0**

**When to Use:**
- Customer: "What sizes do you have?"
- Customer: "Which sizes are in stock?"

**Why Important:**
Agent responds with quantities: **"We have L (8 available), M (5 available), XL (2 available)"**

This is **vastly better** than just "We have L, M, XL" because:
- Customer sees limited options immediately ("only 2 XL left")
- Nudges toward more available sizes
- Prevents disappointment at checkout

---

#### 5. `get_similar_products(product_id, limit=3)`

**Returns:** `List[ProductResult]`

**What It Does:**
- Finds other products with same garment_type
- Queries: `SELECT * FROM catalogue WHERE garment_type=? AND product_id!=?`
- Returns alternatives with price and availability

**When to Use:**
- Customer: "Do you have anything else in hoodies?"
- Original product is out of stock → suggest alternatives
- Customer: "What else could I try?"

**Example:**
```
Agent calls: get_similar_products("basic-hoodie-big-yale", limit=3)
Returns: [
  ProductResult(..., name="Brooks Brothers Hoodie", price=95.0, ...),
  ProductResult(..., name="Nike Yale Hoodie", price=72.0, ...)
]
Response: "Unfortunately, that specific hoodie is currently out of stock. 
           However, I found some great alternatives! Would you like to see them?"
```

---

## Part 3: Agent Safety & Guardrails

### Safety Rules (from prompt.md)

#### ✅ MUST DO — Product Information

- **Always verify inventory** before confirming availability
- **Be honest about stock** — If out of stock, acknowledge + offer alternatives
- **Provide accurate pricing** — Quote prices exactly as from database
- **Don't make up products** — If product doesn't exist, say so clearly

#### ❌ ABSOLUTELY NO — Customer Privacy & Security

- **Never ask for passwords** — Campus Customs never requests passwords in chat
- **Never handle payment info** — Don't discuss credit cards, bank details
- **Don't share personal data** — Never discuss other customers' orders
- **No unauthorized access** — Don't attempt to access or modify accounts

#### ✅ MUST FOLLOW — Responsible Communication

- **Be honest about limitations** — Explain clearly if you can't help
- **No false promises** — Don't promise unauthorized discounts or special treatment
- **Respect policies** — Follow return, refund, and exchange policies
- **Treat everyone equally** — Respect all customers regardless of background
- **Be transparent** — Identify yourself as AI (not human representative)

#### ❌ DO NOT — Prohibited Actions

- Make unauthorized promises about discounts
- Share confidential business information
- Assist with fraud (refund fraud, return fraud)
- Create fake confirmations or misleading communications
- Pretend to be a human representative
- Accept or process payments directly
- Make guarantees about future inventory without verification

---

### Tool Validation

Each tool call is wrapped in try/catch:
- **Database errors** → Returns empty list/None; agent adapts
- **Invalid product_id** → Returns None; agent offers alternatives
- **Invalid size** → Returns None; agent suggests valid sizes

Agent **never hallucinates** — if data unavailable, agent acknowledges and pivots.

---

## Part 4: System Specifications

### Deployment Specs

#### Frontend (React + Vite)

**Port:** `http://localhost:5173`

**Launch:**
```bash
cd HW4/frontend
yarn install  # First time only
yarn dev      # Runs Vite dev server
```

**Environment:**
- No .env file needed (queries http://localhost:8000)
- CORS enabled by backend
- Hot reload enabled (save = live update)

**Key Files:**
- `src/components/ChatPanel.tsx` — Chat UI + API calls
- `src/pages/Products.tsx` — Product grid
- `src/pages/ProductDetail.tsx` — Single product page
- `src/index.css` — Black-and-pink design tokens

**Browser Support:**
- Chrome, Safari, Firefox, Edge (modern versions)
- Mobile: 390px+ (responsive layout)

---

#### Backend (FastAPI)

**Port:** `http://localhost:8000`

**Launch:**
```bash
cd HW4/backend
python -m venv venv  # First time only
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Environment:**
- Requires `.env` with:
  - `PORTKEY_API_KEY` — Your Portkey API key
  - `PORTKEY_MODEL` — Default `gpt-5.6-luna` (or override)
  - `DATABASE_URL` — SQLite path (default: `sqlite:///data/campus_customs.db`)

**Key Files:**
- `main.py` — FastAPI app + `/api/chat/respond` endpoint
- `agent.py` — Agent initialization + agentic loop
- `tools.py` — Database query functions
- `models.py` — Pydantic data models
- `prompts/prompt.md` — System prompt (loaded on startup)

**API Endpoints:**
```
POST /api/chat/respond
  Query params:
    - message (required): User message text
    - user_id (optional): Logged-in user ID
    - product_id (optional): Current product ID if on product page
  Response: ChatResponse (message + optional products, cart_items, suggested_products)

GET /api/products
  Returns: List of all products (for product grid)

GET /health
  Returns: {status: "healthy", service: "Campus Customs API", timestamp: ...}
```

---

### Resource Limits & Caps

#### Database
- **Size:** 102 products, 612 inventory entries
- **Query limit:** No hard limit, but searches capped at 5 results
- **Concurrent connections:** 1 (SQLite file-based)

#### Agent Loops
- **Max tool calls per message:** 5 (prevents infinite loops)
- **Max conversation depth:** Last 5 messages loaded as history
- **Response timeout:** 30 seconds (Portkey gateway timeout)

#### Chat Storage
- **Logged-in users:** All messages saved to `chat_messages` table
- **Guest users:** Ephemeral (not persisted)
- **Message retention:** Unlimited (archival setup not implemented)

#### Frontend
- **Concurrent users:** Theoretically unlimited (but single backend process)
- **Page size limit:** Product grid: 100 items max per fetch
- **Carousel products:** 5 per search result

---

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Chat response time | < 5s | Includes Portkey + LLM latency |
| Product search | < 200ms | Database query |
| Page load | < 2s | Frontend assets + initial API calls |
| Concurrent users | 10+ | Single-machine deployment |

---

### Error Handling

**Backend → Frontend:**
- API errors return 500 status + error message
- Invalid tool calls → Agent retries or escalates to human support
- Database offline → ChatResponse returns "Service temporarily unavailable" message

**Frontend → User:**
- Network errors show: "Connection lost. Please try again."
- Chat timeout shows: "Assistant taking longer than expected..."
- Agent refusal shows: "I can't help with that. Please contact support."

---

## Part 5: System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React + Vite Frontend (localhost:5173)                  │   │
│  │  ├─ ChatPanel.tsx (chat UI + message input)              │   │
│  │  ├─ Products.tsx (product grid + filters)                │   │
│  │  ├─ ProductDetail.tsx (single product page)              │   │
│  │  └─ CSS (black-and-pink design system)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓ HTTP POST/GET                        │
│                    CORS enabled by backend                       │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                             │
│                  (localhost:8000, localhost)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  main.py                                                 │   │
│  │  ├─ FastAPI app initialization                           │   │
│  │  ├─ /api/chat/respond endpoint                           │   │
│  │  └─ CORS middleware                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  agent.py                                                │   │
│  │  ├─ Portkey client initialization (gpt-5.6-luna)         │   │
│  │  ├─ System prompt loading (prompts/prompt.md)            │   │
│  │  ├─ Agentic loop (tool call orchestration)               │   │
│  │  └─ Response formatting (ChatResponse model)             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  tools.py                                                │   │
│  │  ├─ search_products(query)                               │   │
│  │  ├─ get_product_details(product_id)                      │   │
│  │  ├─ check_inventory(product_id, size)                    │   │
│  │  ├─ get_available_sizes(product_id)                      │   │
│  │  └─ get_similar_products(product_id)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SQLite Database                                         │   │
│  │  ├─ users (authentication + personalization)             │   │
│  │  ├─ catalogue (102 products)                             │   │
│  │  ├─ inventory (612 size/stock entries)                   │   │
│  │  └─ chat_messages (conversation history)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Portkey API Gateway                           │
│         (https://api.portkey.ai/v1)                             │
│  ├─ API Key: PORTKEY_API_KEY (from .env)                        │
│  └─ Forwards to OpenAI                                          │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  OpenAI LLM Service                              │
│              Model: gpt-5.6-luna                                 │
│  ├─ Receives messages + tools from agent.py                     │
│  ├─ Decides which tools to call (tool_choice="auto")            │
│  └─ Returns tool calls or final message                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Running the Full Stack

### Step 1: Backend (First Terminal)

```bash
cd HW4/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Step 2: Frontend (Second Terminal)

```bash
cd HW4/frontend
yarn dev
```

Expected output:
```
  VITE v8.3.2  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Verify System

1. Open `http://localhost:5173` in browser
2. See emoji rain animation (landing page)
3. Click chat bubble (bottom-right)
4. Type: "Show me hoodies"
5. Chat panel displays: message + product cards (2 columns desktop, 1 mobile)

---

## Part 7: Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Pydantic models for all data** | Type safety + agent clarity; catches invalid data early |
| **SQLite (not PostgreSQL)** | Single-machine deployment; no need for separate DB server |
| **Portkey gateway (not direct OpenAI)** | Rate limiting, retry logic, API key rotation without code changes |
| **Tool-based agent (not RAG)** | Tools return **exact data from database**; no hallucination risk on prices/stock |
| **ProductCard separate from ProductResult** | UI concerns (truncated text, image URLs) separate from agent concerns (full data) |
| **StockStatus enum** | Guides agent tone; "limited" feels more urgent than "2 in stock" |
| **Logged-in user chat history** | Enables multi-turn context; guests get ephemeral chats |
| **No card processing in chat** | Security; payment happens on checkout page only |
| **Black-and-pink design system** | High contrast, data-journalism aesthetic (pudding.cool inspired) |

---

## Summary

Campus Customs is architected as a **distributed system** where:
- **Frontend** provides UI for browsing and chatting
- **Backend** orchestrates agent calls and database access
- **Agent** reasons about products using strictly-controlled tools
- **Database** is the single source of truth (no hallucination)
- **Models** enforce data contracts at every boundary

This ensures accurate, trustworthy shopping experience backed by real inventory data.
