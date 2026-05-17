from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, sessionmaker
from typing import List
from datetime import datetime
import pandas as pd
from openpyxl import load_workbook
import io
import os
import platform
import subprocess
from pathlib import Path
from urllib.parse import unquote
from dotenv import load_dotenv
import re

from backend.models.bm32 import DrawingRecord, engine
from pydantic import BaseModel

# ==================== Konfiguracja ścieżek ====================
load_dotenv()
BASE_DOCS_PATH = os.getenv('BASE_DOCS_PATH', r'F:\REGENERACJA - DOKUMENTACJA')

SessionLocal = sessionmaker(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def validate_table_name(table_name: str):
    if not table_name or not re.match(r'^[A-Za-z0-9_-]+$', table_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Nieprawidłowa nazwa tabeli: {table_name}'
        )


class DrawingRecordBase(BaseModel):
    nr_rys: str
    full_name: str | None = None
    material: str | None = None
    pdf_url: str | None = None
    pliki_url: str | None = None


class DrawingRecordCreate(DrawingRecordBase):
    pass


class DrawingRecordUpdate(BaseModel):
    full_name: str | None = None
    material: str | None = None
    pdf_url: str | None = None
    pliki_url: str | None = None


class DrawingRecordResponse(DrawingRecordBase):
    id: int
    table_name: str
    date: datetime | None = None

    class Config:
        orm_mode = True


class IngestionResult(BaseModel):
    success: bool
    records_added: int
    message: str


router = APIRouter(prefix='/api/{table_name}', tags=['Drawing Records'])


@router.get('/', response_model=List[DrawingRecordResponse])
def get_records(table_name: str, skip: int = 0, db: Session = Depends(get_db)):
    validate_table_name(table_name)
    records = db.query(DrawingRecord).filter(DrawingRecord.table_name == table_name).offset(skip).all()
    return records


@router.get('/{nr_rys}', response_model=DrawingRecordResponse)
def get_record(table_name: str, nr_rys: str, db: Session = Depends(get_db)):
    validate_table_name(table_name)
    record = db.query(DrawingRecord).filter(
        DrawingRecord.table_name == table_name,
        DrawingRecord.nr_rys == nr_rys
    ).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Rekord z nr_rys={nr_rys} nie znaleziony w tabeli {table_name}'
        )
    return record


@router.post('/', response_model=DrawingRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(table_name: str, record: DrawingRecordCreate, db: Session = Depends(get_db)):
    validate_table_name(table_name)
    existing_record = db.query(DrawingRecord).filter(
        DrawingRecord.table_name == table_name,
        DrawingRecord.nr_rys == record.nr_rys
    ).first()
    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Rekord z nr_rys={record.nr_rys} już istnieje w tabeli {table_name}'
        )

    new_record = DrawingRecord(
        table_name=table_name,
        nr_rys=record.nr_rys,
        full_name=record.full_name,
        material=record.material,
        pdf_url=record.pdf_url,
        pliki_url=record.pliki_url,
        date=datetime.now()
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.put('/{nr_rys}', response_model=DrawingRecordResponse)
def update_record(table_name: str, nr_rys: str, record_update: DrawingRecordUpdate, db: Session = Depends(get_db)):
    validate_table_name(table_name)
    record = db.query(DrawingRecord).filter(
        DrawingRecord.table_name == table_name,
        DrawingRecord.nr_rys == nr_rys
    ).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Rekord z nr_rys={nr_rys} nie znaleziony w tabeli {table_name}'
        )
    update_data = record_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete('/{nr_rys}', status_code=status.HTTP_204_NO_CONTENT)
def delete_record(table_name: str, nr_rys: str, db: Session = Depends(get_db)):
    validate_table_name(table_name)
    record = db.query(DrawingRecord).filter(
        DrawingRecord.table_name == table_name,
        DrawingRecord.nr_rys == nr_rys
    ).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Rekord z nr_rys={nr_rys} nie znaleziony w tabeli {table_name}'
        )
    db.delete(record)
    db.commit()
    return None


@router.get('/search/material/{material}', response_model=List[DrawingRecordResponse])
def search_by_material(table_name: str, material: str, db: Session = Depends(get_db)):
    validate_table_name(table_name)
    records = db.query(DrawingRecord).filter(
        DrawingRecord.table_name == table_name,
        DrawingRecord.material.contains(material)
    ).all()
    return records


@router.get('/search/name/{full_name}', response_model=List[DrawingRecordResponse])
def search_by_name(table_name: str, full_name: str, db: Session = Depends(get_db)):
    validate_table_name(table_name)
    records = db.query(DrawingRecord).filter(
        DrawingRecord.table_name == table_name,
        DrawingRecord.full_name.contains(full_name)
    ).all()
    return records


@router.post('/ingestion/excel', response_model=IngestionResult)
def ingest_from_excel(table_name: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    validate_table_name(table_name)
    try:
        contents = file.file.read()
        excel_file = io.BytesIO(contents)
        df = pd.read_excel(excel_file, sheet_name=table_name)
        excel_file.seek(0)
        ws = load_workbook(excel_file)[table_name]
        ws_rows = list(ws.iter_rows(min_row=2))
        records_added = 0

        for (_, row), ws_row in zip(df.iterrows(), ws_rows):
            pdf_cell = ws_row[4]
            pliki_cell = ws_row[5]
            nr_rys = row.get('Nr rys.')
            if pd.isna(nr_rys) or nr_rys is None:
                continue
            nr_rys = str(nr_rys)
            raw_date = row.get('Data')
            clean_date = None if pd.isna(raw_date) else raw_date
            raw_material = row.get('Materiał')
            clean_material = None if pd.isna(raw_material) else str(raw_material)
            existing = db.query(DrawingRecord).filter(
                DrawingRecord.table_name == table_name,
                DrawingRecord.nr_rys == nr_rys
            ).first()
            if not existing:
                new_record = DrawingRecord(
                    table_name=table_name,
                    nr_rys=nr_rys,
                    full_name=row.get('Pełna nazwa'),
                    material=clean_material,
                    date=clean_date,
                    pdf_url=pdf_cell.hyperlink.target if pdf_cell.hyperlink else None,
                    pliki_url=pliki_cell.hyperlink.target if pliki_cell.hyperlink else None,
                )
                db.add(new_record)
                records_added += 1

        db.commit()
        return IngestionResult(
            success=True,
            records_added=records_added,
            message=f'Pomyślnie wczytano {records_added} nowych rekordów do tabeli {table_name}'
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Błąd podczas ingestion: {str(e)}'
        )


@router.post('/{nr_rys}/upload-pdf')
async def upload_pdf(table_name: str, nr_rys: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    validate_table_name(table_name)
    record = db.query(DrawingRecord).filter(
        DrawingRecord.table_name == table_name,
        DrawingRecord.nr_rys == nr_rys
    ).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Rekord z nr_rys={nr_rys} nie znaleziony w tabeli {table_name}'
        )
    try:
        pdfs_dir = Path(__file__).parent.parent / 'pdfs' / table_name / nr_rys
        pdfs_dir.mkdir(parents=True, exist_ok=True)
        file_path = pdfs_dir / file.filename
        contents = await file.read()
        with open(file_path, 'wb') as f:
            f.write(contents)
        record.pdf_url = str(file_path)
        db.commit()
        return {
            'success': True,
            'message': f'PDF {file.filename} załadowany pomyślnie',
            'pdf_path': str(file_path)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Błąd przy przesyłaniu PDF: {str(e)}'
        )


@router.get('/{nr_rys}/open-pdf')
def open_pdf(table_name: str, nr_rys: str, db: Session = Depends(get_db)):
    validate_table_name(table_name)
    record = db.query(DrawingRecord).filter(
        DrawingRecord.table_name == table_name,
        DrawingRecord.nr_rys == nr_rys
    ).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Rekord z nr_rys={nr_rys} nie znaleziony w tabeli {table_name}'
        )
    if not record.pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Brak przypisanego pliku PDF dla nr_rys={nr_rys}'
        )
    pdf_path = unquote(record.pdf_url)
    if not os.path.isabs(pdf_path):
        pdf_path = os.path.join(BASE_DOCS_PATH, pdf_path)
    try:
        if not os.path.exists(pdf_path):
            raise Exception(f'Plik nie istnieje na dysku: {pdf_path}')
        if platform.system() == 'Windows':
            os.startfile(pdf_path)
        elif platform.system() == 'Darwin':
            subprocess.run(['open', pdf_path])
        else:
            subprocess.run(['xdg-open', pdf_path])
        return {'success': True, 'message': f'Otwieranie pliku: {pdf_path}'}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Błąd przy otwieraniu PDF: {str(e)}'
        )


@router.get('/{nr_rys}/open-files')
def open_files(table_name: str, nr_rys: str, db: Session = Depends(get_db)):
    validate_table_name(table_name)
    record = db.query(DrawingRecord).filter(
        DrawingRecord.table_name == table_name,
        DrawingRecord.nr_rys == nr_rys
    ).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Rekord z nr_rys={nr_rys} nie znaleziony w tabeli {table_name}'
        )
    if not record.pliki_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Brak przypisanego folderu z plikami dla nr_rys={nr_rys}'
        )
    files_path = unquote(record.pliki_url)
    if not os.path.isabs(files_path):
        files_path = os.path.join(BASE_DOCS_PATH, files_path)
    try:
        if not os.path.exists(files_path):
            raise Exception(f'Folder nie istnieje na dysku: {files_path}')
        if platform.system() == 'Windows':
            os.startfile(files_path)
        elif platform.system() == 'Darwin':
            subprocess.run(['open', files_path])
        else:
            subprocess.run(['xdg-open', files_path])
        return {'success': True, 'message': f'Otwieranie folderu: {files_path}'}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Błąd przy otwieraniu folderu: {str(e)}'
        )
