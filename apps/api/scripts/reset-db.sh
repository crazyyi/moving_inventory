#!/bin/bash
# scripts/reset-db.sh
set -e

# 1. Determine which env file to use (defaults to development)
ENV=${1:-development}
ENV_FILE=".env.$ENV"

# 2. Load the specific .env file
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
  echo "✅ Loaded environment from $ENV_FILE"
else
  echo "❌ $ENV_FILE file not found"
  exit 1
fi

# 3. Robust Parsing using Python
DB_NAME=$(python3 -c "from urllib.parse import urlparse; print(urlparse('$DATABASE_URL').path.lstrip('/'))")
APP_USER=$(python3 -c "from urllib.parse import urlparse; print(urlparse('$DATABASE_URL').username)")
PG_BIN="/Library/PostgreSQL/17/bin"

echo "⚠️  WARNING: Resetting database '$DB_NAME' ($ENV)..."

# 4. Drop and Re-create
$PG_BIN/dropdb -U postgres -h localhost -w --if-exists "$DB_NAME"
echo "🗑️  Database dropped."

$PG_BIN/createdb -U postgres -h localhost -w "$DB_NAME"
echo "🛠️  Fresh database created."

# 5. Grant Permissions
$PG_BIN/psql -U postgres -h localhost -w -d "$DB_NAME" <<EOF
  GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO "$APP_USER";
  ALTER DATABASE "$DB_NAME" OWNER TO "$APP_USER";
  -- Modern Postgres: Ensure user can create tables in public schema
  GRANT ALL ON SCHEMA public TO "$APP_USER";
EOF

# 6. Cleanup Build Artifacts
# This ensures a clean slate and avoids MODULE_NOT_FOUND errors
echo "🧹 Cleaning up old build artifacts..."
rm -rf dist

# 7. Apply Migrations & Seed
echo "🚀 Applying migrations..."
# Using the exported DATABASE_URL for Drizzle Kit
pnpm drizzle-kit migrate

echo "🌱 Seeding data using --env-file=$ENV_FILE..."
# Path updated to match your new structure: src/drizzle/seed.ts
node --env-file="$ENV_FILE" -r tsx src/drizzle/seed.ts

echo "🎉 Database '$DB_NAME' has been fully reset!"