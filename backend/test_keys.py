import requests
r = requests.get("https://arriv0-production.up.railway.app/debug-role")
print(r.json())