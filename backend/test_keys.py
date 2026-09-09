import base64
import requests

def decode_jwt(token):
    try:
        parts = token.split(".")
        payload = parts[1]
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += "=" * padding
        decoded = base64.b64decode(payload).decode("utf-8")
        return decoded
    except Exception as e:
        return str(e)

r = requests.get("https://arriv0-production.up.railway.app/debug-keys")
print(r.text)