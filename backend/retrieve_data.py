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
    try: 
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        return []

def save_coins_id():
    
    result_coins_id = retrieve_coins_id()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("CREATE DATABASE IF NOT EXISTS crypto_db")
    cursor.execute("CREATE TABLE IF NOT EXISTS coins (id VARCHAR(255) PRIMARY KEY, symbol VARCHAR(255), name VARCHAR(255))")
    
    sql = """
            INSERT INTO coins (id, symbol, name) VALUES (%s, %s, %s) 
            ON DUPLICATE KEY UPDATE id = id
        """
    values_list = [(coin.get("id"), coin.get("symbol"), coin.get("name")) for coin in result_coins_id]

    try:
        cursor.executemany(sql, values_list)
        conn.commit()
        print(f"{cursor.rowcount} record inserted.")
    except Exception as e:
        print(f"Error inserting data: {e}")
    finally:
        cursor.close()
        conn.close()
        
#save_coins_id()

    
def retrieve_coins_prices(coin_ids):   
    url = "https://api.coingecko.com/api/v3/simple/price"
    headers = {"x-cg-demo-api-key" : COINGECKO_API_KEY}
    params = {"vs_currencies": "usd", "ids": ",".join(coin_ids), "include_market_cap": "true", 
              "include_24hr_vol": "true", "include_24hr_change": "true", "include_last_updated_at": "true", "precision": "3"}
    try:
        response = requests.get(url, headers=headers, params=params)
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        return []


def save_coins_prices(data):

    conn = get_db_connection()
    cursor = conn.cursor()

    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prices (id VARCHAR(255) PRIMARY KEY, usd DECIMAL(16,3), usd_market_cap BIGINT, 
    usd_24h_vol BIGINT, usd_24h_change DECIMAL(16,3), last_updated_at DATETIME)""")
    
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
        try:
            cursor.executemany(sql, details_list)
            conn.commit()
            print(f"{cursor.rowcount} record inserted.")
        except Exception as e:
            print(f"Error inserting data: {e}")
        finally:
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
        
#batch_retrieve_coins_prices()

def retrieve_top_market_cap_coins():   
    url = "https://api.coingecko.com/api/v3/coins/markets"
    headers = {"x-cg-demo-api-key" : COINGECKO_API_KEY}
    params = {"vs_currency": "usd", "order": "market_cap_desc", "per_page": 100}
    try:
        response = requests.get(url, headers=headers, params=params)
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        return []
    

def retrieve_historical_prices(coin_id):   
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    headers = {"x-cg-demo-api-key" : COINGECKO_API_KEY}
    params = {"vs_currency": "usd", "days": 365, "interval": "daily"}
    try:
        response = requests.get(url, headers=headers, params=params)
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        return []
    

def save_historical_prices(coin_id, hist_data):
    cleaned_data = []
    for price, market_cap, volume in zip(hist_data["prices"], hist_data["market_caps"], hist_data["total_volumes"]):
        timestamp_ms = price[0]
        timestamp = datetime.fromtimestamp(timestamp_ms/1000, tz=timezone.utc)
        cleaned_data.append((coin_id, timestamp, price[1], market_cap[1], volume[1]))
        
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""CREATE TABLE IF NOT EXISTS hist (id VARCHAR(255), 
                   timestamp DATETIME,
                   usd DECIMAL(16,3), 
                   usd_market_cap BIGINT, 
                   volume BIGINT,
                   PRIMARY KEY (id, timestamp))""")
    
    sql = """
            INSERT INTO hist (id, timestamp, usd, usd_market_cap, volume)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            usd = VALUES(usd),
            usd_market_cap = VALUES(usd_market_cap),
            volume = VALUES(volume);
        """

    try:
        cursor.executemany(sql, cleaned_data)
        conn.commit()
        print(f"{cursor.rowcount} record inserted.")
    except Exception as e:
        print(f"Error inserting data: {e}")
    finally:
        cursor.close()
        conn.close()
        

def batch_retrieve_save_hist_prices():
    res = retrieve_top_market_cap_coins()
    top_marketcap_coins = []
    for coin in res:
        top_marketcap_coins.append(coin.get("id"))
    
    for coin_id in top_marketcap_coins:
        hist_data = retrieve_historical_prices(coin_id)
        save_historical_prices(coin_id, hist_data)
        time.sleep(2)
    
batch_retrieve_save_hist_prices()