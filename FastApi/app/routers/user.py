from typing import List
from fastapi import Response, status, HTTPException, Depends, APIRouter # type: ignore
from sqlalchemy.orm import Session # type: ignore
from sqlalchemy import func # type: ignore
from .. import oauth2, models, schemas, utils
from ..database import get_db
from ..oauth2 import admin_only

router = APIRouter(
    prefix="/users",
    tags=['Users']
)

# CRUD operation on User table...

@router.post("/create", status_code=status.HTTP_201_CREATED, response_model=schemas.UserOut
             , dependencies=[Depends(admin_only)]
             )
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db) 
                , current_user: models.User = Depends(oauth2.get_current_user)
                ):

    # hash the password - user.password
    hashed_password = utils.hash(user.password)
    user.password = hashed_password

    new_user = models.User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.get('/getUser/{id}', response_model=schemas.UserOut
            , dependencies=[Depends(admin_only)]
            )
def get_user(id: int, db: Session = Depends(get_db) 
             , current_user: models.User = Depends(oauth2.get_current_user)
             ):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"User with id: {id} does not exist")

    return user

@router.get('/getUsers', response_model=List[schemas.UserOut], 
            dependencies=[Depends(admin_only)]
            )
def get_user(db: Session = Depends(get_db)
              , current_user: models.User = Depends(oauth2.get_current_user)
            ):
    users = db.query(models.User).filter(models.User.id != current_user.id).all()
    if users is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"No User exist")

    return users

@router.delete("/delete/{id}", status_code=status.HTTP_204_NO_CONTENT
               , dependencies=[Depends(admin_only)]
               )
def delete_user(id: int, db: Session = Depends(get_db)
                  , current_user: models.User = Depends(oauth2.get_current_user)
                ):

    user_query = db.query(models.User).filter(models.User.id == id)
    user = user_query.first()

    if user == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user with id: {id} does not exist")
    
    user_query.delete(synchronize_session=False)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/update/{id}", status_code=status.HTTP_200_OK
               , dependencies=[Depends(admin_only)]
               )
def update_user(id: int, user_updated: schemas.UserUpdate, db: Session = Depends(get_db)
                  , current_user: models.User = Depends(oauth2.get_current_user)
                ):

    user_query = db.query(models.User).filter(models.User.id == id)
    user = user_query.first()

    if user == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user with id: {id} does not exist")
    
    # hash the password - user.password
    hashed_password = utils.hash(user.password)
    user_updated.password = hashed_password

    user_data = user_updated.dict(exclude_unset=True)
    user_data['created_at'] = user_updated.created_at
    user_data['updated_at'] = func.now()
    # Update the user record in the database
    user_query.update(user_data, synchronize_session=False)
    
    # Commit the transaction
    db.commit()

    return Response(status_code=status.HTTP_200_OK)