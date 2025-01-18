from pydantic import BaseModel # type: ignore
from datetime import datetime
from typing import Optional, List

# Define pydantic classes that can use to ensure the request structure


class RecordBase(BaseModel):
    file_name: str
    text: str
    voiceprint : List[float]
    is_indexed: bool = False


class RecordCreate(RecordBase):
    pass

class Record(BaseModel):
    main_path: str
    file_path: str

class voicePrintConfig(BaseModel):
    folder_name: str
    search_folder_name : str
    top_k : int
    is_similarity : bool
    reindexing_method : str
    reindexing_value : int
    maximum_number : int

class SearchRecord(BaseModel):
    file_name : str

class UserCreate(BaseModel):
    user_name : str
    password : str
    is_admin : Optional[bool] = False

class UserOut(BaseModel):
    id: int
    user_name : str
    is_admin : bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    user_name : str
    password : str
    is_admin : bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseModel):
    id: Optional[int] = None


class InfoSettings(BaseModel):
    files_folder : str
    search_folder : str
    top_k : int
    is_similarity : bool
    maximum_number : int
    reindex_method : str
    reindex_value : int