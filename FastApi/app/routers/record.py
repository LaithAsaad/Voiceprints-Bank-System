import json
from fastapi import status, HTTPException, APIRouter, Depends, File, UploadFile,BackgroundTasks # type: ignore
from sqlalchemy.orm import Session # type: ignore
from typing import List, Optional
import os
import logging
from resemblyzer import VoiceEncoder, preprocess_wav # type: ignore
import librosa
from pathlib import Path
from faster_whisper import WhisperModel # type: ignore
from .. import models, schemas, oauth2
from ..database import get_db
from ..voiceprint_bank import VoicePrintThreads

# System logic APIs


router = APIRouter(
    prefix="/record",
    tags=['Records']
)


voiceprint_instance = None

@router.post("/init", status_code = status.HTTP_201_CREATED)
def init_voiceprint(config: schemas.voicePrintConfig, db : Session = Depends(get_db)):
    global voiceprint_instance
    if voiceprint_instance is not None:
        raise HTTPException(status_code = 400, details = "VoiceprintThreads instance already initialized.")
    
    # Get Absolute Paths
    main_path = Path(__file__).resolve().parent.parent.parent
    folder_path = os.path.join(main_path, config.folder_name)
    search_folder_path = os.path.join(main_path, config.search_folder_name)

    # Check if the folders exist
    if not os.path.exists(folder_path):
        raise HTTPException(status_code = 400, details = "Folder path does not exist: {folder_path}")
    if not os.path.exists(search_folder_path):
        raise HTTPException(status_code = 400, details = "Search folder path does not exist: {search_folder_path}")
    voiceprint_instance = VoicePrintThreads(
        db=db,
        folder_path= folder_path,
        search_folder_path= search_folder_path,
        top_k = config.top_k,
        is_similarity= config.is_similarity,
        reindexing_method= config.reindexing_method,
        reindexing_value= config.reindexing_value,
        maximum_number = config.maximum_number
    )
    return {"message": " VoiceprintThreads instance initialized successfully"}

@router.get("/settings", response_model=schemas.InfoSettings)
def get_init_settings():
    global voiceprint_instance
    if voiceprint_instance is None:
        raise HTTPException(status_code = 400, details = "VoiceprintThreads instance does not initialized.")

    info = schemas.InfoSettings(
        files_folder = os.path.basename(voiceprint_instance.folder_path),
        search_folder = os.path.basename(voiceprint_instance.search_folder_path),
        top_k = voiceprint_instance.top_k,
        is_similarity = voiceprint_instance.is_similarity,
        maximum_number = voiceprint_instance.maximum_number,
        reindex_method = voiceprint_instance.reindexing_method,
        reindex_value = voiceprint_instance.reindexing_value
    )
    return info

@router.post("/run_threads", status_code = status.HTTP_200_OK)
def run_threads(background_tasks: BackgroundTasks):
    global voiceprint_instance

    if voiceprint_instance is None:
        raise HTTPException(status_code = 400, details = "VoiceprintThreads instance is not initialized.")
    
    # Start the threads as a background task
    background_tasks.add_task(voiceprint_instance.runThreads)

    return{"message" : "Threads started successfully."}


@router.post("/search", status_code = status.HTTP_200_OK)
def search(current_user: models.User = Depends(oauth2.get_current_user)):
    global voiceprint_instance

    if voiceprint_instance is None:
        raise HTTPException(status_code = 400, details = "VoiceprintThreads instance is not initialized.")
    
    search_folder = voiceprint_instance.search_folder_path
    user_name = current_user.user_name
    user_folder_path = os.path.join(search_folder, user_name)
    
    if not os.path.isdir(user_folder_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="{user_name} folder not found.")
    
    json_file_path = os.path.join(user_folder_path, f"{user_name}.json")
    
    if not os.path.isfile(json_file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JSON file not found.")
    
    try:
        with open(json_file_path, 'r') as json_file:
            data = json.load(json_file)
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error reading JSON file: {str(ex)}")
    
    return data

@router.get("/folders", status_code = status.HTTP_200_OK)
def get_folders():
    base_path = Path(__file__).resolve().parent.parent.parent
    folders = [f.name for f in base_path.iterdir() if f.is_dir()]
    return {"folders": folders}

@router.post("/uploadfiles", status_code=status.HTTP_200_OK)
async def upload_files(files: List[UploadFile] = File(...),
                       current_user: models.User = Depends(oauth2.get_current_user),
                       db: Session = Depends(get_db)):
    global voiceprint_instance

    if voiceprint_instance is None:
        raise HTTPException(status_code=400, detail="VoiceprintThreads instance is not initialized.")
    
    voice_print_folder = voiceprint_instance.folder_path
    search_folder = voiceprint_instance.search_folder_path

    user_name = current_user.user_name

    user_folder_path = os.path.join(search_folder, user_name)
    os.makedirs(user_folder_path, exist_ok=True)

    try:
        for file in files:
            file_path = os.path.join(voice_print_folder, file.filename)
            data = await file.read()
            with open(file_path, "wb") as buffer:
                buffer.write(data)

            user_file_path = os.path.join(user_folder_path, file.filename)
            with open(user_file_path, "wb") as buffer:
                buffer.write(data)

        return {"message": "Files uploaded Successfully"}
    except Exception as error:
        raise HTTPException(status_code = 500, details = "Failed to upload files")


@router.post("/stop_threads", status_code=status.HTTP_200_OK)
def stop_threads():
    global voiceprint_instance

    if voiceprint_instance is None:
        raise HTTPException(status_code=400, detail="VoiceprintThreads instance is not initialized.")

    # Stop the threads
    voiceprint_instance.stopThreads()
    voiceprint_instance = None 

    return {"message": "Threads stopped and instance reset successfully."}
