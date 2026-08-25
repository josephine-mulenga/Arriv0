import requests

BASE_URL = "http://127.0.0.1:8000"

TEST_EMAIL = "prince2@arriv0test.com"
TEST_PASSWORD = "Test1234!"

login_response = requests.post(f"{BASE_URL}/login", json={
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD
})
token = login_response.json().get("access_token")
print("Login successful")

# Test 1 — chat with memory
print("\nTest 1 — First message:")
r1 = requests.post(f"{BASE_URL}/chat",
    headers={"authorization": f"Bearer {token}"},
    json={"question": "What should I know about CPT as a Computer Science student?"}
)
print(r1.json().get("answer", r1.json().get("detail")))

# Test 2 — follow up question to test memory
print("\nTest 2 — Follow up (AI should remember CPT context):")
r2 = requests.post(f"{BASE_URL}/chat",
    headers={"authorization": f"Bearer {token}"},
    json={"question": "How many months can I use before I lose OPT eligibility?"}
)
print(r2.json().get("answer", r2.json().get("detail")))

# Test 3 — fetch chat history
print("\nTest 3 — Chat history:")
r3 = requests.get(f"{BASE_URL}/chat/history",
    headers={"authorization": f"Bearer {token}"}
)
data = r3.json()
print(f"Messages saved: {data.get('count')}")
for msg in data.get("messages", []):
    print(f"  [{msg['role']}]: {msg['content'][:80]}...")

# Test 4 — clear history
print("\nTest 4 — Clear chat history:")
r4 = requests.delete(f"{BASE_URL}/chat/history",
    headers={"authorization": f"Bearer {token}"}
)
print(r4.json().get("message"))

# Test 5 — confirm history is empty
print("\nTest 5 — Confirm history cleared:")
r5 = requests.get(f"{BASE_URL}/chat/history",
    headers={"authorization": f"Bearer {token}"}
)
print(f"Messages after clear: {r5.json().get('count')}")