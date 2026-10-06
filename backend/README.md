# Campus Customs Backend API

FastAPI backend for the Campus Customs e-commerce platform.

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Run the Server

```bash
python main.py
```

Or use uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: **http://localhost:8000**

## API Documentation

Once the server is running, visit:

- **Interactive Docs (Swagger UI)**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## Available Endpoints

### Health Check
- `GET /health` - Server health status

### Products
- `GET /api/products` - List all products (paginated)
- `GET /api/products/{product_id}` - Get product details

### Inventory
- `GET /api/inventory/{product_id}` - Get stock levels by size

### Search
- `GET /api/search?q=query` - Search products

### Chat
- `POST /api/chat/message` - Save chat message
- `GET /api/chat/history/{user_id}` - Get conversation history
- `POST /api/chat/respond` - Generate bot response (placeholder)

### Users
- `GET /api/users/{user_id}` - Get user profile

## Database

The backend connects to the SQLite database at:
```
../data/campus_customs.db
```

## CORS Configuration

CORS is enabled for:
- `http://localhost:5173` (Frontend dev server)
- `http://localhost:3000` (Alternative frontend port)

## Integration with Frontend

The frontend is configured to call the backend at `http://localhost:8000`.

Update the API base URL in frontend components as needed.

## Example Requests

### Get All Products
```bash
curl http://localhost:8000/api/products?limit=10
```

### Get Product Details
```bash
curl http://localhost:8000/api/products/basic-hoodie-big-yale
```

### Search Products
```bash
curl http://localhost:8000/api/search?q=yale
```

### Get Inventory
```bash
curl http://localhost:8000/api/inventory/basic-hoodie-big-yale
```

## Chatbot Agent (PydanticAI)

The backend includes a PydanticAI-powered chatbot agent that handles customer interactions.

### Files
- `prompts/prompt.md` - System prompt and instructions
- `agent.py` - PydanticAI agent initialization and main logic
- `tools.py` - Database tools (search, inventory, etc.)
- `models.py` - Pydantic models for agent responses

### Available Agent Tools
- `search_products()` - Search by keyword, color, or type
- `get_product_details()` - Get full product information
- `check_inventory()` - Check stock by product and size
- `get_available_sizes()` - Get sizes with available stock
- `get_similar_products()` - Get related products

### Setup

1. Set OpenAI API key:
```bash
export OPENAI_API_KEY=sk-your-key-here
```

2. Chat endpoint:
```
POST /api/chat/respond?message=Show me Yale hoodies&user_id=1
```

### Example Response
```json
{
  "message": "I found several Yale hoodies for you...",
  "products": [...],
  "timestamp": "2026-10-06T12:00:00"
}
```

## Next Steps

- Integrate agent responses with frontend chat widget
- Add shopping cart functionality
- Add order management
- Add product recommendation engine based on chat history
- Add analytics and tracking
