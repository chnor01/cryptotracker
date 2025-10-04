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
    url = "https://api.coingecko.com/api/v3/coins/markets"
    headers = {"x-cg-demo-api-key" : COINGECKO_API_KEY}
    params = {"vs_currency": "usd", "ids": ",".join(coin_ids), "per_page": 250, "precision": 3}
    try:
        response = requests.get(url, headers=headers, params=params)
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        return []


def save_coins_prices(data, download_imgs=False):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    SAVE_DIR = "backend/coin_icons"
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    def parse_iso_datetime(iso_str):
        if iso_str:
            return datetime.fromisoformat(iso_str.replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M:%S")
        return None
    
    def download_image(url, filepath):
        if not os.path.exists(filepath):
            try:
                resp = requests.get(url)
                resp.raise_for_status()
                with open(filepath, "wb") as f:
                    f.write(resp.content)
                print(f"Saved {filepath}")
            except Exception as e:
                print(f"Failed to download {url}: {e}")

    cursor.execute("""
            CREATE TABLE IF NOT EXISTS prices (
            id VARCHAR(255) PRIMARY KEY,
            current_price DECIMAL(16,3),
            market_cap BIGINT,
            market_cap_rank INT,
            fully_diluted_valuation BIGINT,
            total_volume BIGINT,
            high_24h DECIMAL(16,3),
            low_24h DECIMAL(16,3),
            price_change_24h DECIMAL(16,3),
            price_change_percentage_24h DECIMAL(16, 2),
            market_cap_change_24h BIGINT,
            market_cap_change_percentage_24h DECIMAL(16, 2),
            circulating_supply BIGINT,
            total_supply BIGINT,
            max_supply BIGINT,
            ath DECIMAL(22,3),
            ath_date DATETIME,
            atl DECIMAL(16,3),
            atl_date DATETIME,
            last_updated_at DATETIME,
            image_path VARCHAR(255)
            );
        """)
    
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    details_list = []
    for coin in data:
        coin_id = coin.get("id")
        current_price = coin.get("current_price")
        market_cap = coin.get("market_cap")
        total_volume = coin.get("total_volume")
        market_cap_rank = coin.get("market_cap_rank")
        fully_diluted_valuation = coin.get("fully_diluted_valuation")
        high_24h = coin.get("high_24h")
        low_24h = coin.get("low_24h")
        price_change_24h = coin.get("price_change_24h")
        price_change_percentage_24h = coin.get("price_change_percentage_24h") or 0.0
        market_cap_change_24h = coin.get("market_cap_change_24h")
        market_cap_change_percentage_24h = coin.get("market_cap_change_percentage_24h") or 0.0
        circulating_supply = coin.get("circulating_supply")
        total_supply = coin.get("total_supply")
        max_supply = coin.get("max_supply")
        ath = coin.get("ath")
        ath_date = parse_iso_datetime(coin.get("ath_date"))
        atl = coin.get("atl")
        atl_date = parse_iso_datetime(coin.get("atl_date"))
        last_updated_at = parse_iso_datetime(coin.get("last_updated"))
        url = coin.get("image")
        
        if not current_price or not market_cap or not last_updated_at:
            continue
        
        cleaned_timestamp = datetime.strptime(last_updated_at, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        if cleaned_timestamp < one_hour_ago:
            continue

        filename = f"{coin_id}.png"
        filepath = os.path.join(SAVE_DIR, filename)
        relative_path = f"{SAVE_DIR}/{filename}"
        if url and download_imgs:
            download_image(url, filepath)
            
        details_list.append((
        coin_id, current_price, market_cap, market_cap_rank,
        fully_diluted_valuation, total_volume, high_24h, low_24h,
        price_change_24h, price_change_percentage_24h,
        market_cap_change_24h, market_cap_change_percentage_24h,
        circulating_supply, total_supply, max_supply,
        ath, ath_date, atl, atl_date, last_updated_at, relative_path
        ))


    if details_list:
        sql = """
            INSERT INTO prices (id, current_price, market_cap, market_cap_rank,
            fully_diluted_valuation, total_volume, high_24h, low_24h,
            price_change_24h, price_change_percentage_24h,
            market_cap_change_24h, market_cap_change_percentage_24h,
            circulating_supply, total_supply, max_supply,
            ath, ath_date, atl, atl_date, last_updated_at, image_path) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            current_price = VALUES(current_price),
            market_cap = VALUES(market_cap),
            market_cap_rank = VALUES(market_cap_rank),
            fully_diluted_valuation = VALUES(fully_diluted_valuation),
            total_volume = VALUES(total_volume),
            high_24h = VALUES(high_24h),
            low_24h = VALUES(low_24h),
            price_change_24h = VALUES(price_change_24h),
            price_change_percentage_24h = VALUES(price_change_percentage_24h),
            market_cap_change_24h = VALUES(market_cap_change_24h),
            market_cap_change_percentage_24h = VALUES(market_cap_change_percentage_24h),
            circulating_supply = VALUES(circulating_supply),
            total_supply = VALUES(total_supply),
            max_supply = VALUES(max_supply),
            ath = VALUES(ath),
            ath_date = VALUES(ath_date),
            atl = VALUES(atl),
            atl_date = VALUES(atl_date),
            last_updated_at = VALUES(last_updated_at),
            image_path = VALUES(image_path)
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
    
def batch_retrieve_save_coins_prices():
    result_coins_id = retrieve_coins_id()
    coin_ids = []
    for coin in result_coins_id:
        coin_ids.append(coin.get("id"))
    
    for batch in chunk_list(coin_ids, 250):
        data = retrieve_coins_prices(batch)
        save_coins_prices(data, download_imgs=False)
        time.sleep(2)
        

def retrieve_top_market_cap_coins():   
    url = "https://api.coingecko.com/api/v3/coins/markets"
    headers = {"x-cg-demo-api-key" : COINGECKO_API_KEY}
    params = {"vs_currency": "usd", "order": "market_cap_desc", "per_page": 50}
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

    cursor.execute("""CREATE TABLE IF NOT EXISTS hist (
                coin_id VARCHAR(255) NOT NULL, 
                timestamp DATETIME NOT NULL,
                usd DECIMAL(16,3) NOT NULL, 
                usd_market_cap BIGINT NOT NULL, 
                volume BIGINT NOT NULL,
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
    


def create_users_table():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
            """)
    try:
        conn.commit()
        print("Created users table")
    except Exception as e:
        print(f"Error creating table: {e}")
    finally:
        cursor.close()
        conn.close()
    
    
def create_portfolio_table():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolio (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            coin_id VARCHAR(255) NOT NULL,
            amount DECIMAL(18,8) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            UNIQUE (user_id, coin_id)
            )
    """)
    try:
        conn.commit()
        print("Created portfolio table")
    except Exception as e:
        print(f"Error creating table: {e}")
    finally:
        cursor.close()
        conn.close()


def retrieve_ohlc(coin_id):   
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/ohlc"
    headers = {"x-cg-demo-api-key" : COINGECKO_API_KEY}
    params = {"vs_currency": "usd", "days": 30}
    try:
        response = requests.get(url, headers=headers, params=params)
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        return []
    

def save_ohlc(coin_id, ohlc_data):
    cleaned_data = []
    for entry in ohlc_data:
        timestamp_ms = entry[0]
        timestamp = datetime.fromtimestamp(timestamp_ms/1000, tz=timezone.utc)
        cleaned_data.append((coin_id, timestamp, entry[1], entry[2], entry[3], entry[4])) # append ..., open, high, low, close
        
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
            CREATE TABLE IF NOT EXISTS ohlc (
            coin_id VARCHAR(255) NOT NULL,
            timestamp DATETIME NOT NULL,
            open DECIMAL(18,8) NOT NULL,
            high DECIMAL(18,8) NOT NULL,
            low DECIMAL(18,8) NOT NULL,
            close DECIMAL(18,8) NOT NULL,
            PRIMARY KEY (coin_id, timestamp)
        );
        """)
    
    sql = """
        INSERT INTO ohlc (coin_id, timestamp, open, high, low, close)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        open = VALUES(open),
        high = VALUES(high),
        low = VALUES(low),
        close = VALUES(close)
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
        

def batch_retrieve_save_ohlc():
    res = retrieve_top_market_cap_coins()
    top_marketcap_coins = []
    for coin in res:
        top_marketcap_coins.append(coin.get("id"))
    
    for coin_id in top_marketcap_coins:
        ohlc_data = retrieve_ohlc(coin_id)
        save_ohlc(coin_id, ohlc_data)
        time.sleep(2)



#save_coins_id()
#batch_retrieve_save_coins_prices()
#batch_retrieve_save_hist_prices()
#create_users_table()
#create_portfolio_table()
#batch_retrieve_save_ohlc()