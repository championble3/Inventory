from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import os
from pathlib import Path

Base = declarative_base()

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class BM32(Base):
    __tablename__ = "bm32"
    
    nr_rys = Column(String, primary_key=True, index=True)
    full_name = Column(String, default=None)
    material = Column(String, default=None)
    date = Column(DateTime, default=datetime.now)
    pdf_url = Column(String, default=None)
    pliki_url = Column(String, default=None)
    
    def __repr__(self):
        return f"<bm32(nr_rys={self.nr_rys}, full_name='{self.full_name}')>"

# Konfiguracja bazy danych
db_path = Path(BACKEND_DIR) / "app.db"
DATABASE_URL = f"sqlite:///{db_path.as_posix()}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Tworzenie tabel
Base.metadata.create_all(bind=engine)