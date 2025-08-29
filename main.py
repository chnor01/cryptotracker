from fastapi import FastAPI, HTTPException, Query
import requests, os, json, mysql.connector, time
from dotenv import load_dotenv
from datetime import datetime
from pprint import pprint


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

@app.get("/market-data/coin/{coin_id}")
def get_coin_price(coin_id):
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT c.id, p.usd, p.usd_market_cap, p.usd_24h_vol, p.usd_24h_change, p.last_updated_at
        FROM coins c
        JOIN prices p ON c.id = p.id
        WHERE c.id = %s
    """
    cursor.execute(query, (coin_id,))
    result = cursor.fetchone()

    cursor.close()
    conn.close()

    if not result:
        raise HTTPException(status_code=404, detail="Coin not found")

    return result


@app.get("/market-data/all-coins")
def get_coins_by_market_cap():
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT c.id, p.usd, p.usd_market_cap, p.usd_24h_vol, p.usd_24h_change, p.last_updated_at
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

