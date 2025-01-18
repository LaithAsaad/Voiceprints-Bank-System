from passlib.context import CryptContext # type: ignore
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Define function that hash the user password and verify it
def hash(password: str):
    return pwd_context.hash(password)


def verify(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
