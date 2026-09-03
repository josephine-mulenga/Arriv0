import requests

r = requests.post("http://127.0.0.1:8000/login", json={
    "email": "prince@arriv0test.com",
    "password": "Test1234!"
})
token = r.json().get("access_token")
print("Token obtained")

r2 = requests.post("http://127.0.0.1:8000/fetch-news",
    headers={"authorization": "Bearer " + token}
)
print(r2.json())