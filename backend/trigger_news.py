import requests

r = requests.post("https://arriv0-production.up.railway.app/login", json={
    "email": "prince@arriv0test.com",
    "password": "Test1234!"
})
token = r.json().get("access_token")
print("Token obtained")

r2 = requests.post("https://arriv0-production.up.railway.app/fetch-news",
    headers={"authorization": "Bearer " + token}
)
print(r2.json())