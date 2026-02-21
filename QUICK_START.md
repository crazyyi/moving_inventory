# Moving Inventory - Quick Start Guide

Welcome! Your complete moving inventory management system is ready to use.

## 📋 What You Have

- **Backend (API)**: NestJS application with PostgreSQL database
- **Frontend (Web App)**: Next.js application with modern UI
- **Admin Dashboard**: Management interface for inventories
- **Customer Interface**: Inventory creation and management

## 🚀 Getting Started (5 Minutes)

### 1. Start the Backend API

```bash
cd apps/api

# Run database migrations (if needed)
pnpm db:migrate

# Start the development server
pnpm dev
```

The API will be available at: **http://localhost:3001**

### 2. Start the Frontend Application

In a new terminal:

```bash
cd apps/web

# Start development server
pnpm dev
```

The frontend will be available at: **http://localhost:3000**

Open your browser to http://localhost:3000 and you're ready to go!

## 🎯 Try It Out

### Customer Flow
1. Click **"Create New Inventory"** on the home page
2. Enter customer and move details
3. Add rooms to the inventory
4. Add items to each room
5. Submit your inventory

### Admin Flow
1. Click **"Admin Login"** on the home page
2. Enter your admin key (from backend environment)
3. View all inventories and statistics
4. Click on any inventory to see details
5. Lock inventories or push to GHL

## 📝 Environment Configuration

Both apps now have `.env.local` files configured:

**Frontend** (`apps/web/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/backend
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Backend** (`apps/api/.env.development`):
- Already configured for local development
- Uses local PostgreSQL database

## 🔑 Admin Key

To access the admin dashboard, you need an admin key. Set this in your backend environment or pass it during admin login.

## 📂 Project Structure

```
moving-inventory/
├── apps/
│   ├── api/          # NestJS Backend
│   │   └── README.md
│   └── web/          # Next.js Frontend
│       └── README.md
├── packages/         # Shared packages (if any)
├── FRONTEND_SUMMARY.md    # Frontend build details
└── README.md               # (this file)
```

## 📚 Detailed Documentation

- **Frontend**: See `apps/web/README.md` for comprehensive frontend documentation
- **Backend**: See `apps/api/README.md` for API documentation

## 🛠 Development

### Tech Stack

**Frontend:**
- Next.js 16, React 19, TypeScript
- Tailwind CSS, Zustand, React Hook Form
- Axios for API calls

**Backend:**
- NestJS, TypeScript
- PostgreSQL with Drizzle ORM
- Fastify adapter

### Common Commands

```bash
# Frontend
cd apps/web
pnpm dev       # Development server
pnpm build     # Production build
pnpm start     # Start production server

# Backend
cd apps/api
pnpm dev       # Development with hot reload
pnpm build     # Production build
pnpm start:prod # Start production
```

## 🐛 Troubleshooting

### Frontend not loading
- Ensure backend is running on http://localhost:3001
- Check `.env.local` in `apps/web`
- Clear browser cache and rebuild if needed

### Admin login not working
- Verify admin key in backend `.env.development`
- Check if it's being set correctly

### Database errors
- Run database migrations: `cd apps/api && pnpm db:migrate`
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env.development`

### Port already in use
- Frontend uses 3000, Backend uses 3001
- Change ports in package.json if needed

## ✨ Key Features

✅ Create and manage moving inventories
✅ Organize items by rooms
✅ Track cubic footage and weight
✅ Item library with pre-configured items
✅ Admin dashboard with statistics
✅ CRM integration ready (GHL)
✅ Mobile responsive design
✅ Real-time status tracking

## 🚀 Next Steps

1. Test the full workflow from creating an inventory to submitting it
2. Explore the admin dashboard
3. Customize colors/styling in Tailwind config if desired
4. Set up database backups for production
5. Deploy to your preferred hosting platform

## 📞 Need Help?

- Check the detailed README files in `apps/web` and `apps/api`
- Review the source code - it's well-structured and commented
- API endpoints are documented in the backend README

---

Happy moving inventory management! 📦
