from fastapi import FastAPI # type: ignore
from fastapi.staticfiles import StaticFiles # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from .database import engine
from .routers import record, user, auth
from . import models

# Main file call the function that build the tables in database
# Add middleware to deal with frontend request..
# Route the requests for the it's file...
# Define the way to send voices from backend to frontend

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(record.router)
app.include_router(user.router)
app.include_router(auth.router)

# Serve files in the "Files" directory under the "./audio" path
app.mount("/audio", StaticFiles(directory = "./Files"), name = "audio")
@app.get("/")
def root():
    return {"message": "Voiceprint Bank"}
