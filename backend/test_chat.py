import requests

BASE_URL = "http://127.0.0.1:8000"

# Login
login_response = requests.post(f"{BASE_URL}/login", json={
    "email": "prince@arriv0test.com",
    "password": "Test1234!"
})
token = login_response.json()["access_token"]
print("Login successful")

# Test 1 — Immigration question
response1 = requests.post(f"{BASE_URL}/chat",
    headers={"authorization": f"Bearer {token}"},
    json={
        "question": "When should I start applying for OPT if my program ends in May 2028?",
        "name": "Prince",
        "school": "Voorhees University",
        "visa_type": "F1",
        "year_level": 2,
        "program_end_date": "2028-05-02"
    }
)
print(f"\nQuestion 1 — Immigration:\n{response1.json()['answer']}")

# Test 2 — General life question
response2 = requests.post(f"{BASE_URL}/chat",
    headers={"authorization": f"Bearer {token}"},
    json={
        "question": "What are some good ways to make friends as an international student?",
        "name": "Prince",
        "school": "Voorhees University",
        "visa_type": "F1",
        "year_level": 2,
        "program_end_date": "2028-05-02"
    }
)
print(f"\nQuestion 2 — General life:\n{response2.json()['answer']}")

# Test 3 — Banking question
response3 = requests.post(f"{BASE_URL}/chat",
    headers={"authorization": f"Bearer {token}"},
    json={
        "question": "How do I open a bank account without a credit history?",
        "name": "Prince",
        "school": "Voorhees University",
        "visa_type": "F1",
        "year_level": 2,
        "program_end_date": "2028-05-02"
    }
)
print(f"\nQuestion 3 — Banking:\n{response3.json()['answer']}")