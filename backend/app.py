from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.api import router as api_router, meta_router as api_meta_router

app = FastAPI(
    title='Drawing Records API',
    description='API do zarządzania rekordami rysunków technicznych',
    version='1.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(api_router)
app.include_router(api_meta_router)

@app.get('/')
def read_root():
    return {'message': 'Drawing Records API', 'version': '1.0.0'}

@app.get('/health')
def health_check():
    return {'status': 'OK'}

if __name__ == '__main__':
    import uvicorn

    uvicorn.run('app:app', host='0.0.0.0', port=8000, reload=True)
