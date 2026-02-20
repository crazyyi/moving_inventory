#!/bin/bash
set -e

# 1. Determine which env file to use
ENV=${1:-development}
ENV_FILE=".env.$ENV"

# 2. Load the env file
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
  echo "✅ Loaded $ENV_FILE"
else
  echo "❌ $ENV_FILE file not found"
  exit 1
fi

# 3. Robust Parsing (Now including Password)
DB_NAME=$(python3 -c "from urllib.parse import urlparse; print(urlparse('$DATABASE_URL').path.lstrip('/'))")
APP_USER=$(python3 -c "from urllib.parse import urlparse; print(urlparse('$DATABASE_URL').username)")
APP_PASS=$(python3 -c "from urllib.parse import urlparse; print(urlparse('$DATABASE_URL').password)")

# 4. Set Binary Paths
PG_BIN="/Library/PostgreSQL/17/bin"

# --- NEW STEP: Create the User Role if it doesn't exist ---
echo "👤 Checking if role '$APP_USER' exists..."
ROLE_EXISTS=$($PG_BIN/psql -U postgres -h localhost -tAc "SELECT 1 FROM pg_roles WHERE rolname='$APP_USER'")

if [ "$ROLE_EXISTS" != "1" ]; then
  echo "✨ Creating role '$APP_USER'..."
  $PG_BIN/psql -U postgres -h localhost -c "CREATE ROLE \"$APP_USER\" WITH LOGIN PASSWORD '$APP_PASS' CREATEDB;"
else
  echo "ℹ️  Role '$APP_USER' already exists."
fi
# ---------------------------------------------------------

echo "🛠  Creating database '$DB_NAME' as postgres superuser..."

# Attempt to create DB; hide error if it already exists
$PG_BIN/createdb -U postgres -h localhost -w "$DB_NAME" 2>/dev/null || echo "ℹ️  Database already exists (continuing)..."

echo "🔐 Configuring permissions for '$APP_USER'..."

$PG_BIN/psql -U postgres -h localhost -w -d "$DB_NAME" <<EOF
  GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO "$APP_USER";
  ALTER DATABASE "$DB_NAME" OWNER TO "$APP_USER";
  -- Ensure the user can create tables in the public schema (Postgres 15+ requirement)
  GRANT ALL ON SCHEMA public TO "$APP_USER";
EOF

echo "📦 Generating migrations from schema..."
pnpm drizzle-kit generate

echo "🚀 Running migrations..."
pnpm drizzle-kit migrate

echo "🌱 Seeding data from $ENV_FILE..."
npx tsx --env-file=$ENV_FILE scripts/seed-db.ts

echo "🎉 All done!"