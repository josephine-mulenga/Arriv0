from fastapi import FastAPI
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Arriv0 backend is running"}

@app.post("/onboarding")
def save_user(name: str, school: str, visa_type: str, year_level: str, program_end_date: str):
    data = supabase.table("users").insert({
        "name": name,
        "school": school,
        "visa_type": visa_type,
        "year_level": year_level,
        "program_end_date": program_end_date
    }).execute()
    return {"message": f"Welcome to Arriv0, {name}. Your profile has been saved."}