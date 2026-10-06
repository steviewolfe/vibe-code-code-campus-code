import os
import json
import asyncio
import sqlite3
from pathlib import Path
from dotenv import load_dotenv
from openai import AsyncOpenAI
import sys

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from models import ChatResponse, ProductCard
from tools import (
    search_products,
    get_product_details,
    check_inventory,
    get_available_sizes,
    get_similar_products
)

# Load environment variables
load_dotenv()

# Initialize Portkey client
def get_portkey_client() -> AsyncOpenAI:
    """Initialize async OpenAI client configured for Portkey"""
    api_key = os.getenv("PORTKEY_API_KEY")
    if not api_key:
        raise ValueError("PORTKEY_API_KEY is missing from environment")

    base_url = os.getenv("PORTKEY_BASE_URL", "https://api.portkey.ai/v1")
    return AsyncOpenAI(api_key=api_key, base_url=base_url)

PROMPT_PATH = Path(__file__).parent / "prompts" / "prompt.md"
DATABASE_PATH = str(Path(__file__).parent.parent / "data" / "campus_customs.db")

# Read system prompt
def load_system_prompt() -> str:
    """Load the system prompt, resolved relative to this file (not the cwd)"""
    if not PROMPT_PATH.exists():
        raise FileNotFoundError(f"System prompt not found at {PROMPT_PATH}")
    return PROMPT_PATH.read_text()

# Get the system prompt
system_prompt = load_system_prompt()

# Define available tools for the agent
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "Search products by keyword, color, or garment type",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query (keyword, color, or type)"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max results to return",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_product_details",
            "description": "Get detailed information about a specific product",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "string",
                        "description": "The product ID"
                    }
                },
                "required": ["product_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_inventory",
            "description": "Check stock levels for a product and size",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "string",
                        "description": "The product ID"
                    },
                    "size": {
                        "type": "string",
                        "description": "Size (XS, S, M, L, XL, XXL)"
                    }
                },
                "required": ["product_id", "size"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_available_sizes",
            "description": "Get available sizes for a product",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "string",
                        "description": "The product ID"
                    }
                },
                "required": ["product_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_similar_products",
            "description": "Get similar products based on type",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "string",
                        "description": "The product ID"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max similar products",
                        "default": 3
                    }
                },
                "required": ["product_id"]
            }
        }
    }
]

# Helper function to convert ProductResult to ProductCard
def product_result_to_card(product_result) -> ProductCard:
    """Convert ProductResult to ProductCard for UI display"""
    # Extract first sentence as short_info (max 200 chars)
    description = product_result.description
    short_info = description.split('.')[0] + '.' if '.' in description else description[:100]
    short_info = short_info[:200]  # Ensure max 200 chars

    # Use image file path or placeholder (path already includes 'products/' prefix)
    image_url = f"/{product_result.image_file_path}" if product_result.image_file_path else "/products/placeholder.jpg"

    return ProductCard(
        product_id=product_result.product_id,
        name=product_result.name,
        price=product_result.price,
        image_url=image_url,
        short_info=short_info,
        in_stock=product_result.in_stock
    )

# Tool dispatcher
def execute_tool(tool_name: str, tool_input: dict):
    """Execute a tool by name with given inputs"""
    if tool_name == "search_products":
        result = search_products(tool_input["query"], tool_input.get("limit", 5))
        # Convert to ProductCard dicts for UI display
        return [product_result_to_card(r).dict() for r in result]
    elif tool_name == "get_product_details":
        result = get_product_details(tool_input["product_id"])
        return result.dict() if result else None
    elif tool_name == "check_inventory":
        result = check_inventory(tool_input["product_id"], tool_input["size"])
        return result.dict() if result else None
    elif tool_name == "get_available_sizes":
        sizes = get_available_sizes(tool_input["product_id"])
        return sizes  # Returns list of dicts with size and quantity
    elif tool_name == "get_similar_products":
        result = get_similar_products(tool_input["product_id"], tool_input.get("limit", 3))
        # Convert to ProductCard dicts for UI display
        return [product_result_to_card(r).dict() for r in result]
    else:
        return {"error": f"Unknown tool: {tool_name}"}

def _load_user_row(user_id: int):
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        return conn.execute(
            "SELECT id, first_name, last_name, email FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()
    finally:
        conn.close()

def _load_recent_history(user_id: int):
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        return conn.execute(
            """SELECT role, content FROM chat_messages
               WHERE user_id = ?
               ORDER BY created_at DESC
               LIMIT 5""",
            (user_id,)
        ).fetchall()
    finally:
        conn.close()

async def chat_with_agent(user_message: str, user_id: int = None, product_context: dict = None) -> ChatResponse:
    """
    Send a message to the agent and get a response using Portkey API

    Args:
        user_message: The user's message
        user_id: Optional user ID for personalization
        product_context: Optional product info if user is viewing a product page

    Returns:
        ChatResponse with the agent's reply (including product cards if search performed)
    """
    try:
        client = get_portkey_client()

        # Track products found during conversation
        found_products: list = []

        # Build system prompt with user context if available
        enhanced_prompt = system_prompt
        if user_id:
            # Get user info for agent awareness
            try:
                row = await asyncio.to_thread(_load_user_row, user_id)

                if row:
                    user_name = f"{row[1]} {row[2]}".strip() if row[1] or row[2] else "Customer"
                    user_email = row[3]
                    enhanced_prompt += f"\n\n## Current Customer\nThe customer chatting with you is:\n- Name: {user_name}\n- Email: {user_email}\n- ID: {user_id}\n\nUse their name to personalize responses when appropriate."
            except Exception as e:
                print(f"Error loading user context: {e}")

        # Add product context if user is viewing a product page
        if product_context:
            colors_str = ", ".join(product_context.get("colors", [])) if product_context.get("colors") else "N/A"
            enhanced_prompt += f"\n\n## Current Product Page\nThe customer is currently viewing this product:\n- Product ID: {product_context['product_id']}\n- Name: {product_context['name']}\n- Price: ${product_context['price']:.2f}\n- Type: {product_context['garment_type']}\n- Colors: {colors_str}\n- Description: {product_context['description']}\n\nWhen the customer asks about 'this item', 'it', or 'this product', they are referring to this specific product. Use this context to provide accurate, specific answers about availability, sizing, colors, and other details."

        # Build messages with system prompt
        messages = [
            {"role": "system", "content": enhanced_prompt}
        ]

        # Load and add previous chat history for context
        if user_id:
            try:
                rows = await asyncio.to_thread(_load_recent_history, user_id)

                # Add history in chronological order
                for role, content in reversed(rows):
                    messages.append({"role": role, "content": content})
            except Exception as e:
                print(f"Error loading chat history: {e}")

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Agentic loop - keep calling model until it stops using tools
        max_iterations = 10
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            # Call the model
            response = await client.chat.completions.create(
                model=os.getenv("PORTKEY_MODEL", "gpt-4o-mini"),
                messages=messages,
                tools=TOOLS,
                tool_choice="auto"
            )

            # Get the first choice
            choice = response.choices[0]
            finish_reason = choice.finish_reason

            # Check if we're done with no tool calls
            if finish_reason == "stop":
                # Extract the final message
                final_message = choice.message.content or "I couldn't generate a response."
                return ChatResponse(
                    message=final_message,
                    products=found_products if found_products else None,
                    cart_items=None,
                    suggested_products=None
                )

            # Handle tool calls
            if finish_reason == "tool_calls":
                # Add assistant message to history
                messages.append(choice.message)

                # Process each tool call
                if hasattr(choice.message, 'tool_calls') and choice.message.tool_calls:
                    for tool_call in choice.message.tool_calls:
                        tool_name = tool_call.function.name
                        tool_input = json.loads(tool_call.function.arguments)

                        # Execute the tool
                        tool_result = await asyncio.to_thread(execute_tool, tool_name, tool_input)

                        # Track products from search_products calls
                        if tool_name == "search_products" and isinstance(tool_result, list):
                            # tool_result is already ProductCard dicts
                            found_products.extend(tool_result)

                        # Add tool result to messages
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": json.dumps(tool_result)
                        })

                # Continue the loop to get the next response
                continue

            # If we get here with any other finish_reason, extract the message
            final_message = choice.message.content or "I couldn't generate a response."
            return ChatResponse(
                message=final_message,
                products=found_products if found_products else None,
                cart_items=None,
                suggested_products=None
            )

        return ChatResponse(
            message="I reached the maximum number of iterations. Please try again."
        )

    except Exception as e:
        print(f"Agent error: {e}")
        import traceback
        traceback.print_exc()
        return ChatResponse(
            message=f"I apologize, but I encountered an error: {str(e)}. Please try again."
        )
