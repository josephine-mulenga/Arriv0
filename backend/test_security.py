import requests

BASE_URL = "http://127.0.0.1:8000"

def login(email, password):
    response = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
    data = response.json()
    return data.get("access_token"), data.get("user_id")

def test_login():
    """Test 1 — Login works with correct credentials and fails with wrong ones"""
    print("\nTest 1 — Login")

    token, user_id = login("prince@arriv0test.com", "Test1234!")
    assert token is not None, "Login should return a token"
    assert user_id is not None, "Login should return a user_id"
    print("  PASS — valid credentials return token and user_id")

    response = requests.post(f"{BASE_URL}/login", json={
        "email": "prince@arriv0test.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401, "Wrong password should return 401"
    print("  PASS — wrong password returns 401")

def test_cross_user_access():
    """Test 2 — User A cannot access User B's profile"""
    print("\nTest 2 — Cross-user access")

    token_a, user_id_a = login("prince@arriv0test.com", "Test1234!")
    assert token_a, "User A login failed"

    fake_user_id = "00000000-0000-0000-0000-000000000000"
    response = requests.get(
        f"{BASE_URL}/user/{fake_user_id}",
        headers={"authorization": f"Bearer {token_a}"}
    )
    assert response.status_code == 403, f"Should return 403 but got {response.status_code}"
    print("  PASS — User A cannot access a different user's profile")

    response = requests.get(
        f"{BASE_URL}/user/{user_id_a}",
        headers={"authorization": f"Bearer {token_a}"}
    )
    assert response.status_code == 200, "User should be able to access their own profile"
    print("  PASS — User A can access their own profile")

def test_unauthenticated_access():
    """Test 3 — Protected endpoints reject requests without a token"""
    print("\nTest 3 — Unauthenticated access")

    protected_endpoints = [
        f"{BASE_URL}/news",
        f"{BASE_URL}/timeline",
        f"{BASE_URL}/milestones",
        f"{BASE_URL}/user/any-id",
    ]

    for endpoint in protected_endpoints:
        response = requests.get(endpoint)
        assert response.status_code == 401, f"{endpoint} should return 401 without token but got {response.status_code}"
        print(f"  PASS — {endpoint.split('/')[-1]} returns 401 without token")

if __name__ == "__main__":
    print("Running Arriv0 security tests...")
    print("Make sure the server is running at http://127.0.0.1:8000")

    try:
        test_login()
        test_cross_user_access()
        test_unauthenticated_access()
        print("\nAll tests passed.")
    except AssertionError as e:
        print(f"\nTEST FAILED: {e}")
    except Exception as e:
        print(f"\nERROR: {e}")