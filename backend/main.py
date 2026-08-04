from fastapi import FastAPI
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import date
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

@app.get("/timeline/{year_level}")
def get_timeline(year_level: int):
    timelines = {
        1: {
            "year": "Freshman",
            "status": "You are settling in. Focus on your first 30 days.",
            "steps": [
                {"task": "Report to DSO within 10 days of arrival", "done": True},
                {"task": "Get I-20 signed by DSO", "done": True},
                {"task": "Apply for Social Security Number", "done": False, "link": "https://www.ssa.gov/ssnumber/"},
                {"task": "Open a bank account", "done": False, "link": "https://www.chase.com/personal/checking/college-checking"},
                {"task": "Understand your on-campus work rights", "done": False, "link": "https://studyinthestates.dhs.gov/students/work"}
            ]
        },
        2: {
            "year": "Sophomore",
            "status": "You are eligible for CPT. Use it wisely to protect your OPT.",
            "steps": [
                {"task": "Completed one full academic year", "done": True},
                {"task": "Find a CPT eligible internship", "done": False, "link": "https://www.handshake.com"},
                {"task": "Get CPT authorization from DSO", "done": False, "link": "https://studyinthestates.dhs.gov/students/work/curricular-practical-training"},
                {"task": "Track CPT hours — stay under 12 months full time", "done": False}
            ]
        },
        3: {
            "year": "Junior",
            "status": "OPT is 14 months away. Start preparing now.",
            "steps": [
                {"task": "Understand CPT vs OPT differences", "done": True},
                {"task": "Create your USCIS account now", "done": False, "link": "https://myaccount.uscis.gov"},
                {"task": "Check if your major qualifies for STEM OPT", "done": False, "link": "https://www.ice.gov/sevis/stemlist"},
                {"task": "Start networking with OPT friendly employers", "done": False, "link": "https://www.linkedin.com/jobs"}
            ]
        },
        4: {
            "year": "Senior",
            "status": "Your OPT window is approaching. Submit as early as possible.",
            "steps": [
                {"task": "Confirm program end date with DSO", "done": True},
                {"task": "Request OPT recommendation from DSO", "done": True},
                {"task": "Complete Form I-765 on USCIS", "done": False, "link": "https://www.uscis.gov/i-765"},
                {"task": "Pay $520 USCIS filing fee", "done": False, "link": "https://pay.gov/public/home"},
                {"task": "Submit and track your case", "done": False, "link": "https://egov.uscis.gov/casestatus/landing.do"}
            ]
        }
    }

    if year_level not in timelines:
        return {"error": "Invalid year level. Please enter 1, 2, 3, or 4."}

    return timelines[year_level]

@app.get("/status")
def get_status(program_end_date: str, year_level: int):
    today = date.today()
    end_date = date.fromisoformat(program_end_date)

    opt_window_opens = (end_date - today).days - 90
    days_until_deadline = (end_date - today).days

    if year_level < 4:
        return {
            "status": "on_track",
            "color": "green",
            "message": f"You are on track. Your OPT window opens in {opt_window_opens} days.",
            "action_needed": False
        }
    elif opt_window_opens > 90:
        return {
            "status": "on_track",
            "color": "green",
            "message": f"You are on track. Your OPT window opens in {opt_window_opens} days. No action needed today.",
            "action_needed": False
        }
    elif opt_window_opens > 30:
        return {
            "status": "prepare",
            "color": "yellow",
            "message": f"Your OPT window opens in {opt_window_opens} days. Start preparing your documents now.",
            "action_needed": True,
            "action": "Review your OPT checklist"
        }
    elif opt_window_opens > 0:
        return {
            "status": "urgent",
            "color": "red",
            "message": f"Urgent. Your OPT window is open and closes in {opt_window_opens} days. Apply now.",
            "action_needed": True,
            "action": "Start Form I-765 immediately",
            "link": "https://www.uscis.gov/i-765"
        }
    else:
        return {
            "status": "critical",
            "color": "red",
            "message": "Your OPT window may have closed. Contact your DSO immediately.",
            "action_needed": True,
            "action": "Contact DSO now"
        }