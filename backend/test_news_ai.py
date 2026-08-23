import requests

BASE_URL = "http://127.0.0.1:8000"

login_response = requests.post(f"{BASE_URL}/login", json={
    "email": "prince@arriv0test.com",
    "password": "Test1234!"
})
token = login_response.json()["access_token"]
print("Login successful")

response = requests.post(f"{BASE_URL}/chat",
    headers={"authorization": f"Bearer {token}"},
    json={"question": "What are the latest immigration updates I should know about as an F1 student?"}
)

print(f"\nStatus: {response.status_code}")
print(f"\nFull response:\n{response.json()}")