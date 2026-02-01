#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/home/ec2-user/nanoSatview/backups"
PROJECT_DIR="/home/ec2-user/nanoSatview/nanoSatView"
TS="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BASE_DIR/postgres" "$BASE_DIR/typesense"

cd "$PROJECT_DIR"

# Ensure postgres is up for pg_dump
if ! docker compose ps --services --status running | rg -q '^postgres$'; then
  docker compose up -d postgres >/dev/null
fi

# Wait for postgres to be ready
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [[ $i -eq 30 ]]; then
    echo "postgres not ready for backup" >&2
    exit 1
  fi
done

# Postgres backup
PG_BACKUP="$BASE_DIR/postgres/requirements-$TS.sql"
docker compose exec -T postgres pg_dump -U postgres -d requirements > "$PG_BACKUP"
ln -sfn "$PG_BACKUP" "$BASE_DIR/postgres/latest.sql"

# Typesense backup (bind-mounted dir)
TS_BACKUP="$BASE_DIR/typesense/typesense-$TS.tgz"
tar -czf "$TS_BACKUP" -C "$PROJECT_DIR" typesense_server
ln -sfn "$TS_BACKUP" "$BASE_DIR/typesense/latest.tgz"

echo "backup complete: $TS"
