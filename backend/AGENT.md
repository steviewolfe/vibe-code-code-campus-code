# Campus Customs Chatbot Agent Architecture

## Overview

The chatbot agent is built using PydanticAI and follows a modular, composable architecture with clear separation of concerns. Each component has a single responsibility.

---

## Component Breakdown

### 1. **`prompts/prompt.md`** - System Instructions
**Purpose:** Define the agent's personality, role, and behavior

**Contains:**
- Agent identity and role ("Shopping assistant for Campus Customs")
- Conversation style guidelines (warm, professional, personalized)
- Available tools and capabilities
- Rules and constraints (e.g., "always check inventory before confirming availability")
- Example interactions and expected behavior

**When to modify:**
- Change assistant personality or tone
- Add new conversation guidelines
- Update instructions for new tools
- Modify example scenarios

**Format:** Plain Markdown - read by `agent.py` on startup

---

### 2. **`models.py`** - Structured Data Types
**Purpose:** Define Pydantic models for type-safe data structures

**Contains:**
- `ProductResult` - Product search results with inventory status
- `InventoryResult` - Stock information for a product-size combo
- `CartItem` - Shopping cart entry
- `ChatResponse` - Agent response format
- `AgentState` - Conversation context and state

**When to modify:**
- Add new data types the agent needs to handle
- Change response structure
- Add fields to track conversation state
- Update validation rules

**Dependencies:**
- Used by `tools.py` for return types
- Used by `agent.py` for response structuring
- Used in FastAPI endpoints for response models

---

### 3. **`tools.py`** - Database Tools
**Purpose:** Provide database access functions the agent can call

**Contains:**
- `search_products()` - Search catalog by keyword
- `get_product_details()` - Get full product info
- `check_inventory()` - Check stock for product-size
- `get_available_sizes()` - List available sizes
- `get_similar_products()` - Find related products
- `check_product_in_stock()` - Quick stock check
- `get_db_connection()` - Database connection helper

**When to modify:**
- Add new database queries
- Add new tool functions
- Optimize database access
- Add new data sources

**Dependencies:**
- Imports `models.py` for return types
- Connects to SQLite database
- Called by agent in `agent.py`

**Tool Registration:**
Each tool is registered with the agent in `agent.py`:
```python
agent.tool(search_products, description="Search products by...")
```

---

### 4. **`agent.py`** - Agent Initialization & Wiring
**Purpose:** Set up the PydanticAI agent and wire everything together

**Contains:**
- `load_system_prompt()` - Load prompt from file
- Agent instantiation with model selection (GPT-4o-mini)
- Tool registration (calls `agent.tool()` for each tool)
- `chat_with_agent()` - Main async function to run agent

**When to modify:**
- Change LLM model
- Register new tools
- Modify agent configuration
- Change response handling

**Dependencies:**
- Imports `prompts/prompt.md` (system prompt)
- Imports `tools.py` (tool functions)
- Imports `models.py` (response types)
- Uses `pydantic-ai` library

**Key Function:**
```python
async def chat_with_agent(user_message: str, user_id: int = None) -> ChatResponse
```
Entry point called from FastAPI endpoint.

---

### 5. **`main.py`** - FastAPI Integration
**Purpose:** Expose the agent via HTTP endpoints

**Contains:**
- All authentication endpoints
- Product endpoints
- Inventory endpoints
- **Chat endpoint:** `/api/chat/respond`
- User management endpoints

**Chat Endpoint:**
```
POST /api/chat/respond?message={user_message}&user_id={optional_user_id}
```

Calls: `await chat_with_agent(message, user_id)`

**When to modify:**
- Add new HTTP endpoints
- Change request/response formats
- Add request validation
- Update error handling

---

## Data Flow Diagram

```
User (Frontend)
    ↓
POST /api/chat/respond
    ↓
main.py → chat_respond()
    ↓
agent.py → chat_with_agent()
    ↓
PydanticAI Agent
    ├─ Reads: prompts/prompt.md (system instructions)
    ├─ Calls Tools (when needed):
    │  ├─ search_products() → tools.py → database
    │  ├─ get_product_details() → tools.py → database
    │  ├─ check_inventory() → tools.py → database
    │  ├─ get_available_sizes() → tools.py → database
    │  └─ get_similar_products() → tools.py → database
    ├─ Each Tool Returns: models.py types
    └─ Generates Response: ChatResponse (models.py)
    ↓
main.py → return ChatResponse
    ↓
Frontend (Chat Widget)
```

---

## Adding New Features

### Adding a New Tool

1. **Define the tool in `tools.py`:**
```python
def new_tool_function(param1: str) -> ReturnType:
    """Description of what this tool does"""
    # Implementation
    return result
```

2. **Add the return type to `models.py`:**
```python
class NewToolResult(BaseModel):
    field1: str
    field2: int
```

3. **Register the tool in `agent.py`:**
```python
agent.tool(new_tool_function, description="What this tool does")
```

4. **Update `prompts/prompt.md`:**
- Add tool to available tools list
- Add example of when to use it
- Add expected output format

### Modifying System Prompt

1. Edit `prompts/prompt.md`
2. Changes take effect when agent restarts
3. No code changes needed

### Changing the LLM Model

1. Edit `agent.py` line with model:
```python
model="openai:gpt-4o"  # Change this
```

2. Restart backend server

---

## Architecture Principles

### Separation of Concerns
- **Prompts:** Behavioral instructions only
- **Models:** Type definitions only
- **Tools:** Database/data access only
- **Agent:** Orchestration and LLM interaction
- **Main:** HTTP routing and request handling

### No Circular Dependencies
```
main.py
  ↓
agent.py
  ↓
tools.py + models.py (no dependencies between them)
  ↓
prompts/ (read-only text)
```

### Type Safety
- All tool returns typed with Pydantic models
- Agent responses structured and validated
- FastAPI endpoints use same models for validation

### Stateless Tools
- Tools are pure functions
- No side effects except database reads
- No global state
- Can be called multiple times safely

---

## Configuration

### Environment Variables
```
OPENAI_API_KEY=sk-...       # Required for agent
DATABASE_PATH=../data/...   # Database location
SECRET_KEY=...              # JWT secret
```

### Model Selection
Change in `agent.py`:
- `openai:gpt-4o` - Most capable, slower, expensive
- `openai:gpt-4o-mini` - Faster, cheaper, good for chat
- `openai:gpt-3.5-turbo` - Fastest, least capable

---

## Testing the Agent

### Direct call (in Python):
```python
from agent import chat_with_agent
response = await chat_with_agent("Show me Yale hoodies", user_id=1)
print(response.message)
```

### Via API:
```bash
curl "http://localhost:8000/api/chat/respond?message=Show%20me%20Yale%20hoodies&user_id=1"
```

### Frontend chat widget:
Just type a message in the chat panel

---

## Common Modifications

| Need | Where | How |
|------|-------|-----|
| Change bot personality | `prompts/prompt.md` | Edit instructions section |
| Add product search type | `tools.py` | Add new function + register in agent.py |
| Support new data type | `models.py` | Add Pydantic model |
| Change response format | `models.py` | Update ChatResponse class |
| Use different LLM | `agent.py` | Change model string |
| Add HTTP endpoint | `main.py` | Add route with agent call |
| Store conversation state | `models.py` → `tools.py` | Add to AgentState, persist in DB |

---

## Future Enhancements

- [ ] Multi-turn conversation context persistence
- [ ] Product recommendations based on history
- [ ] Shopping cart management in agent
- [ ] Order processing
- [ ] Customer support escalation
- [ ] Conversation analytics
- [ ] A/B testing different prompts
- [ ] Fine-tuned model for e-commerce
