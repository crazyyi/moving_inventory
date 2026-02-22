# Moving Inventory Management

## Project Overview
The Moving Inventory Management project is designed to help users efficiently manage their home moving process. It provides tools to organize, categorize, and track items during a move, ensuring a smooth and stress-free experience.

## Key Features
- **Inventory Management**: Keep track of all items being moved, categorized by rooms or types.
- **Photo Storage**: Upload and store photos of items securely on the cloud for easy reference.
- **Room Organization**: Create and manage virtual rooms to organize items effectively.

## Technology Stack
- **Backend**: Built with [NestJS](https://nestjs.com/) for a scalable and maintainable server-side application.
- **Database**: Uses PostgreSQL for robust and reliable data storage.
- **Frontend**: Developed with [Next.js](https://nextjs.org/) for a modern and responsive user interface.
- **Cloud Storage**: Photos are stored securely on a cloud platform.

## Getting Started
### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Cloud storage account (e.g., AWS S3, Google Cloud Storage, etc.)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/moving_inventory.git
   ```
2. Navigate to the project directory:
   ```bash
   cd moving_inventory
   ```
3. Install dependencies using pnpm:
   ```bash
   pnpm install
   ```

### Environment Setup
1. Create `.env` files for the backend and frontend:
   - `apps/api/.env.development`
   - `apps/web/.env.local`
2. Add the required environment variables (e.g., database connection string, cloud storage credentials).

### Running the Project
1. Start the backend server:
   ```bash
   pnpm --filter api start:dev
   ```
2. Start the frontend application:
   ```bash
   pnpm --filter web dev
   ```

## Data Setup and Migration

### Running Database Migrations
1. Navigate to the `apps/api` directory:
   ```bash
   cd apps/api
   ```
2. Run the migration script using pnpm:
   ```bash
   pnpm run migrate-db
   ```

### Seeding the Database
1. Navigate to the `apps/api` directory:
   ```bash
   cd apps/api
   ```
2. Run the seed script using pnpm:
   ```bash
   pnpm run seed-db
   ```

### Resetting the Database
1. Navigate to the `apps/api` directory:
   ```bash
   cd apps/api
   ```
2. Run the reset script using pnpm:
   ```bash
   pnpm run reset-db
   ```

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.