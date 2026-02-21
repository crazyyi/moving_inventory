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

echo "🚀 Running migrations for database..."

# Get the list of migration files (excluding first migration and snapshots)
MIGRATION_DIR="./drizzle"

if [ ! -d "$MIGRATION_DIR" ]; then
  echo "❌ Migration directory not found: $MIGRATION_DIR"
  exit 1
fi

# Get all migration files except the first one (0000_*), sorted
MIGRATIONS=$(find "$MIGRATION_DIR" -maxdepth 1 -name "*.sql" ! -name "0000_*" | sort)

if [ -z "$MIGRATIONS" ]; then
  echo "ℹ️  No additional migration files found"
  echo "✅ Database schema is up to date"
  exit 0
fi

for migration in $MIGRATIONS; do
  echo "📝 Executing migration: $(basename "$migration")"
  
  # Use DATABASE_URL connection string directly
  psql "$DATABASE_URL" -f "$migration" || {
    echo "❌ Migration failed: $(basename "$migration")"
    exit 1
  }
  
  echo "✅ Completed: $(basename "$migration")"
done

echo "🎉 All migrations completed successfully!"

