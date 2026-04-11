# TribalLink — Authentic Tribal Marketplace

A full-stack, production-ready multi-vendor e-commerce platform connecting tribal artisans with customers worldwide.

## 🏗️ Architecture

```
Tribal link/
├── backend/              # Django REST API (Port 8000)
│   ├── accounts/         # User auth, JWT, OTP, profiles, admin & seller dashboards
│   ├── products/         # Product catalog, categories, reviews with photos
│   ├── cart/             # Shopping cart
│   ├── wishlist/         # Wishlist
│   ├── orders/           # Orders, payments (UPI/COD/Bank)
│   ├── search/           # Search & voice search
│   ├── notifications/    # In-app notifications with broadcast
│   └── triballink/       # Django settings & URLs
│
├── frontend/             # React + Vite (Port 3000)
│   └── src/
│       ├── components/   # Navbar, ProductCard, Footer
│       ├── pages/        # Home, Login, Cart, Orders, Seller, Admin, Profile, etc.
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
| Auth          | JWT (SimpleJWT) + OTP verification  |
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

## 👤 User Roles & Dashboards

### Customer Dashboard
- Browse products by category
- Product details with seller contact (phone + email)
- Add to cart & wishlist
- Place orders with UPI / COD / Bank Transfer
- Order tracking timeline
- Write reviews with photo upload
- In-app notifications for order updates

### Seller Hub (`/seller`)
- **Overview**: Products count, orders, earnings
- **Products**: Add/edit/delete products with image upload
- **Orders**: View received orders, update status (Confirm → Process → Ship → Deliver)
- Notification alerts for new orders

### Admin Dashboard (`/admin`)
- **Overview**: Total users, products, orders, revenue analytics
- **Sellers**: Approve/reject seller registrations
- **Products**: Approve/reject product listings
- **Orders**: View all orders with status filters
- **Users**: Manage all users by role
- **Reviews**: Moderate & delete spam reviews
- Notification broadcast system

## 📡 API Endpoints

### Auth & Accounts
| Endpoint                                  | Method | Description            |
|-------------------------------------------|--------|------------------------|
| `/api/accounts/register/`                 | POST   | Register + get OTP     |
| `/api/accounts/login/`                    | POST   | JWT login              |
| `/api/accounts/logout/`                   | POST   | Blacklist token        |
| `/api/accounts/verify-otp/`               | POST   | Verify email OTP       |
| `/api/accounts/resend-otp/`               | POST   | Resend OTP             |
| `/api/accounts/profile/`                  | GET/PUT| User profile           |
| `/api/accounts/change-password/`          | POST   | Change password        |

### Products
| Endpoint                            | Method | Description           |
|--------------------------------------|--------|-----------------------|
| `/api/products/`                     | GET    | Product listing       |
| `/api/products/{id}/`                | GET    | Product detail        |
| `/api/products/categories/`          | GET    | All categories        |
| `/api/products/{id}/reviews/`        | GET/POST | Reviews (with photo)|
| `/api/products/seller/`              | GET/POST | Seller products     |

### Cart, Wishlist & Orders
| Endpoint                     | Method     | Description        |
|------------------------------|------------|--------------------|
| `/api/cart/`                 | GET/POST   | Cart operations    |
| `/api/wishlist/`             | GET/POST   | Wishlist operations|
| `/api/orders/create/`        | POST       | Create order       |
| `/api/orders/{id}/pay/`      | POST       | Process payment    |
| `/api/orders/{id}/cancel/`   | POST       | Cancel order       |

### Notifications
| Endpoint                            | Method | Description            |
|--------------------------------------|--------|------------------------|
| `/api/notifications/`                | GET    | List notifications     |
| `/api/notifications/unread-count/`   | GET    | Unread count           |
| `/api/notifications/mark-all-read/`  | POST   | Mark all read          |
| `/api/notifications/broadcast/`      | POST   | Admin broadcast        |

### Admin Dashboard
| Endpoint                                     | Method | Description           |
|-----------------------------------------------|--------|-----------------------|
| `/api/accounts/admin/dashboard/`              | GET    | Analytics overview    |
| `/api/accounts/admin/users/`                  | GET    | All users             |
| `/api/accounts/admin/sellers/pending/`        | GET    | Pending sellers       |
| `/api/accounts/admin/sellers/{id}/approve/`   | POST   | Approve/reject seller |
| `/api/accounts/admin/products/`               | GET    | All products          |
| `/api/accounts/admin/products/{id}/approve/`  | POST   | Approve/reject product|
| `/api/accounts/admin/orders/`                 | GET    | All orders            |
| `/api/accounts/admin/reviews/`                | GET    | All reviews           |
| `/api/accounts/admin/reviews/{id}/`           | DELETE | Delete review         |

### Seller Dashboard
| Endpoint                                             | Method | Description              |
|-------------------------------------------------------|--------|--------------------------|
| `/api/accounts/seller/dashboard/`                     | GET    | Seller analytics         |
| `/api/accounts/seller/orders/`                        | GET    | Orders with seller items |
| `/api/accounts/seller/orders/{id}/update-status/`     | POST   | Update order status      |

## 💳 Payment Methods
- **Cash on Delivery (COD)**
- **UPI** (with UPI ID display)
- **Bank Transfer** (with account details)

## 🔐 Security
- JWT authentication with token refresh & blacklisting
- OTP email verification
- Role-based access control (RBAC)
- CSRF protection
- Password hashing (Django's PBKDF2)
- Rate limiting (100/hr anon, 1000/hr authenticated)

## 📋 Complete Feature List
- ✅ JWT auth with auto-refresh & OTP email verification
- ✅ 3 user roles: Customer, Seller, Admin
- ✅ Role-based dashboards for each role
- ✅ Product catalog with categories, search & filters
- ✅ Product detail with seller contact info (phone + email)
- ✅ Product reviews with star ratings & photo upload
- ✅ Shopping cart with quantity management
- ✅ Wishlist with move-to-cart
- ✅ Order placement with UPI/COD/Bank Transfer
- ✅ Order tracking system (Pending → Confirmed → Shipped → Delivered)
- ✅ Seller order management with status updates
- ✅ Seller earnings dashboard
- ✅ Admin analytics with revenue tracking
- ✅ Admin seller approval workflow
- ✅ Admin product moderation
- ✅ Admin review moderation (delete spam)
- ✅ In-app notification system with real-time badge
- ✅ Notification broadcast (admin → all users)
- ✅ Image upload handling (products, reviews, avatars)
- ✅ Premium responsive UI with animations
- ✅ REST API architecture (DRF)
- ✅ AWS deployment ready (PostgreSQL, media storage)

## 🎨 Frontend Pages
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero banner, category pills, product grid |
| Login/Register | `/login` | Auth with OTP support |
| Product Detail | `/product/:id` | Images, reviews, seller contact |
| Cart | `/cart` | Cart with order summary |
| Checkout | `/checkout` | Shipping + payment selection |
| Orders | `/orders` | Order history with status |
| Wishlist | `/wishlist` | Saved products |
| Search | `/search` | Product search results |
| Profile | `/profile` | User profile management |
| Seller Hub | `/seller` | Artisan dashboard with tabs |
| Admin | `/admin` | Admin dashboard with tabs |

## 🔑 Default Accounts
| Email                    | Password    | Role   |
|--------------------------|-------------|--------|
| admin@triballink.com     | admin123    | Admin  |
| artisan@triballink.com   | artisan123  | Seller |
