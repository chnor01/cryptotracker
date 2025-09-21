from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from jose import jwt
import bcrypt, os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

def hash_password(password: str):
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password=password_bytes, salt=salt)
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str):
    plain_password_enc = plain.encode("utf-8")
    hashed_password_enc = hashed.encode("utf-8")
    return bcrypt.checkpw(plain_password_enc, hashed_password_enc)


def create_access_token(data: dict, expires_in: int = 60):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_in)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
