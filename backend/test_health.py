import requests

# Test directly with the sb_secret key format
url = "https://rbhupvfnxxcrezxobjbz.supabase.co"
secret = "sb_secret_l74bL•••••••••••••"  # Railway has this value

r = requests.get(
    f"{url}/rest/v1/users?select=id&limit=1",
    headers={
        "apikey": secret,
        "Authorization": f"Bearer {secret}"
    }
)
print("Direct Supabase test:", r.status_code)
print(r.text[:200])