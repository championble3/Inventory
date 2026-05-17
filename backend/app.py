from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.api import router as bm32_router

# ==================== Inicjalizacja aplikacji ====================

app = FastAPI(
    title="BM32 API",
    description="API do zarządzania danymi BM32",
    version="1.0.0"
)


# ==================== CORS ====================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # W produkcji zmienić na konkretne originy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Rejestracja routerów ====================

app.include_router(bm32_router)


# ==================== Root Endpoint ====================

@app.get("/")
def read_root():
    """Główny endpoint aplikacji"""
    return {
        "message": "Witaj w BM32 API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health_check():
    """Sprawdzenie zdrowia aplikacji"""
    return {"status": "OK"}


# ==================== Uruchomienie ====================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # W produkcji ustawić na False
    )

