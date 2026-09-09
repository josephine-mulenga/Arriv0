import requests

r = requests.post("https://arriv0-production.up.railway.app/login", json={
    "email": "prince@arriv0test.com",
    "password": "Test1234!"
})
token = r.json().get("access_token")

r2 = requests.get("https://arriv0-production.up.railway.app/news",
    headers={"authorization": "Bearer " + token}
)
print("News status:", r2.status_code)
print(r2.json().get("total"))

r3 = requests.get("https://arriv0-production.up.railway.app/documents",
    headers={"authorization": "Bearer " + token}
)
print("Documents status:", r3.status_code)
print(r3.text[:200])