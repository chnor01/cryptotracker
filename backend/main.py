from fastapi import FastAPI, HTTPException, Query, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from typing import Literal
from auth import hash_password, verify_password, create_access_token
from jose import jwt, JWTError
from pydantic import BaseModel, Field, EmailStr, condecimal
from typing import Annotated
from decimal import Decimal
import os, mysql.connector


load_dotenv()
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWD = os.getenv("MYSQL_PASSWD")
MYSQL_DB = os.getenv("MYSQL_DB")
SECRET_KEY = os.getenv("SECRET_KEY")

    
class UserRegistration(BaseModel):
    username: Annotated[
        str,
        Field(min_length=3, max_length=20, pattern="^[a-zA-Z0-9_]{3,20}$")
    ]
    email: EmailStr
    password: Annotated[
        str,
        Field(min_length=8)
    ]
    
def get_db_connection():
    return mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWD,
        database=MYSQL_DB
    )

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(title="CryptoAPI", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

icons_dir = os.path.join(os.getcwd(), "coin_icons")
app.mount("/icons", StaticFiles(directory=icons_dir), name="icons")



@app.post("/api/v1/register")
def register(user: UserRegistration):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        hashed_pw = hash_password(user.password)
        sql = "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)"
        cursor.execute(sql, (user.username, user.email, hashed_pw))
        
        conn.commit()
        return {"msg": "User registered successfully"}
    
    except mysql.connector.IntegrityError:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    except mysql.connector.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.post("/api/v1/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = None
    cursor = None
    try: 
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = "SELECT * FROM users WHERE username=%s"
        cursor.execute(sql, (form_data.username,))
        user = cursor.fetchone()
        cursor.close()
        
        if not user or not verify_password(form_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"})
        
        token = create_access_token({"user_id": user["user_id"]})
        return {"access_token": token, "token_type": "bearer"}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.get("/api/v1/me")
def read_users_me(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id: int = payload.get("user_id")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT user_id, username, email, created_time FROM users WHERE user_id=%s"
        cursor.execute(sql, (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    


@app.get("/api/v1/coin/{coin_id}")
def get_coin_price(coin_id: str):
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT c.id, c.symbol, c.name, p.current_price, p.market_cap, p.market_cap_rank, p.fully_diluted_valuation, p.total_volume,
            p.high_24h, p.low_24h, p.price_change_24h, p.price_change_percentage_24h, p.market_cap_change_24h, p.market_cap_change_percentage_24h,
            p.circulating_supply, p.total_supply, p.max_supply, p.ath, p.ath_date, p.atl, p.atl_date
            FROM coins c
            JOIN prices p ON c.id = p.id
            WHERE p.id = %s;
        """
        cursor.execute(query, (coin_id,))
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if not result:
            raise HTTPException(status_code=404, detail="Coin not found")

        return result
    
    except mysql.connector.Error as err:
        raise HTTPException(500, detail=str(err))


@app.get("/api/v1/coins/all")
def get_coins_by_market_cap(
    limit: int = Query(20, gt=0, le=100),
    offset: int = Query(0, ge=0, le=10000),
    sort_key: Literal["id", "name", "current_price", "market_cap", "price_change_percentage_24h", "circulating_supply"] = Query("market_cap"),
    sort_order: Literal["asc", "desc"] = Query("desc")
    ):
    try: 
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        SORT_COLUMNS = {
        "id": "c.id",
        "name": "c.name",
        "symbol": "c.symbol",
        "current_price": "p.current_price", 
        "market_cap": "p.market_cap",
        "price_change_percentage_24h": "p.price_change_percentage_24h",
        "circulating_supply": "p.circulating_supply"
        }
        sort_column = SORT_COLUMNS[sort_key]
        
        query = f"""
            SELECT c.id, c.name, c.symbol, p.current_price, p.market_cap, p.price_change_percentage_24h, p.circulating_supply
            FROM coins c
            JOIN prices p ON c.id = p.id
            ORDER BY {sort_column} {sort_order}
            LIMIT %s OFFSET %s;
        """
        cursor.execute(query, (limit, offset))
        result = cursor.fetchall()

        cursor.close()
        conn.close()

        if not result:
            raise HTTPException(status_code=404, detail="No coins found")

        return result
    
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    
    
@app.get("/api/v1/coins/search")
def get_coin_search(
    coin: str, 
    limit: int = Query(20, gt=0, le=100)):
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT c.id, c.symbol, c.name
            FROM coins c
            JOIN prices p ON c.id = p.id
            WHERE c.id LIKE %s OR c.symbol LIKE %s OR c.name LIKE %s
            ORDER BY p.market_cap DESC
            LIMIT %s;
        """
        search_term = f"%{coin}%"
        cursor.execute(query, (search_term, search_term, search_term, limit))
        result = cursor.fetchall()

        cursor.close()
        conn.close()

        if not result:
            raise HTTPException(status_code=404, detail="No coins found")

        return result
    
    except mysql.connector.Error as err:
        raise HTTPException(500, detail=str(err))
    
    
@app.get("/api/v1/coins/summary")
def get_coins_summary():
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT COUNT(*) as total_coins, 
            SUM(market_cap) as total_market_cap, 
            AVG(current_price) as avg_price 
            FROM prices;
        """
        
        cursor.execute(query)
        result = cursor.fetchall()

        cursor.close()
        conn.close()

        if not result:
            raise HTTPException(status_code=500, detail="Failed to retrieve data")

        return result
    
    except mysql.connector.Error as err:
        raise HTTPException(500, detail=str(err))
    
    
@app.get("/api/v1/coins/{coin_id}/historical")
def get_historical_prices(
    coin_id: str, 
    days: int = Query(7, gt=0, le=1000)
):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT id, timestamp, usd, usd_market_cap, volume
            FROM (
            SELECT id, timestamp, usd, usd_market_cap, volume
            FROM hist
            WHERE id = %s
            ORDER BY timestamp DESC
            LIMIT %s
            ) AS recent
            ORDER BY timestamp ASC;
        """
        cursor.execute(query, (coin_id, days))
        result = cursor.fetchall()

        cursor.close()
        conn.close()

        if not result:
            raise HTTPException(status_code=404, detail="No coin found")

        return result
    
    except mysql.connector.Error as err:
        raise HTTPException(500, detail=str(err))
    
    
class PortfolioAdd(BaseModel):
    coin_id: str = Field(..., min_length=1)
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=8)

@app.post("/api/v1/portfolio/add")
def add_portfolio(
    request: PortfolioAdd,
    token: str = Depends(oauth2_scheme)
):
    conn = None
    cursor = None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id: int = payload.get("user_id")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            INSERT INTO portfolio (user_id, coin_id, amount)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount);
        """
        cursor.execute(query, (user_id, request.coin_id, request.amount))
        conn.commit()

        cursor.close()
        conn.close()
        
        return {"msg": "Added to portfolio"}

    except mysql.connector.Error as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
@app.get("/api/v1/portfolio/get")
def get_portfolio(
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id: int = payload.get("user_id")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
            portfolio.id, portfolio.coin_id, portfolio.amount, portfolio.created_at, 
            prices.current_price, prices.market_cap, prices.high_24h, prices.low_24h, prices.price_change_24h, 
            prices.price_change_percentage_24h
            FROM portfolio
            JOIN prices ON portfolio.coin_id = prices.id
            WHERE portfolio.user_id = %s;
        """
        
        cursor.execute(query, (user_id,))
        result = cursor.fetchall()

        cursor.close()
        conn.close()

        if not result:
            raise HTTPException(status_code=404, detail="No data found")

        return result
    
    except mysql.connector.Error as err:
        raise HTTPException(500, detail=str(err))
    