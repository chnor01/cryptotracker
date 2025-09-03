import requests, os, json, mysql.connector, time
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
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

def retrieve_coins_id():
    url = "https://api.coingecko.com/api/v3/coins/list"
    headers = {"x-cg-demo-api-key" : COINGECKO_API_KEY}
    response = requests.get(url, headers=headers)
    return response.json()

def save_coins_id(data):

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("CREATE DATABASE IF NOT EXISTS crypto_db")
    cursor.execute("CREATE TABLE IF NOT EXISTS coins (id VARCHAR(255) PRIMARY KEY, symbol VARCHAR(255), name VARCHAR(255))")
    
    values_list = []
    for coin in data:
        coin_id = coin.get("id")
        symbol = coin.get("symbol")
        name = coin.get("name")
        values_list.append((coin_id, symbol, name))

        sql = """
            INSERT INTO coins (id, symbol, name) VALUES (%s, %s, %s) 
            ON DUPLICATE KEY UPDATE id = id
        """

    cursor.executemany(sql, values_list)
    conn.commit()
    print(f"{cursor.rowcount} record inserted.")
    cursor.close()
    conn.close()
        
result_coins_id = retrieve_coins_id()
save_coins_id(result_coins_id)

    
def retrieve_coins_prices(coin_ids):   
    url = "https://api.coingecko.com/api/v3/simple/price"
    headers = {"x-cg-demo-api-key" : COINGECKO_API_KEY}
    params = {"vs_currencies": "usd", "ids": ",".join(coin_ids), "include_market_cap": "true", 
              "include_24hr_vol": "true", "include_24hr_change": "true", "include_last_updated_at": "true", "precision": "3"}
    response = requests.get(url, headers=headers, params=params)
    return response.json()


def save_coins_prices(data):

    conn = get_db_connection()
    cursor = conn.cursor()

    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prices (id VARCHAR(255) PRIMARY KEY, usd DECIMAL(24,3), usd_market_cap DECIMAL(24,3), 
    usd_24h_vol DECIMAL(24,3), usd_24h_change DECIMAL(10,3), last_updated_at DATETIME)""")
    
    details_list = []
    for coin_id, details in data.items():
        usd = details.get("usd")
        usd_market_cap = details.get("usd_market_cap")
        usd_24h_vol = details.get("usd_24h_vol")
        usd_24h_change = details.get("usd_24h_change")
        unix_time = details.get("last_updated_at")
        
        if usd is None or usd <= 0:
            continue
        if usd_market_cap is None or usd_market_cap <= 0:
            continue
        if unix_time is None:
            continue
        if usd_24h_change is None:
            usd_24h_change = 0.0
            
        last_updated_at = datetime.fromtimestamp(unix_time, tz=timezone.utc)
        if last_updated_at < one_hour_ago:
            continue
        
        details_list.append((coin_id, usd, usd_market_cap, usd_24h_vol, usd_24h_change, last_updated_at))
        
    if details_list:
    
        sql = """
            INSERT INTO prices (id, usd, usd_market_cap, usd_24h_vol, usd_24h_change, last_updated_at) VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE usd = VALUES(usd),
            usd_market_cap = VALUES(usd_market_cap),
            usd_24h_vol = VALUES(usd_24h_vol),
            usd_24h_change = VALUES(usd_24h_change),
            last_updated_at = VALUES(last_updated_at)
            """

        cursor.executemany(sql, details_list)
        conn.commit()
        print(f"{cursor.rowcount} record inserted.")
        cursor.close()
        conn.close()
    
def chunk_list(allcoins, batch):
    for i in range(0, len(allcoins), batch):
        yield allcoins[i:i + batch]

    
def batch_retrieve_coins_prices():
    result_coins_id = retrieve_coins_id()
    coin_ids = []
    for coin in result_coins_id:
        coin_ids.append(coin.get("id"))
    
    for batch in chunk_list(coin_ids, 250):
        data = retrieve_coins_prices(batch)
        save_coins_prices(data)
        time.sleep(2)
        
batch_retrieve_coins_prices()
