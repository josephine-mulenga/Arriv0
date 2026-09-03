import requests

r = requests.get(
    "https://newsapi.org/v2/everything",
    params={
        "q": "international student visa USA",
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 5,
        "apiKey": "820e35639ade4ea6a100e3b191d3bf94"
    }
)
data = r.json()
print("Total results:", data.get("totalResults"))
for a in data.get("articles", []):
    print("Title:", a.get("title"))
    print("Date:", a.get("publishedAt"))
    print()