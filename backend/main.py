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