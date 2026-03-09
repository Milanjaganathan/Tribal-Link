# TribalLink — Authentic Tribal Marketplace

A full-stack e-commerce platform connecting tribal artisans with customers worldwide.

## 🏗️ Architecture

```
Tribal link/
├── backend/              # Django REST API (Port 8000)
│   ├── accounts/         # User auth, JWT, profiles
│   ├── products/         # Product catalog, categories, reviews
│   ├── cart/             # Shopping cart
│   ├── wishlist/         # Wishlist
│   ├── orders/           # Orders & payments
│   ├── search/           # Search & voice search
│   └── triballink/       # Django settings & URLs
│
├── frontend/             # React + Vite (Port 3000)
│   └── src/
│       ├── components/   # Navbar, ProductCard
│       ├── pages/        # Home, Login, Cart, etc.
│       ├── context/      # AuthContext (JWT state)
│       └── services/     # Axios API layer
│
├── fastapi-service/      # FastAPI Microservice (Port 8001)
│   └── main.py           # Recommendations, analytics, advanced search
│
└── README.md
```

## 🛠️ Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Frontend      | React 19, Vite 7, React Router     |
| Backend API   | Django 4.2, Django REST Framework   |
| Microservice  | FastAPI, Uvicorn, httpx             |
| Auth          | JWT (SimpleJWT)                     |
| Database      | SQLite (dev) / PostgreSQL (prod)    |
| Runtime       | Node.js 20+, Python 3.10+          |

## 🚀 Quick Start

### 1. Backend (Django)
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_products  # Load 100 sample products
python manage.py createsuperuser
python manage.py runserver      # → http://127.0.0.1:8000
```

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev                     # → http://localhost:3000
```

### 3. FastAPI Microservice
```bash
cd fastapi-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --port 8001 --reload  # → http://127.0.0.1:8001
```

## 📡 API Endpoints

### Django Backend (Port 8000)
| Endpoint                    | Method | Description           |
|-----------------------------|--------|-----------------------|
| `/api/accounts/register/`   | POST   | User registration     |
| `/api/accounts/login/`      | POST   | JWT login             |
| `/api/accounts/profile/`    | GET    | User profile          |
| `/api/products/`            | GET    | Product listing       |
| `/api/products/{id}/`       | GET    | Product detail        |
| `/api/products/categories/` | GET    | All categories        |
| `/api/cart/`                | GET/POST | Cart operations     |
| `/api/wishlist/`            | GET/POST | Wishlist operations |
| `/api/orders/create/`       | POST   | Create order          |
| `/api/orders/{id}/pay/`     | POST   | Process payment       |
| `/api/search/`              | GET    | Text search           |

### FastAPI Microservice (Port 8001)
| Endpoint                            | Description                |
|-------------------------------------|----------------------------|
| `/recommendations/{product_id}`     | Product recommendations    |
| `/trending`                         | Trending products          |
| `/search/advanced`                  | Advanced search + facets   |
| `/analytics/summary`               | Platform analytics         |
| `/analytics/categories`            | Category analytics         |
| `/docs`                            | Swagger UI                 |

## 🔑 Default Accounts
| Email                    | Password    | Role   |
|--------------------------|-------------|--------|
| admin@triballink.com     | admin123    | Admin  |
| artisan@triballink.com   | artisan123  | Seller |

## 💳 Payment Methods
- Cash on Delivery (COD)
- UPI
- Bank Transfer

## 📋 Features
- ✅ JWT authentication with auto-refresh
- ✅ 100 seeded products across 10 categories
- ✅ Product search with filters & sorting
- ✅ Shopping cart with quantity management
- ✅ Wishlist with move-to-cart
- ✅ Order placement & tracking
- ✅ Seller dashboard for artisan products
- ✅ Admin product verification workflow
- ✅ FastAPI recommendations & analytics
- ✅ React SPA with React Router
- ✅ Responsive design
"# project1" 
