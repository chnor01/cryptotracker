from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os, mysql.connector
from dotenv import load_dotenv
from typing import Literal


load_dotenv()
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWD = os.getenv("MYSQL_PASSWD")
MYSQL_DB = os.getenv("MYSQL_DB")

def get_db_connection():
    return mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWD,
        database=MYSQL_DB
    )

app = FastAPI(title="CryptoAPI", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/coin/{coin_id}")
def get_coin_price(coin_id: str):
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT c.id, c.symbol, c.name, p.usd, p.usd_market_cap, p.usd_24h_vol, p.usd_24h_change, p.last_updated_at
            FROM coins c
            JOIN prices p ON c.id = p.id
            WHERE c.id = %s;
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


@app.get("/api/v1/coins/all-coins")
def get_all_coin_prices():
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = f"""
            SELECT c.id, c.name, c.symbol, p.usd, p.usd_market_cap, p.usd_24h_vol, p.usd_24h_change, p.last_updated_at
            FROM coins c
            JOIN prices p ON c.id = p.id;
        """
        cursor.execute(query)
        result = cursor.fetchall()

        cursor.close()
        conn.close()

        if not result:
            raise HTTPException(status_code=404, detail="No coins found")

        return result
    
    except mysql.connector.Error as err:
        raise HTTPException(500, detail=str(err))


@app.get("/api/v1/coins/top-market-cap")
def get_coins_by_market_cap(
    limit: int = Query(20, gt=0, le=100),
    offset: int = Query(0, ge=0, le=10000),
    sort_key: Literal["id", "name", "usd", "usd_market_cap", "usd_24h_vol", "usd_24h_change"] = Query("usd_market_cap"),
    sort_order: Literal["asc", "desc"] = Query("desc")
    ):
    try: 
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        SORT_COLUMNS = {
        "id": "c.id",
        "name": "c.name",
        "usd": "p.usd", 
        "usd_market_cap": "p.usd_market_cap",
        "usd_24h_vol": "p.usd_24h_vol",
        "usd_24h_change": "p.usd_24h_change"
        }
        sort_column = SORT_COLUMNS[sort_key]
        
        query = f"""
            SELECT c.id, c.name, p.usd, p.usd_market_cap, p.usd_24h_vol, p.usd_24h_change, p.last_updated_at
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
            ORDER BY p.usd_market_cap DESC
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
            SUM(usd_market_cap) as total_market_cap, 
            AVG(usd) as avg_price 
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

        query = f"""
            SELECT id, timestamp, usd, usd_market_cap, volume
            FROM hist
            WHERE id = %s
            ORDER BY timestamp ASC
            LIMIT %s;
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