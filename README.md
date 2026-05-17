# Inventory

A monorepo for managing technical drawing records with a FastAPI backend and a React + Vite frontend.

## Project structure

- `backend/` - FastAPI app, SQLAlchemy models, database logic, Excel ingestion and file handling
- `frontend/` - React + Vite app with sidebar tabs and editor panel

## Backend

The backend uses:

- FastAPI
- SQLAlchemy + SQLite
- Pydantic
- pandas + openpyxl for Excel ingestion
- dotenv for environment configuration

### Run backend

```bash
cd backend
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

### API

The backend exposes a universal router for multiple databases/tables with paths like:

- `GET /api/{table_name}/`
- `GET /api/{table_name}/{nr_rys}`
- `POST /api/{table_name}/`
- `PUT /api/{table_name}/{nr_rys}`
- `DELETE /api/{table_name}/{nr_rys}`
- `GET /api/{table_name}/search/material/{material}`
- `GET /api/{table_name}/search/name/{full_name}`
- `POST /api/{table_name}/ingestion/excel`
- `POST /api/{table_name}/{nr_rys}/upload-pdf`
- `GET /api/{table_name}/{nr_rys}/open-pdf`
- `GET /api/{table_name}/{nr_rys}/open-files`

## Frontend

The frontend is a Vite-powered React app.

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend uses a sidebar with database tabs and a central editor panel for record details.

## Notes

- The backend currently stores all drawing records in a single SQLite table with `table_name` to support multiple logical tables.
- The frontend maps UI tabs to API table names.
- The repository has been initialized and pushed to `https://github.com/championble3/Inventory.git`.
