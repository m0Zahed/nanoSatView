#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/home/ec2-user/nanoSatview/backups"
PROJECT_DIR="/home/ec2-user/nanoSatview/nanoSatView"

PG_LATEST="$BASE_DIR/postgres/latest.sql"
TS_LATEST="$BASE_DIR/typesense/latest.tgz"

cd "$PROJECT_DIR"

# If no backups, exit cleanly
if [[ ! -f "$PG_LATEST" && ! -f "$TS_LATEST" ]]; then
  echo "no backups found; skipping restore"
  exit 0
fi

# Bring up required services
if [[ -f "$PG_LATEST" ]]; then
  docker compose up -d postgres >/dev/null
fi
if [[ -f "$TS_LATEST" ]]; then
  docker compose up -d typesense >/dev/null
fi

# Restore postgres if backup exists
if [[ -f "$PG_LATEST" ]]; then
  for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
      break
    fi
    sleep 1
    if [[ $i -eq 30 ]]; then
      echo "postgres not ready for restore" >&2
      exit 1
    fi
  done

  # Reset schema and restore
  docker compose exec -T postgres psql -U postgres -d requirements -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >/dev/null
  docker compose exec -T postgres psql -U postgres -d requirements < "$PG_LATEST"
fi

# Restore typesense if backup exists
if [[ -f "$TS_LATEST" ]]; then
  docker compose stop typesense >/dev/null 2>&1 || true
  rm -rf "$PROJECT_DIR/typesense_server"
  tar -xzf "$TS_LATEST" -C "$PROJECT_DIR"
  docker compose up -d typesense >/dev/null
fi

echo "restore complete"
