import requests
import sys

def exchange_token(client_id, client_secret, grant_code):
    url = "https://accounts.zoho.in/oauth/v2/token"
    
    payload = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": grant_code
    }
    
    print(f"Sending request to {url}...")
    response = requests.post(url, data=payload)
    
    if response.status_code == 200:
        data = response.json()
        print("\n[SUCCESS] Here are your tokens:\n")
        print("==================================================")
        print(f"REFRESH_TOKEN (Save this! It lasts forever): \n{data.get('refresh_token')}\n")
        print(f"ACCESS_TOKEN (Lasts 1 hour): \n{data.get('access_token')}\n")
        print("==================================================")
        print("\nNext Step: Paste these into your .env.standalone file as ZOHO_REFRESH_TOKEN and ZOHO_ACCESS_TOKEN.")
    else:
        print("\n[ERROR]")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        print("\nIf you see 'invalid_code', the grant code expired (it only lasts 3 minutes).")
        print("Go back to the Self Client, generate a NEW code, and run this script immediately.")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python exchange_zoho_token.py <CLIENT_ID> <CLIENT_SECRET> <GRANT_CODE>")
        print("Example: python exchange_zoho_token.py 1000.XXX 3bed33... 1000.YYY.ZZZ")
        sys.exit(1)
        
    client_id = sys.argv[1]
    client_secret = sys.argv[2]
    grant_code = sys.argv[3]
    
    exchange_token(client_id, client_secret, grant_code)
