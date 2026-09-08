import requests

r = requests.post("http://127.0.0.1:8000/login", json={
    "email": "prince@arriv0test.com",
    "password": "Test1234!"
})
token = r.json().get("access_token")
user_id = r.json().get("user_id")
print("User ID:", user_id)

r2 = requests.get(f"http://127.0.0.1:8000/user/{user_id}",
    headers={"authorization": "Bearer " + token}
)
print("Status:", r2.status_code)
print("Response:", r2.text)