import sqlite3
import json
from pathlib import Path
from typing import List, Optional
import sys

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from models import ProductResult, InventoryResult

DATABASE_PATH = str(Path(__file__).parent.parent / "data" / "campus_customs.db")

def get_db_connection():
    """Get SQLite database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def search_products(query: str, limit: int = 5) -> List[ProductResult]:
    """
    Search products by name, description, or tags

    Args:
        query: Search query string
        limit: Maximum number of results to return

    Returns:
        List of matching products
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        search_term = f"%{query}%"
        cursor.execute(
            """SELECT * FROM catalogue
               WHERE name LIKE ? OR description LIKE ? OR search_tags LIKE ?
               LIMIT ?""",
            (search_term, search_term, search_term, limit)
        )
        rows = cursor.fetchall()
        conn.close()

        results = []
        for row in rows:
            # Check if any size is in stock
            in_stock = check_product_in_stock(row["product_id"])

            results.append(ProductResult(
                product_id=row["product_id"],
                name=row["name"],
                garment_type=row["garment_type"],
                description=row["description"],
                price=row["price"],
                colors=json.loads(row["colors"]),
                in_stock=in_stock,
                image_file_path=row["image_file_path"] if row["image_file_path"] else None
            ))

        return results
    except Exception as e:
        print(f"Search error: {e}")
        return []

def get_product_details(product_id: str) -> Optional[ProductResult]:
    """
    Get detailed information about a specific product

    Args:
        product_id: The product ID

    Returns:
        Product details or None if not found
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM catalogue WHERE product_id = ?", (product_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        in_stock = check_product_in_stock(product_id)

        return ProductResult(
            product_id=row["product_id"],
            name=row["name"],
            garment_type=row["garment_type"],
            description=row["description"],
            price=row["price"],
            colors=json.loads(row["colors"]),
            in_stock=in_stock,
            image_file_path=row.get("image_file_path")
        )
    except Exception as e:
        print(f"Product detail error: {e}")
        return None

def check_inventory(product_id: str, size: str) -> Optional[InventoryResult]:
    """
    Check inventory for a specific product and size

    Args:
        product_id: The product ID
        size: The size (XS, S, M, L, XL, XXL)

    Returns:
        Inventory information or None if not found
    """
    try:
        from models import StockStatus

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM inventory WHERE product_id = ? AND size = ?",
            (product_id, size)
        )
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        quantity = row["quantity"]

        # Determine stock status based on quantity
        if quantity == 0:
            status = StockStatus.OUT_OF_STOCK
        elif quantity < 5:
            status = StockStatus.LIMITED
        else:
            status = StockStatus.IN_STOCK

        return InventoryResult(
            product_id=row["product_id"],
            size=row["size"],
            quantity=quantity,
            in_stock=quantity > 0,
            status=status
        )
    except Exception as e:
        print(f"Inventory check error: {e}")
        return None

def check_product_in_stock(product_id: str) -> bool:
    """
    Check if a product has any stock in any size

    Args:
        product_id: The product ID

    Returns:
        True if product has stock in any size
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT SUM(quantity) as total FROM inventory WHERE product_id = ?",
            (product_id,)
        )
        row = cursor.fetchone()
        conn.close()

        total = row["total"] if row else 0
        return total > 0 if total else False
    except Exception as e:
        print(f"Stock check error: {e}")
        return False

def get_available_sizes(product_id: str) -> List[dict]:
    """
    Get all available sizes for a product that have stock with quantities

    Args:
        product_id: The product ID

    Returns:
        List of available sizes with quantities
    """
    try:
        from models import AvailableSize

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT size, quantity FROM inventory WHERE product_id = ? AND quantity > 0 ORDER BY size",
            (product_id,)
        )
        rows = cursor.fetchall()
        conn.close()

        sizes = []
        for row in rows:
            size_obj = AvailableSize(size=row["size"], quantity=row["quantity"])
            sizes.append(size_obj.dict())

        return sizes
    except Exception as e:
        print(f"Available sizes error: {e}")
        return []

def get_similar_products(product_id: str, limit: int = 3) -> List[ProductResult]:
    """
    Get similar products based on garment type or tags

    Args:
        product_id: The product ID
        limit: Maximum number of similar products

    Returns:
        List of similar products
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get the product's garment type
        cursor.execute("SELECT garment_type FROM catalogue WHERE product_id = ?", (product_id,))
        result = cursor.fetchone()

        if not result:
            return []

        garment_type = result["garment_type"]

        # Find similar products
        cursor.execute(
            """SELECT * FROM catalogue
               WHERE garment_type = ? AND product_id != ?
               LIMIT ?""",
            (garment_type, product_id, limit)
        )
        rows = cursor.fetchall()
        conn.close()

        results = []
        for row in rows:
            in_stock = check_product_in_stock(row["product_id"])
            results.append(ProductResult(
                product_id=row["product_id"],
                name=row["name"],
                garment_type=row["garment_type"],
                description=row["description"],
                price=row["price"],
                colors=json.loads(row["colors"]),
                in_stock=in_stock,
                image_file_path=row["image_file_path"] if row["image_file_path"] else None
            ))

        return results
    except Exception as e:
        print(f"Similar products error: {e}")
        return []
