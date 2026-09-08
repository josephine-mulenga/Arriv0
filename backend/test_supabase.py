
import os

from supabase import create_client

url = "https://rbhupvfnxxcrezxobjbz.supabase.co"

key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaHVwdmZueHhjcmV6eG9iamJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgzOTE4NiwiZXhwIjoyMTAxNDE1MTg2fQ.K6ia_bwy7Sbo56CaD72EIBOXF1ZUtlMTqE--UZAYrmU"

client = create_client(url, key)

result = client.table("users").select("id").limit(1).execute()

print("Connected successfully")

print(result.data)
