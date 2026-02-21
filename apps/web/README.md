# Moving Inventory - Frontend

A modern Next.js web application for managing moving inventories with room organization, item tracking, and admin dashboard capabilities.

## Features

- **Customer Inventory Management**
  - Create new inventories with customer and move details
  - Access existing inventories using unique tokens
  - Organize items by rooms
  - Track cubic footage and weight
  - Submit completed inventories

- **Room Management**
  - Add multiple room types (living room, bedroom, kitchen, etc.)
  - Customize room names
  - View room-level statistics
  - Delete rooms with all their items

- **Item Management**
  - Add items to rooms with quantity
  - Track cubic footage and weight per item
  - Add notes for special handling
  - Search and select from item library
  - Edit and delete items
  - Upload photos for items (framework in place)

- **Item Library**
  - Pre-configured furniture and item catalog
  - Search by name or category
  - Standard measurements for common items
  - Category filtering

- **Admin Dashboard**
  - View statistics across all inventories
  - List all customer inventories
  - Filter by status (draft, in_progress, submitted, locked)
  - View detailed inventory information
  - Lock inventories to prevent edits
  - Push data to GHL CRM integration

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Setup

### Prerequisites

- Node.js 18+ or pnpm 10+
- Backend API running on `http://localhost:3001`

### Environment Configuration

Create or update `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/backend
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Home/landing page
│   ├── inventory/               # Customer inventory features
│   │   ├── create/              # Create inventory form
│   │   ├── access/              # Access inventory by token
│   │   └── [token]/             # Inventory view and management
│   │       └── components/      # Room/Item management components
│   └── admin/                   # Admin features
│       ├── login/               # Admin login page
│       ├── dashboard/           # Admin statistics dashboard
│       └── inventory/[id]/      # Admin inventory details
└── lib/
    ├── api-client.ts            # Axios client and API endpoints
    ├── stores.ts                # Zustand stores (auth, inventory)
    └── hooks.ts                 # Custom React hooks
```

## API Integration

The frontend communicates with the NestJS backend APIs:

### Inventory Endpoints
- `POST /inventories` - Create new inventory
- `GET /inventories/:token` - Get inventory details
- `GET /inventories/:token/summary` - Get complete inventory with rooms/items
- `PATCH /inventories/:token` - Update inventory info
- `POST /inventories/:token/submit` - Submit inventory

### Rooms Endpoints
- `GET /inventories/:token/rooms` - List all rooms
- `POST /inventories/:token/rooms` - Create new room
- `PATCH /inventories/:token/rooms/:roomId` - Update room
- `DELETE /inventories/:token/rooms/:roomId` - Delete room

### Items Endpoints
- `POST /inventories/:token/rooms/:roomId/items` - Add item
- `PATCH /inventories/:token/rooms/:roomId/items/:itemId/quantity` - Update quantity
- `PATCH /inventories/:token/rooms/:roomId/items/:itemId/images` - Update images
- `DELETE /inventories/:token/rooms/:roomId/items/:itemId` - Delete item

### Item Library Endpoints
- `GET /item-library` - Search items with filters
- `GET /item-library/categories` - Get all categories

### Admin Endpoints
- `GET /admin/inventories/stats` - Get dashboard statistics
- `GET /admin/inventories` - List inventories with filters
- `GET /admin/inventories/:inventoryId/summary` - Get inventory details
- `POST /admin/inventories/:inventoryId/lock` - Lock inventory
- `POST /admin/inventories/:inventoryId/push-ghl` - Push to GHL

## Key Components

### RoomList
Displays list of rooms with expandable details showing items in each room.

### CreateRoomModal
Modal for adding new rooms to an inventory with room type selection and optional custom naming.

### ItemList
Displays items within a room with quantity, measurements, and edit/delete actions.

### CreateItemModal
Modal for adding/editing items with:
- Item name with library search suggestions
- Category selection
- Quantity input
- Cubic footage and weight tracking
- Notes for special handling

### Admin Dashboard
Shows:
- Key metrics (total inventories, status breakdown, total items)
- Sortable inventory table
- Quick access to individual inventory details
- Admin actions (lock, push to GHL)

## Authentication

### Customer Access
- Inventories are accessed via unique tokens
- Tokens are generated when inventory is created
- Customers share token to provide access

### Admin Access
- Admin key stored in localStorage
- Set via environment variable or admin login form
- Required in `x-admin-key` header for admin endpoints

## State Management

### Auth Store (Zustand)
```typescript
- token: Customer inventory token
- adminKey: Admin API key
- setToken(), setAdminKey(), clearAuth()
```

### Inventory Store (Zustand)
```typescript
- currentInventory: Active inventory data
- setCurrentInventory(), clearInventory()
```

## Development

### Adding Features

1. Create API endpoints in `lib/api-client.ts`
2. Create UI components in appropriate app directory
3. Use `useAPICall()` hook for error handling
4. Display notifications with `react-hot-toast`

### Form Handling

All forms use React Hook Form with:
- Validation on submit
- Error display
- Loading states
- Axios error handling integration

### Styling

- Utility-first approach with Tailwind CSS
- Responsive design with `md:` breakpoints
- Consistent color scheme (blue/indigo primary)
- Icons from lucide-react

## Future Enhancements

- [ ] Photo upload for items (backend API ready, UI framework in place)
- [ ] Export inventory to PDF/CSV
- [ ] Real-time collaboration
- [ ] Mobile app version
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Dark mode theme

## Troubleshooting

### API Connection Issues
- Verify backend is running on `http://localhost:3001`
- Check `.env.local` API URL configuration
- Check browser console for CORS errors

### Admin Login Not Working
- Ensure admin key is set in environment or backend config
- Verify admin key is correct
- Check localStorage for stored key

### Page Not Loading
- Clear browser cache
- Check Next.js build errors in terminal
- Verify all API endpoints are active

## License

ISC
