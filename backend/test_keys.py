import requests
r = requests.get("https://arriv0-production.up.railway.app/debug-role")
print(r.json())
r2 = requests.get("https://arriv0-production.up.railway.app/health")
print(r2.json())