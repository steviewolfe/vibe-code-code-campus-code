# Campus Customs — Yale E-Commerce Platform with AI Stylist

A full-stack e-commerce application for Yale merchandise with an integrated AI-powered personal stylist chatbot. Built with React, FastAPI, and OpenAI (via Portkey).

## Overview

**Campus Customs** is a showcase project demonstrating:
- Modern React/Vite frontend with responsive design (black-and-pink pudding.cool aesthetic)
- FastAPI backend with async request handling
- PydanticAI agent loop for conversational product search
- SQLite database with 102 products and semantic search
- JWT authentication with bcrypt password hashing
- Tool-based agentic architecture (search, inventory check, size availability, recommendations)

**Status:** Fully functional with QA report (11 journeys documented, 10 screenshots, responsive mobile view)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS |
| **Backend** | FastAPI + SQLite + Pydantic |
| **AI** | OpenAI (gpt-5.6-luna) via Portkey API gateway |
| **Auth** | JWT tokens + bcrypt (12 rounds) |
| **Testing** | Playwright (screenshot automation) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- `.env` file with `PORTKEY_API_KEY` (see [Setup](#setup) below)

### 1. Frontend (React + Vite)

```bash
cd frontend
yarn install
yarn dev
```

Runs on **http://localhost:5173** with hot reload enabled.

**Key directories:**
- `src/pages/` — Page components (Home, Products, ProductDetail, About)
- `src/components/` — Reusable UI (ChatPanel, Navbar, ProductCard, ClothingRain)
- `src/styles/` — Global CSS + component styles
- `src/index.css` — Color tokens (#ff2e93 pink, #0a0a0a black)

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Runs on **http://localhost:8000** with auto-reload on code changes.

**Key files:**
- `main.py` — FastAPI app + `/api/chat/respond` endpoint
- `agent.py` — Agentic loop, tool orchestration, prompt loading
- `tools.py` — Database query functions (search, inventory, sizes)
- `models.py` — Pydantic data models (ProductResult, ChatResponse, etc.)
- `prompts/prompt.md` — System prompt (agent personality, guardrails)

### 3. Verify Setup

**Frontend health check:**
```bash
curl http://localhost:5173 | grep -i "title"
```

**Backend health check:**
```bash
curl http://localhost:8000/health | jq .
```

---

## Setup

### Environment Variables

Create `backend/.env`:

```bash
DATABASE_PATH=the-link-to-your-db
FRONTEND_URL=http://localhost:5173
DEBUG=True
PORTKEY_API_KEY=your_portkey_api_key_here
PORTKEY_BASE_URL=https://api.portkey.ai/v1
PORTKEY_MODEL=gpt-5.6-luna
SECRET_KEY=your-secret-key-change-in-production-12345
```

**⚠️ SECURITY:**
- Never commit `.env` files (they're in `.gitignore`)
- Rotate `PORTKEY_API_KEY` if exposed
- Change `SECRET_KEY` in production
- Use a proper secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) in production

---

## Project Structure

```
HW4/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── styles/           # CSS modules
│   │   └── index.css         # Global styles + color tokens
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                   # FastAPI backend
│   ├── main.py               # App entry point + endpoints
│   ├── agent.py              # Agentic loop
│   ├── tools.py              # Database query functions
│   ├── models.py             # Pydantic models
│   ├── prompts/
│   │   └── prompt.md         # System prompt
│   ├── requirements.txt
│   └── .env                  # (local only, not committed)
│
├── data/
│   ├── campus_customs.db     # SQLite database
│   └── products/             # Product images/data
│
├── output/                    # QA artifacts
│   ├── app_check.html        # QA report (11 journeys)
│   ├── app_check_images/     # Screenshots (10)
│   ├── audit_trail.json      # Activity telemetry
│   ├── harness.md            # System architecture
│   └── design.md             # Design system documentation
│
└── README.md                  # This file
```

---

## Key Features

### 🎨 Design System (Pudding.cool Aesthetic)
- **Colors:** Pink (#ff2e93), Ink Black (#0a0a0a), White
- **Borders:** 2–3px solid black (no rounding)
- **Shadows:** Hard offset (4–8px, no blur)
- **Animation:** Emoji rain on landing (80 emojis, 3 seconds)

### 💬 AI Stylist Chat
- **Launch:** Hot pink circular button (bottom-right, all pages)
- **Context:** Shows current product on detail pages
- **Tools:** Search, inventory check, size availability, recommendations
- **Personas:** Warm, personalized, honest about stock

### 🛍️ Product Browsing
- **Catalog:** 102 products (hoodies, t-shirts, hats, etc.)
- **Grid:** 4 columns desktop → 2 tablet → 1 mobile
- **Filters:** Category, price range, sort options
- **Stock:** Real-time inventory tracking by size

### 👤 Authentication
- **Registration:** Email, password, name collection
- **Security:** Bcrypt hashing (12 rounds), JWT tokens
- **Sessions:** Persistent for logged-in users
- **Chat History:** Saved per user, ephemeral for guests

### 📱 Responsive Design
- **Desktop:** 1440px (4-column grid, chat panel side-by-side)
- **Tablet:** 768px (2-column grid, full-width chat)
- **Mobile:** 390px (1-column grid, full-screen chat overlay)

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | System health check |
| `/api/products` | GET | List all products |
| `/api/chat/respond` | POST | AI chat message + tool orchestration |

### Example: Chat Request

```bash
curl -X POST http://localhost:8000/api/chat/respond \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me hoodies",
    "user_id": 1,
    "product_id": "basic-hoodie-big-yale"
  }'
```

**Response:**
```json
{
  "message": "Here are our Yale hoodies! Would you like to know about sizes or colors?",
  "products": [
    {
      "product_id": "basic-hoodie-big-yale",
      "name": "Basic Hoodie Big Yale",
      "price": 68.0,
      "image_url": "products/basic-hoodie-big-yale.jpg",
      "short_info": "Navy pullover with white YALE lettering",
      "in_stock": true
    }
  ],
  "suggested_products": null,
  "cart_items": null,
  "timestamp": "2026-10-06T13:45:00Z"
}
```

---

## Testing & QA

### Manual Testing
1. **Frontend:** Open http://localhost:5173 in browser
   - Test emoji rain animation on landing
   - Browse products and apply filters
   - Click product card to view details
   - Open chat, type search query
   - Verify responsive layout on mobile (DevTools: 390px width)

2. **Backend:** Use curl or Postman
   - Health check: `GET /health`
   - Product list: `GET /api/products`
   - Chat message: `POST /api/chat/respond`

### Automated Testing
```bash
# Playwright screenshots (captures all journeys)
cd output
npx playwright install chromium
node shots2.mjs
```

### QA Report
See `output/app_check.html` for comprehensive testing documentation:
- **11 journeys** (landing, browse, detail, auth, about, chat, search, selection, mobile, design, backend)
- **10 screenshots** with captions and verification checklists
- **Status badges:** Verified, Pending, Partial, Reference
- **Interactive navigation:** Sidebar + tabs + deep linking

---

## Database Schema

### Users
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PRIMARY KEY | |
| first_name | TEXT | |
| last_name | TEXT | |
| email | TEXT UNIQUE | |
| password_hash | TEXT | Bcrypt (12 rounds) |
| created_at | TIMESTAMP | |

### Catalogue (102 products)
| Field | Type | Notes |
|-------|------|-------|
| id | TEXT PRIMARY KEY | "basic-hoodie-big-yale" |
| name | TEXT | Display name |
| garment_type | TEXT | "pullover hoodie", "t-shirt", etc. |
| description | TEXT | Full product description |
| price | FLOAT | Always included in responses |
| colors | JSON | ["navy", "black", "gray"] |
| image_file_path | TEXT | Product image path |

### Inventory (612 entries)
| Field | Type | Notes |
|-------|------|-------|
| product_id | TEXT FK | Links to catalogue |
| size | TEXT | "XS", "S", "M", "L", "XL", "XXL" |
| quantity | INTEGER | Units in stock |
| status | TEXT ENUM | "in_stock" / "limited" / "out_of_stock" |

### Chat Messages
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PRIMARY KEY | |
| user_id | INTEGER FK | NULL for guests |
| role | TEXT ENUM | "user" / "assistant" |
| content | TEXT | Message text |
| timestamp | TIMESTAMP | |

---

## Performance

### Response Times
| Endpoint | Time | Notes |
|----------|------|-------|
| `/health` | ~40ms | No I/O |
| `/api/products` | ~4ms | Database query |
| `/api/chat/respond` | ~5–8s | Includes Portkey + LLM latency |

### Resource Limits
- **Concurrent requests:** FastAPI async handles 100+ concurrent connections
- **Max tool calls per message:** 5 (prevents infinite loops)
- **Chat history:** Last 5 messages loaded as context
- **Response timeout:** 30 seconds (Portkey gateway)

---

## Safety & Guardrails

### Agent Guardrails (from `prompts/prompt.md`)

**✅ MUST DO:**
- Verify inventory before confirming availability
- Be honest about stock status
- Provide accurate pricing (never guess)
- Don't make up products

**❌ ABSOLUTELY NO:**
- Never ask for passwords
- Never handle payment info
- Don't share personal data
- No unauthorized access

**✅ MUST FOLLOW:**
- Be transparent about limitations
- No false promises
- Respect return/refund policies
- Treat all customers equally
- Identify as AI

---

## Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules yarn.lock
yarn install
yarn dev
```

### Backend won't start
```bash
cd backend
rm -rf venv __pycache__
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### CORS errors
Backend has CORS enabled for `http://localhost:5173`. If frontend URL changes, update `main.py`.

### Chat not responding
1. Check `.env` has valid `PORTKEY_API_KEY`
2. Check Portkey service status
3. Verify OpenAI model is `gpt-5.6-luna`
4. Check backend logs for errors

### Images not loading
- Ensure `data/products/` directory exists
- Check image paths in `output/app_check_images/`
- Verify symlinks (if used)

---

## Deployment Notes

**Before pushing to production:**
1. ✅ Set `DEBUG=False` in `.env`
2. ✅ Use environment-managed secrets (AWS Secrets Manager, etc.)
3. ✅ Enable HTTPS (SSL/TLS)
4. ✅ Set up CORS for production domain
5. ✅ Use production database (PostgreSQL recommended over SQLite)
6. ✅ Set up monitoring (logs, performance, errors)
7. ✅ Configure rate limiting on `/api/chat/respond`
8. ✅ Use read replicas for product catalogue queries

---

## Documentation

- **Architecture:** See `output/harness.md` (models, tools, safety rules, specs)
- **Design System:** See `output/design.md` (colors, borders, shadows, responsive breakpoints)
- **QA Report:** See `output/app_check.html` (11 journeys, interactive navigation)
- **Activity Log:** See `output/audit_trail.json` (agent loop telemetry)

---

## License

MIT (or per course requirements)

---

## Questions?

Refer to the documentation files in `output/`:
- System architecture: `harness.md`
- Design specifications: `design.md`
- QA & testing: `app_check.html`
- Activity telemetry: `audit_trail.json`

---

**Last updated:** October 6, 2026 | **Status:** Fully functional
