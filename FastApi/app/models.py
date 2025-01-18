from sqlalchemy import Column, Integer, String, Boolean, ARRAY, Float, TIMESTAMP # type: ignore
from datetime import datetime

from .database import Base

# Voiceprints Bank system has simple database, two tables, each one has six columns
# First one store details from wav files like (name, text, voiceprint, is the file active in index file building?)
# Second table store users details like (user name which is unique, password,...) 

class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, nullable=False)
    file_name = Column(String, nullable=False)
    text = Column(String, nullable=False)
    voiceprint = Column(ARRAY(Float), nullable=False)
    is_indexed = Column(Boolean, server_default='False', nullable=False)
    created_at = Column(TIMESTAMP(timezone=True),
                        nullable=False, server_default='now()')

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, nullable=False)
    user_name = Column(String, nullable=False, unique = True)
    password = Column(String, nullable=False)
    is_admin = Column(Boolean, server_default='False', nullable=False)
    created_at = Column(TIMESTAMP(timezone=True),
                        nullable=False, server_default='now()')
    updated_at = Column(TIMESTAMP(timezone=True),
                        nullable=False, server_default='now()')