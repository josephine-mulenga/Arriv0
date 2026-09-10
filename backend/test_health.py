import requests
r = requests.get("https://arriv0-production.up.railway.app/debug-db")
print(r.json())