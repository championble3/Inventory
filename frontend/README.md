# BM32 Frontend

React aplikacja do zarządzania bazą danych BM32.

## Instalacja

```bash
cd frontend
npm install
```

## Uruchomienie

```bash
npm run dev
```

Aplikacja otworzy się automatycznie na `http://localhost:5173`

## Funkcjonalności

- 📋 Wyświetlanie wszystkich rekordów z bazy danych
- 🔍 Wyszukiwanie rekordów po numerze rysunku (nr_rys)
- 📊 Tabela z kolumnami: nr rysunku, nazwa, materiał, data, linki do PDF i plików
- 🗂️ Pasek boczny z zakładkami baz danych (aktualnie BM32)

## Build

```bash
npm run build
```

## Struktura plików

```
frontend/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Sidebar.css
│   │   ├── MainContent.jsx
│   │   └── MainContent.css
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Wymagania

- Node.js 16+
- Backend API na `http://127.0.0.1:8000`
