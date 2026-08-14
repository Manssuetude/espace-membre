#!/bin/bash
# Database Migration Script: Supabase to VPS PostgreSQL
# This script helps automate the migration process

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
# SOURCE (Supabase) - Read from your current .env file
SUPABASE_HOST="${SUPABASE_HOST:-}"
SUPABASE_DB="${SUPABASE_DB:-postgres}"
SUPABASE_USER="${SUPABASE_USER:-postgres}"
SUPABASE_PORT="${SUPABASE_PORT:-5432}"

# DESTINATION (VPS PostgreSQL) - New values you'll create
NEW_DB_NAME="${NEW_DB_NAME:-manssu_db}"
NEW_DB_USER="${NEW_DB_USER:-manssu_user}"
NEW_DB_HOST="${NEW_DB_HOST:-localhost}"
NEW_DB_PORT="${NEW_DB_PORT:-5432}"

BACKUP_FILE="${BACKUP_FILE:-manssu_backup.dump}"

echo -e "${GREEN}=== MANSSU Database Migration Script ===${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists pg_dump; then
    echo -e "${RED}❌ pg_dump not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

if ! command_exists pg_restore; then
    echo -e "${RED}❌ pg_restore not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

if ! command_exists psql; then
    echo -e "${RED}❌ psql not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 1: Export from Supabase
echo -e "${YELLOW}Step 1: Exporting data from Supabase (SOURCE)...${NC}"
echo ""
echo "We need your CURRENT Supabase credentials (from your .env file):"

if [ -z "$SUPABASE_HOST" ]; then
    read -p "Enter Supabase host from .env (e.g., db.xxx.supabase.co): " SUPABASE_HOST
fi

if [ -z "$SUPABASE_USER" ]; then
    read -p "Enter Supabase user from .env (usually 'postgres'): " SUPABASE_USER
    SUPABASE_USER="${SUPABASE_USER:-postgres}"
fi

if [ -z "$SUPABASE_DB" ]; then
    read -p "Enter Supabase database name from .env (usually 'postgres'): " SUPABASE_DB
    SUPABASE_DB="${SUPABASE_DB:-postgres}"
fi

read -sp "Enter Supabase password from .env: " SUPABASE_PASSWORD
echo ""

echo "Exporting from Supabase..."
pg_dump -h "$SUPABASE_HOST" \
        -p "$SUPABASE_PORT" \
        -U "$SUPABASE_USER" \
        -d "$SUPABASE_DB" \
        -F c \
        -f "$BACKUP_FILE" \
        --verbose \
        -W <<< "$SUPABASE_PASSWORD"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Export completed: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Export failed${NC}"
    exit 1
fi

echo ""

# Step 2: Check if PostgreSQL is installed locally
echo -e "${YELLOW}Step 2: Checking PostgreSQL installation...${NC}"

if ! sudo systemctl is-active --quiet postgresql 2>/dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL service not running.${NC}"
    read -p "Do you want to install PostgreSQL? (y/n): " install_pg
    
    if [ "$install_pg" = "y" ]; then
        echo "Installing PostgreSQL..."
        sudo apt-get update
        sudo apt-get install -y postgresql postgresql-contrib
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
        echo -e "${GREEN}✅ PostgreSQL installed and started${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping PostgreSQL installation. Please install it manually.${NC}"
    fi
else
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
fi

echo ""

# Step 3: Create database and user
echo -e "${YELLOW}Step 3: Creating NEW database and user on VPS (DESTINATION)...${NC}"
echo ""
echo "These are NEW credentials for your VPS PostgreSQL database (different from Supabase):"

read -p "Enter new database name [$NEW_DB_NAME]: " input_db_name
NEW_DB_NAME="${input_db_name:-$NEW_DB_NAME}"

read -p "Enter new database user [$NEW_DB_USER]: " input_db_user
NEW_DB_USER="${input_db_user:-$NEW_DB_USER}"

read -sp "Enter password for NEW database user ($NEW_DB_USER): " NEW_DB_PASSWORD
echo ""

# Check if database exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$NEW_DB_NAME"; then
    echo -e "${YELLOW}⚠️  Database $NEW_DB_NAME already exists.${NC}"
    read -p "Do you want to drop and recreate it? (y/n): " recreate_db
    
    if [ "$recreate_db" = "y" ]; then
        echo "Dropping existing database..."
        sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS $NEW_DB_NAME;
DROP USER IF EXISTS $NEW_DB_USER;
EOF
    else
        echo -e "${YELLOW}⚠️  Skipping database creation. Using existing database.${NC}"
        SKIP_DB_CREATE=true
    fi
fi

if [ "${SKIP_DB_CREATE:-false}" != "true" ]; then
    # Create database and user
    sudo -u postgres psql <<EOF
CREATE DATABASE $NEW_DB_NAME;
CREATE USER $NEW_DB_USER WITH PASSWORD '$NEW_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $NEW_DB_NAME TO $NEW_DB_USER;
ALTER ROLE $NEW_DB_USER SET client_encoding TO 'utf8';
ALTER ROLE $NEW_DB_USER SET default_transaction_isolation TO 'read committed';
ALTER ROLE $NEW_DB_USER SET timezone TO 'UTC';
EOF

    # Grant schema permissions
    sudo -u postgres psql -d "$NEW_DB_NAME" <<EOF
GRANT ALL ON SCHEMA public TO $NEW_DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $NEW_DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $NEW_DB_USER;
EOF

    echo -e "${GREEN}✅ Database and user created${NC}"
fi

echo ""

# Step 4: Import data
echo -e "${YELLOW}Step 4: Importing data into new database...${NC}"

PGPASSWORD="$NEW_DB_PASSWORD" pg_restore -h localhost \
           -p 5432 \
           -U "$NEW_DB_USER" \
           -d "$NEW_DB_NAME" \
           -v \
           "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Import completed${NC}"
else
    echo -e "${RED}❌ Import failed${NC}"
    exit 1
fi

echo ""

# Step 5: Verify import
echo -e "${YELLOW}Step 5: Verifying data import...${NC}"

PGPASSWORD="$NEW_DB_PASSWORD" psql -h localhost -U "$NEW_DB_USER" -d "$NEW_DB_NAME" <<EOF
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'polls', COUNT(*) FROM polls
UNION ALL
SELECT 'resources', COUNT(*) FROM resources
UNION ALL
SELECT 'feedbacks', COUNT(*) FROM feedbacks
UNION ALL
SELECT 'themes', COUNT(*) FROM themes
UNION ALL
SELECT 'session_invites', COUNT(*) FROM session_invites
UNION ALL
SELECT 'invitation_requests', COUNT(*) FROM invitation_requests;
EOF

echo ""

# Step 6: Generate .env configuration
echo -e "${YELLOW}Step 6: Generating NEW .env configuration...${NC}"

ENV_FILE=".env.migration"
cat > "$ENV_FILE" <<EOF
# Database (Local PostgreSQL on VPS)
# Generated by migration script on $(date)
# 
# IMPORTANT: These replace your Supabase credentials in .env
# 
# OLD VALUES (Supabase - SOURCE):
# DB_USER=postgres
# DB_PASSWORD=<supabase_password>
# SUPABASE_HOST=<supabase_host>
# DB_NAME=postgres
#
# NEW VALUES (VPS PostgreSQL - DESTINATION):
DB_USER=$NEW_DB_USER
DB_PASSWORD=$NEW_DB_PASSWORD
SUPABASE_HOST=$NEW_DB_HOST
DB_PORT=$NEW_DB_PORT
DB_NAME=$NEW_DB_NAME
EOF

echo -e "${GREEN}✅ Configuration saved to $ENV_FILE${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo ""
echo "1. Review the generated $ENV_FILE file"
echo "2. BACKUP your current .env file (contains Supabase credentials)"
echo "3. Update your VPS .env file at: /home/manssudeploy/manssu-backend/shared/.env"
echo "   Replace the database section with the NEW values from $ENV_FILE"
echo "4. Restart the backend service: sudo systemctl restart manssu-backend"
echo "5. Run 'alembic stamp head' to update migration state"
echo "6. Test the API endpoints"
echo ""
echo -e "${GREEN}✅ Migration script completed!${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} Your old Supabase credentials are saved in the backup file."
echo "You can rollback by restoring the backup .env file if needed."

