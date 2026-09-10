import requests

r = requests.post("https://arriv0-production.up.railway.app/login", json={
    "email": "prince@arriv0test.com",
    "password": "Test1234!"
})
token = r.json().get("access_token")
user_id = r.json().get("user_id")

r2 = requests.get(f"https://arriv0-production.up.railway.app/user/{user_id}",
    headers={"authorization": "Bearer " + token}
)
print("Status:", r2.status_code)
print(r2.json().get("name"))