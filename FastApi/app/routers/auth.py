from fastapi import APIRouter, Depends, status, HTTPException # type: ignore
from fastapi.security.oauth2 import OAuth2PasswordRequestForm # type: ignore
from sqlalchemy.orm import Session # type: ignore

from .. import schemas, models, utils, oauth2
from ..database import get_db
router = APIRouter(tags=['Authentication'])

# Deal with lodin operation, and creating new tokens

@router.post('/login', response_model=schemas.Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    user = db.query(models.User).filter(
        models.User.user_name == user_credentials.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=f"Invalid Credentials")

    if not utils.verify(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=f"Invalid Credentials")

    # create a token
    # return token

    access_token = oauth2.create_access_token(data={"user_id": user.id, "is_admin" : user.is_admin})
    refresh_token = oauth2.create_refresh_token(data={"user_id": user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post('/refresh')
def refresh_token(refresh_token: str = Depends(oauth2.get_refresh_token), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    token_data = oauth2.verify_refresh_token(refresh_token, credentials_exception)
    user = db.query(models.User).filter(models.User.id == token_data.id).first()
    if not user:
        raise credentials_exception

    new_access_token = oauth2.create_access_token(data={"user_id": user.id, "is_admin": user.is_admin})
    new_refresh_token = oauth2.create_refresh_token(data={"user_id": user.id})

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }
