import requests

BASE_URL = "http://127.0.0.1:8000"

def login(email, password):
    response = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
    data = response.json()
    return data.get("access_token"), data.get("user_id")

def test_login():
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
    print("\nTest 3 — Unauthenticated access")
    protected_endpoints = [
        f"{BASE_URL}/news",
        f"{BASE_URL}/timeline",
        f"{BASE_URL}/milestones",
        f"{BASE_URL}/user/any-id",
        f"{BASE_URL}/documents",
        f"{BASE_URL}/bookmarks",
        f"{BASE_URL}/onboarding-score",
        f"{BASE_URL}/dso-directory",
        f"{BASE_URL}/referral/stats",
        f"{BASE_URL}/chat/history",
        f"{BASE_URL}/status",
        f"{BASE_URL}/ai-status",
    ]
    for endpoint in protected_endpoints:
        response = requests.get(endpoint)
        assert response.status_code == 401, f"{endpoint} should return 401 without token but got {response.status_code}"
        print(f"  PASS — {endpoint.split('/')[-1]} returns 401 without token")

def test_health_check():
    print("\nTest 4 — Health check")
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200, "Health check should return 200"
    data = response.json()
    assert data["status"] == "healthy", "Status should be healthy"
    assert "database" in data["services"], "Should include database status"
    assert "scheduler" in data["services"], "Should include scheduler status"
    print("  PASS — health check returns 200 and healthy status")

def test_documents():
    print("\nTest 5 — Documents")
    token, user_id = login("prince@arriv0test.com", "Test1234!")

    response = requests.get(
        f"{BASE_URL}/documents",
        headers={"authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, f"Documents should return 200 but got {response.status_code}"
    data = response.json()
    assert "documents" in data, "Should return documents list"
    assert "percentage" in data, "Should return percentage"
    print(f"  PASS — documents returns {data['total']} documents at {data['percentage']}% collected")

def test_bookmarks():
    print("\nTest 6 — Bookmarks")
    token, user_id = login("prince@arriv0test.com", "Test1234!")

    response = requests.post(
        f"{BASE_URL}/bookmarks",
        headers={"authorization": f"Bearer {token}"},
        json={
            "news_title": "Test bookmark article",
            "news_body": "This is a test bookmark body",
            "news_tag": "OPT"
        }
    )
    assert response.status_code == 200, f"Bookmark should return 200 but got {response.status_code}"
    print("  PASS — bookmark added successfully")

    response = requests.get(
        f"{BASE_URL}/bookmarks",
        headers={"authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "Get bookmarks should return 200"
    data = response.json()
    assert data["count"] >= 1, "Should have at least 1 bookmark"
    bookmark_id = data["bookmarks"][0]["id"]
    print(f"  PASS — bookmarks fetched, count: {data['count']}")

    response = requests.delete(
        f"{BASE_URL}/bookmarks/{bookmark_id}",
        headers={"authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "Delete bookmark should return 200"
    print("  PASS — bookmark deleted successfully")

def test_onboarding_score():
    print("\nTest 7 — Onboarding score")
    token, user_id = login("prince@arriv0test.com", "Test1234!")

    response = requests.get(
        f"{BASE_URL}/onboarding-score",
        headers={"authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, f"Onboarding score should return 200 but got {response.status_code}"
    data = response.json()
    assert "score" in data, "Should return score"
    assert "level" in data, "Should return level"
    assert "items" in data, "Should return items"
    print(f"  PASS — onboarding score: {data['score']}/100 level: {data['level']}")

def test_referral():
    print("\nTest 8 — Referral system")
    token, user_id = login("prince@arriv0test.com", "Test1234!")

    response = requests.post(
        f"{BASE_URL}/referral/generate",
        headers={"authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, f"Referral generate should return 200 but got {response.status_code}"
    data = response.json()
    assert "referral_code" in data, "Should return referral code"
    print(f"  PASS — referral code generated: {data['referral_code']}")

    response = requests.get(
        f"{BASE_URL}/referral/stats",
        headers={"authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "Referral stats should return 200"
    print("  PASS — referral stats fetched successfully")

if __name__ == "__main__":
    print("Running Arriv0 security tests...")
    print("Make sure the server is running at http://127.0.0.1:8000")

    try:
        test_login()
        test_cross_user_access()
        test_unauthenticated_access()
        test_health_check()
        test_documents()
        test_bookmarks()
        test_onboarding_score()
        test_referral()
        print("\nAll tests passed.")
    except AssertionError as e:
        print(f"\nTEST FAILED: {e}")
    except Exception as e:
        print(f"\nERROR: {e}")