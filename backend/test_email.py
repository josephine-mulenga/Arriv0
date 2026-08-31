import requests

r = requests.post("https://arriv0-production.up.railway.app/signup", json={
    "email": "oseibonsu0201@gmail.com",
    "password": "Test1234!",
    "name": "Test User",
    "school": "Voorhees University",
    "visa_type": "F1",
    "program_start_date": "2025-08-01",
    "program_end_date": "2029-05-15"
})
print(r.status_code)
print(r.json())