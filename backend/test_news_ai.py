import requests

BASE_URL = "http://127.0.0.1:8000"

TEST_EMAIL = "prince2@arriv0test.com"
TEST_PASSWORD = "Test1234!"

login_response = requests.post(f"{BASE_URL}/login", json={
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD
})
print(f"Login response: {login_response.json()}")
token = login_response.json().get("access_token")

if token:
    response = requests.post(f"{BASE_URL}/chat",
        headers={"authorization": f"Bearer {token}"},
        json={"question": "What should I be focused on right now given where I am in my program?"}
    )
    print(f"\nTest 1:\n{response.json().get('answer', response.json().get('detail'))}")

    response2 = requests.post(f"{BASE_URL}/chat",
        headers={"authorization": f"Bearer {token}"},
        json={"question": "Do I need a social security number and a bank account?"}
    )
    print(f"\nTest 2:\n{response2.json().get('answer', response2.json().get('detail'))}")