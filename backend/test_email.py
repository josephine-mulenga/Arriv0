import requests

r = requests.post("https://arriv0-production.up.railway.app/resend-confirmation", json={
    "email": "oseibonsu0201@gmail.com"
})
print(r.status_code)
print(r.json())