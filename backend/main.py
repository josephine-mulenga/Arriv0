from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import date
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from openai import OpenAI
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

limiter = Limiter(key_func=get_remote_address)
security = HTTPBearer()

app = FastAPI(
    title="Arriv0 API",
    description="Backend for Arriv0 — From Landing to Staying",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_token(authorization: Optional[str] = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authorized. Please log in.")
    token = authorization.split(" ")[1]
    try:
        user = supabase.auth.get_user(token)
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token. Please log in again.")

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    school: str
    visa_type: str
    year_level: int
    program_end_date: str

    @validator('password')
    def password_must_be_strong(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

    @validator('year_level')
    def year_level_must_be_valid(cls, v):
        if v not in [1, 2, 3, 4]:
            raise ValueError('Year level must be 1, 2, 3, or 4')
        return v

    @validator('visa_type')
    def visa_type_must_be_valid(cls, v):
        if v not in ['F1', 'J1', 'Other']:
            raise ValueError('Visa type must be F1, J1, or Other')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@app.get("/")
def home():
    return {"message": "Arriv0 backend is running"}

@app.post("/signup")
@limiter.limit("5/minute")
def signup(request: Request, data: SignupRequest):
    try:
        response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password
        })

        auth_user_id = response.user.id

        supabase.table("users").insert({
            "id": auth_user_id,
            "name": data.name,
            "school": data.school,
            "visa_type": data.visa_type,
            "year_level": data.year_level,
            "program_end_date": data.program_end_date
        }).execute()

        return {"message": f"Account created successfully. Welcome to Arriv0, {data.name}."}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
@limiter.limit("10/minute")
def login(request: Request, data: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })

        return {
            "message": "Login successful",
            "access_token": response.session.access_token,
            "user_id": response.user.id
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

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

@app.get("/user/{user_id}")
@limiter.limit("30/minute")
def get_user_profile(request: Request, user_id: str, authorization: Optional[str] = Header(None)):
    verify_token(authorization)
    try:
        response = supabase.table("users").select("*").eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/timeline/{year_level}")
@limiter.limit("30/minute")
def get_timeline(request: Request, year_level: int, authorization: Optional[str] = Header(None)):
    verify_token(authorization)
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
@limiter.limit("30/minute")
def get_status(request: Request, program_end_date: str, year_level: int, authorization: Optional[str] = Header(None)):
    verify_token(authorization)
    today = date.today()
    end_date = date.fromisoformat(program_end_date)

    opt_window_opens = (end_date - today).days - 90

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

@app.get("/news")
@limiter.limit("30/minute")
def get_news(request: Request, authorization: Optional[str] = Header(None)):
    verify_token(authorization)
    news = [
        {
            "title": "USCIS OPT processing times now 3 to 4 months",
            "body": "New data shows average processing has increased. Submit your application on the first day your window opens to avoid gaps in work authorization.",
            "affects_you": True,
            "tag": "Affects you directly",
            "link": "https://www.uscis.gov/tools/processing-times"
        },
        {
            "title": "STEM OPT extension rules remain unchanged",
            "body": "Computer Science and Cybersecurity both qualify. You are eligible for 24 additional months of work authorization after standard OPT.",
            "affects_you": True,
            "tag": "Affects you directly",
            "link": "https://www.ice.gov/sevis/stemlist"
        },
        {
            "title": "New social media screening for visa renewals",
            "body": "USCIS now reviews public social media accounts during F1 visa processing. Review your public profiles before any upcoming renewal.",
            "affects_you": False,
            "tag": "General F1 news",
            "link": None
        },
        {
            "title": "OPT application fee increased to $520",
            "body": "The filing fee for Form I-765 increased effective January 2026. Budget accordingly before your application window opens.",
            "affects_you": True,
            "tag": "Affects you directly",
            "link": "https://www.uscis.gov/i-765"
        }
    ]
    return {"news": news, "updated": "August 9 2026"}

@app.get("/milestones/{year_level}")
@limiter.limit("30/minute")
def get_milestones(request: Request, year_level: int, authorization: Optional[str] = Header(None)):
    verify_token(authorization)
    all_milestones = [
        {
            "id": 1,
            "icon": "🛬",
            "title": "Arrived and reported to DSO",
            "description": "Your F1 journey officially started. SEVIS record active.",
            "status": "done" if year_level >= 1 else "locked"
        },
        {
            "id": 2,
            "icon": "🏦",
            "title": "Opened a US bank account",
            "description": "You can now receive payments and build credit history.",
            "status": "done" if year_level >= 1 else "locked"
        },
        {
            "id": 3,
            "icon": "💼",
            "title": "First CPT internship authorized",
            "description": "You gained real US work experience. This goes on your resume.",
            "status": "done" if year_level >= 2 else "next" if year_level == 2 else "locked"
        },
        {
            "id": 4,
            "icon": "📋",
            "title": "DSO OPT recommendation received",
            "description": "Your DSO has approved your OPT application request.",
            "status": "done" if year_level >= 4 else "next" if year_level == 3 else "locked"
        },
        {
            "id": 5,
            "icon": "📄",
            "title": "Form I-765 submitted",
            "description": "Your OPT application is in USCIS hands.",
            "status": "next" if year_level == 4 else "locked"
        },
        {
            "id": 6,
            "icon": "💳",
            "title": "EAD card received",
            "description": "Your Employment Authorization Document arrived by mail.",
            "status": "locked"
        },
        {
            "id": 7,
            "icon": "🎯",
            "title": "First OPT job offer accepted",
            "description": "The moment everything you worked for becomes real.",
            "status": "locked"
        },
        {
            "id": 8,
            "icon": "🚀",
            "title": "STEM OPT extension approved",
            "description": "24 more months of work authorization secured.",
            "status": "locked"
        }
    ]

    completed = len([m for m in all_milestones if m["status"] == "done"])
    total = len(all_milestones)

    return {
        "milestones": all_milestones,
        "completed": completed,
        "total": total,
        "percentage": round((completed / total) * 100)
    }

@app.get("/ai-status")
@limiter.limit("10/minute")
def get_ai_status(request: Request, name: str, school: str, year_level: int, program_end_date: str, authorization: Optional[str] = Header(None)):
    verify_token(authorization)

    today = date.today()
    end_date = date.fromisoformat(program_end_date)
    days_until_end = (end_date - today).days
    opt_window_opens = days_until_end - 90
    day_of_week = today.strftime("%A")
    week_number = today.isocalendar()[1]

    year_names = {1: "Freshman", 2: "Sophomore", 3: "Junior", 4: "Senior"}
    year_name = year_names.get(year_level, "Student")

    prompt = f"""You are Arriv0, a friendly and knowledgeable AI advisor for international students on F1 visas in the United States.

A student has opened the app this morning. Here is their profile:
- Name: {name}
- School: {school}
- Year: {year_name}
- Program end date: {program_end_date}
- Days until program ends: {days_until_end}
- Days until OPT window opens: {opt_window_opens}
- Today is: {day_of_week}
- Week number of the year: {week_number}

Write a short warm personalized morning message. Vary the tone and focus based on the day:
- Monday: motivational and goal setting for the week ahead
- Tuesday or Wednesday: check in on progress and keep momentum
- Thursday: push toward finishing the week strong
- Friday: celebrate the week and wind down positively
- Saturday or Sunday: lighter more personal tone, rest and reflect

Also vary based on urgency:
- More than 180 days until OPT: focus on building skills, networking, and finding internships
- 90 to 180 days: start researching employers and preparing documents
- 30 to 90 days: action oriented with specific next steps
- Less than 30 days: urgent and very specific action needed today

Rules:
- Address them by first name
- 3 to 4 sentences maximum
- Sound like a trusted friend who knows their situation deeply
- Never start with Good morning every time — vary the opening
- Do not use bullet points
- Plain conversational English only"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are Arriv0, a friendly AI advisor for international F1 students in the US. Every message you write should feel genuinely different from the last."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.9
        )

        message = response.choices[0].message.content

        return {
            "ai_message": message,
            "days_until_opt": opt_window_opens,
            "day": day_of_week,
            "powered_by": "GPT-4o mini"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@app.post("/save-token")
@limiter.limit("10/minute")
def save_push_token(request: Request, user_id: str, push_token: str, authorization: Optional[str] = Header(None)):
    verify_token(authorization)
    try:
        supabase.table("users").update({
            "push_token": push_token
        }).eq("id", user_id).execute()

        return {"message": "Push token saved successfully"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))