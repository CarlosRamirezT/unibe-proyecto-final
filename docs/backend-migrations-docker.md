# Backend Migrations in Docker

This backend applies migrations automatically on startup via `db.Database.MigrateAsync()` in `Program.cs`.
That means a normal `docker compose up -d --build` is enough for most cases.

## Prerequisites

- Docker daemon running.
- A `.env` file at repo root with DB credentials.

## Automatic migration on startup

```bash
docker compose up -d --build
```

When `backend` starts and `db` is healthy, it applies pending migrations automatically.

## Manual migration generation (schema change)

If you change models and need a new migration:

1. Ensure .NET 8 runtime/SDK is installed locally (required by this project target `net8.0`).
2. Generate migration from repo root:

```bash
cd backend
dotnet dotnet-ef migrations add <MigrationName>
```

3. Commit new files under `backend/Migrations/`.

## Manual migration apply in Docker

If you need to force migration execution explicitly in a one-off SDK container:

```bash
docker run --rm \
  --network unibe-proyecto-final_app-net \
  -v "$PWD/backend:/src" \
  -w /src \
  -e ConnectionStrings__DefaultConnection="Host=db;Port=5432;Database=${POSTGRES_DB:-tradingdb};Username=${POSTGRES_USER:-trading};Password=${POSTGRES_PASSWORD:-tradingpass}" \
  mcr.microsoft.com/dotnet/sdk:8.0 \
  sh -lc 'dotnet restore && dotnet tool restore && dotnet dotnet-ef database update'
```

Notes:
- The Docker network name follows Compose default: `<project>_app-net`.
- If your Compose project name changes, update `--network` accordingly.
