"""
TribalLink FastAPI Microservice
Handles: product recommendations, advanced search, and analytics.
Communicates with the Django backend API.
"""
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import random
from collections import Counter

app = FastAPI(
    title="TribalLink Microservice",
    description="FastAPI service for recommendations, analytics, and advanced search",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DJANGO_API = "http://127.0.0.1:8000/api"


async def fetch_django(endpoint: str, params: dict = None):
    """Fetch data from Django backend."""
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(f"{DJANGO_API}{endpoint}", params=params, timeout=10)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Django API error: {str(e)}")


@app.get("/")
async def root():
    return {
        "service": "TribalLink FastAPI Microservice",
        "version": "1.0.0",
        "endpoints": {
            "recommendations": "/recommendations/{product_id}",
            "trending": "/trending",
            "analytics": "/analytics/summary",
            "advanced_search": "/search/advanced",
            "categories_stats": "/analytics/categories",
        },
    }


@app.get("/recommendations/{product_id}")
async def get_recommendations(product_id: int, limit: int = Query(6, ge=1, le=20)):
    """Get product recommendations based on category similarity."""
    # Fetch the target product
    product = await fetch_django(f"/products/{product_id}/")
    category_id = product.get("category", {}).get("id") if isinstance(product.get("category"), dict) else product.get("category")

    if not category_id:
        raise HTTPException(status_code=404, detail="Product category not found")

    # Fetch products from same category
    data = await fetch_django("/products/", {"category": category_id})
    results = data.get("results", [])

    # Filter out the current product and pick random recommendations
    recs = [p for p in results if p["id"] != product_id]
    random.shuffle(recs)

    return {
        "product_id": product_id,
        "product_name": product.get("name"),
        "category": product.get("category", {}).get("name") if isinstance(product.get("category"), dict) else "Unknown",
        "recommendations": recs[:limit],
        "count": min(len(recs), limit),
    }


@app.get("/trending")
async def get_trending(limit: int = Query(8, ge=1, le=20)):
    """Get trending products (most viewed/featured)."""
    data = await fetch_django("/products/", {"ordering": "-views_count"})
    results = data.get("results", [])
    return {
        "trending": results[:limit],
        "count": min(len(results), limit),
    }


@app.get("/search/advanced")
async def advanced_search(
    q: str = Query("", description="Search query"),
    min_price: float = Query(None),
    max_price: float = Query(None),
    category: int = Query(None),
    sort_by: str = Query("relevance", enum=["relevance", "price_low", "price_high", "newest", "rating"]),
    limit: int = Query(20, ge=1, le=100),
):
    """Advanced search with filtering, sorting, and facets."""
    params = {}
    if q:
        params["search"] = q
    if min_price is not None:
        params["min_price"] = min_price
    if max_price is not None:
        params["max_price"] = max_price
    if category:
        params["category"] = category

    sort_map = {
        "price_low": "price",
        "price_high": "-price",
        "newest": "-created_at",
        "rating": "-views_count",
    }
    if sort_by in sort_map:
        params["ordering"] = sort_map[sort_by]

    data = await fetch_django("/products/", params)
    results = data.get("results", [])

    # Build facets
    cats = await fetch_django("/products/categories/")
    price_ranges = {
        "under_500": len([p for p in results if float(p["price"]) < 500]),
        "500_1000": len([p for p in results if 500 <= float(p["price"]) < 1000]),
        "1000_2000": len([p for p in results if 1000 <= float(p["price"]) < 2000]),
        "above_2000": len([p for p in results if float(p["price"]) >= 2000]),
    }

    return {
        "query": q,
        "results": results[:limit],
        "total": data.get("count", len(results)),
        "facets": {
            "categories": [{"id": c["id"], "name": c["name"], "count": c.get("product_count", 0)} for c in cats],
            "price_ranges": price_ranges,
        },
    }


@app.get("/analytics/summary")
async def analytics_summary():
    """Get platform analytics summary."""
    products = await fetch_django("/products/")
    categories = await fetch_django("/products/categories/")

    all_products = products.get("results", [])
    total = products.get("count", len(all_products))
    prices = [float(p["price"]) for p in all_products if p.get("price")]

    return {
        "total_products": total,
        "total_categories": len(categories),
        "price_stats": {
            "average": round(sum(prices) / len(prices), 2) if prices else 0,
            "min": min(prices) if prices else 0,
            "max": max(prices) if prices else 0,
        },
        "categories": [
            {"name": c["name"], "product_count": c.get("product_count", 0)}
            for c in categories
        ],
    }


@app.get("/analytics/categories")
async def category_analytics():
    """Get detailed category analytics."""
    categories = await fetch_django("/products/categories/")
    result = []
    for cat in categories:
        data = await fetch_django("/products/", {"category": cat["id"]})
        prods = data.get("results", [])
        prices = [float(p["price"]) for p in prods if p.get("price")]
        result.append({
            "category": cat["name"],
            "product_count": cat.get("product_count", 0),
            "avg_price": round(sum(prices) / len(prices), 2) if prices else 0,
            "price_range": {"min": min(prices) if prices else 0, "max": max(prices) if prices else 0},
        })
    return {"categories": result}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
