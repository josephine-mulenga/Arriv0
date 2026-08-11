from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from starlette.middleware.base import BaseHTTPMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from openai import OpenAI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz
import os
import logging
import httpx
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY, timeout=30.0)

limiter = Limiter(key_func=get_remote_address)
security = HTTPBearer()
scheduler = AsyncIOScheduler()

app = FastAPI(
    title="Arriv0 API",
    description="Backend for Arriv0 — From Landing to Staying",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class CorrelationIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response

app.add_middleware(CorrelationIDMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://arriv0.com",
        "https://www.arriv0.com",
        "https://arriv0-production.up.railway.app",
        "http://localhost:8081",
        "http://localhost:19006",
        "exp://localhost:19000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMMIGRATION_KNOWLEDGE = """
OFFICIAL F1 VISA AND IMMIGRATION RULES (Source: USCIS.gov and StudyInTheStates.dhs.gov)

OPT (Optional Practical Training):
- Students may apply for OPT up to 90 days before their program end date
- The OPT application window is 30 days from program end date — missing it means losing OPT eligibility
- USCIS processing time is currently 3 to 4 months — apply as early as possible
- The filing fee for Form I-765 is $520 as of 2026
- Students have 90 days of unemployment allowed during OPT — exceeding this ends their status
- STEM OPT extension gives qualifying majors 24 additional months of work authorization
- Computer Science and Cybersecurity qualify for STEM OPT extension

CPT (Curricular Practical Training):
- CPT requires completion of one full academic year before eligibility
- CPT must be directly related to the student's major field of study
- Using 12 or more months of full time CPT eliminates OPT eligibility permanently
- Part time CPT (20 hours or less per week) does not count toward the 12 month limit
- CPT authorization must be obtained from the DSO before starting work

F1 Status Rules:
- Students must maintain full time enrollment every semester
- Students must report to their DSO within 10 days of arriving in the US
- Students may work up to 20 hours per week on campus during the academic year
- The grace period after program end is 60 days — students must leave or change status
- Social media accounts may be reviewed during visa processing — keep public profiles appropriate
- SEVIS record must remain active — dropping below full time requires DSO approval

Banking and Credit:
- Most banks require a Social Security Number and proof of address
- Chase College Checking and Bank of America Advantage SafeBalance accept international students
- Secured credit cards are a good way to start building US credit history
- Discover and Capital One offer student cards that work well for international students

Work Authorization:
- On-campus work is allowed up to 20 hours per week without any additional authorization
- Off-campus work requires CPT or OPT authorization — working without authorization is a serious violation
- Volunteering for a for-profit company without authorization can be considered unauthorized employment
- Employers do not need to file an H-1B for OPT students — OPT is the student's own authorization

Housing:
- Most landlords require credit history, references, and proof of income
- International students can offer a larger security deposit or a co-signer to compensate for no credit history
- University housing and student housing communities are often the easiest options for new arrivals

Important Contacts:
- USCIS general information: uscis.gov
- Study in the States: studyinthestates.dhs.gov
- SEVIS: ice.gov/sevis
- OPT processing times: uscis.gov/tools/processing-times
- Form I-765: uscis.gov/i-765
"""

def log_security_event(event_type: str, details: str, correlation_id: str = None):
    """Log structured security events"""
    logger.info(f"SECURITY_EVENT type={event_type} details={details} correlation_id={correlation_id}")

def verify_token(authorization: Optional[str] = None, correlation_id: str = None):
    if not authorization or not authorization.startswith("Bearer "):
        log_security_event("UNAUTHORIZED", "Missing or malformed token", correlation_id)
        raise HTTPException(status_code=401, detail="Not authorized. Please log in.")
    token = authorization.split(" ")[1]
    try:
        user = supabase.auth.get_user(token)
        return user
    except Exception:
        log_security_event("INVALID_TOKEN", "Invalid or expired token", correlation_id)
        raise HTTPException(status_code=401, detail="Invalid or expired token. Please log in again.")

async def generate_morning_message(student: dict) -> str:
    today = date.today()
    program_end = date.fromisoformat(str(student.get("program_end_date", "2028-01-01"))[:10])
    days_until_end = (program_end - today).days
    opt_window_opens = days_until_end - 90
    day_of_week = today.strftime("%A")
    week_number = today.isocalendar()[1]
    year_names = {1: "Freshman", 2: "Sophomore", 3: "Junior", 4: "Senior"}
    year_name = year_names.get(student.get("year_level", 1), "Student")

    prompt = f"""You are Arriv0, a knowledgeable and friendly AI companion for international students on F1 visas in the United States.

Use this official immigration knowledge to ground your response:
{IMMIGRATION_KNOWLEDGE}

Student profile:
- Name: {student.get('name')}
- School: {student.get('school')}
- Year: {year_name}
- Days until program ends: {days_until_end}
- Days until OPT window opens: {opt_window_opens}
- Today is: {day_of_week}
- Week number: {week_number}

Write a short warm personalized morning notification message under 100 words. Vary tone by day and urgency. Address by first name. No bullet points. Plain English."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are Arriv0, a friendly AI companion for F1 students. Write concise push notification messages under 100 words."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=120,
            temperature=0.9
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Failed to generate morning message: {e}")
        return f"Good morning {student.get('name')}! Check your Arriv0 app for today's immigration update."

async def send_push_notification(push_token: str, title: str, body: str):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json={"to": push_token, "title": title, "body": body, "sound": "default"},
                headers={"Content-Type": "application/json"}
            )
            return response.status_code == 200
    except httpx.TimeoutException:
        logger.error("Push notification timed out after 5 seconds")
        return False
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
        return False

async def send_morning_notifications():
    now_utc = datetime.now(pytz.utc)
    logger.info(f"Running morning notification check at {now_utc.strftime('%H:%M')} UTC")
    try:
        users = supabase.table("users").select("*").not_.is_("push_token", "null").execute()
        if not users.data:
            return
        for user in users.data:
            try:
                user_timezone = user.get("timezone", "America/New_York")
                notification_time = user.get("notification_time", "08:00")
                tz = pytz.timezone(user_timezone)
                user_now = now_utc.astimezone(tz)
                user_current_time = user_now.strftime("%H:%M")
                if user_current_time == notification_time:
                    message = await generate_morning_message(user)
                    await send_push_notification(user["push_token"], "Good morning from Arriv0", message)
                    log_security_event("NOTIFICATION_SENT", f"Morning notification sent to user at {notification_time} {user_timezone}")
            except Exception as e:
                logger.error(f"Failed to process notification for {user.get('name')}: {e}")
    except Exception as e:
        logger.error(f"Morning notification job failed: {e}")

async def fetch_uscis_news():
    try:
        news_items = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": "USCIS OR OPT OR F1 visa OR immigration student",
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": 5,
                    "apiKey": NEWS_API_KEY
                },
                headers={"User-Agent": "Arriv0/1.0"}
            )
            if response.status_code == 200:
                articles = response.json().get("articles", [])
                for article in articles:
                    news_items.append({
                        "title": article.get("title", ""),
                        "link": article.get("url", ""),
                        "summary": article.get("description", "")[:500] or article.get("content", "")[:500]
                    })
                logger.info(f"Fetched {len(news_items)} news items from NewsAPI")
            else:
                logger.error(f"NewsAPI error: {response.status_code}")
        return news_items[:5]
    except httpx.TimeoutException:
        logger.error("NewsAPI request timed out after 10 seconds")
        return []
    except Exception as e:
        logger.error(f"Failed to fetch news: {e}")
        return []

async def summarize_news_item(title: str, summary: str, link: str):
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You summarize immigration news in plain language for international students. Be concise and clear."},
                {"role": "user", "content": f"Summarize this immigration news in 2 sentences of plain English for an F1 student:\n\nTitle: {title}\nContent: {summary}"}
            ],
            max_tokens=100,
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Failed to summarize news: {e}")
        return summary[:200]

async def personalize_news_for_student(news_title: str, news_body: str, news_link: str, student: dict):
    today = date.today()
    program_end = date.fromisoformat(str(student.get("program_end_date", "2028-01-01"))[:10])
    days_until_end = (program_end - today).days
    opt_window = days_until_end - 90
    year_names = {1: "Freshman", 2: "Sophomore", 3: "Junior", 4: "Senior"}
    year_name = year_names.get(student.get("year_level", 1), "Student")

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You determine how immigration news affects a specific F1 student and write a personalized push notification under 100 words."},
                {"role": "user", "content": f"""
News: {news_title}
Summary: {news_body}
Official link: {news_link}

Student profile:
- Name: {student.get('name')}
- School: {student.get('school')}
- Year: {year_name}
- Days until program ends: {days_until_end}
- Days until OPT window opens: {opt_window}

Does this news affect this student? If yes write a personalized push notification under 100 words. If not reply with just SKIP.
"""}
            ],
            max_tokens=150,
            temperature=0.5
        )
        result = response.choices[0].message.content.strip()
        if result == "SKIP":
            return None
        return result
    except Exception as e:
        logger.error(f"Failed to personalize news: {e}")
        return None

async def process_and_notify():
    logger.info("Starting news fetch and notification job")
    news_items = await fetch_uscis_news()
    if not news_items:
        logger.info("No news items fetched")
        return

    summarized_news = []
    for item in news_items:
        summary = await summarize_news_item(item["title"], item["summary"], item["link"])
        summarized_news.append({"title": item["title"], "body": summary, "link": item["link"]})
        supabase.table("news").insert({
            "title": item["title"],
            "body": summary,
            "affects_f1": True,
            "tag": "USCIS Update",
            "link": item["link"]
        }).execute()

    users = supabase.table("users").select("*").not_.is_("push_token", "null").execute()
    if not users.data:
        logger.info("No users with push tokens found")
        return

    for user in users.data:
        for news in summarized_news:
            personalized = await personalize_news_for_student(news["title"], news["body"], news["link"], user)
            if personalized:
                await send_push_notification(user["push_token"], "Arriv0 Immigration Update", personalized)
                logger.info(f"News notification sent to {user['name']}")

    logger.info("News fetch and notification job complete")

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

    @validator('name')
    def name_must_be_valid(cls, v):
        if len(v) > 100:
            raise ValueError('Name must be under 100 characters')
        return v.strip()

    @validator('school')
    def school_must_be_valid(cls, v):
        if len(v) > 200:
            raise ValueError('School name must be under 200 characters')
        return v.strip()

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

    @validator('program_end_date')
    def date_must_be_valid(cls, v):
        try:
            parsed = date.fromisoformat(v)
            if parsed < date.today():
                raise ValueError('Program end date cannot be in the past')
        except ValueError as e:
            raise ValueError(f'Invalid date format. Use YYYY-MM-DD. {e}')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class ChatRequest(BaseModel):
    question: str
    name: str
    school: str
    visa_type: str
    year_level: int
    program_end_date: str

    @validator('question')
    def question_must_be_valid(cls, v):
        if len(v) > 500:
            raise ValueError('Question must be under 500 characters')
        return v.strip()

class NotificationSettingsRequest(BaseModel):
    user_id: str
    notification_time: str
    timezone: str

    @validator('notification_time')
    def time_must_be_valid(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError('Time must be in HH:MM format e.g. 08:00 or 20:30')
        return v

    @validator('timezone')
    def timezone_must_be_valid(cls, v):
        if v not in pytz.all_timezones:
            raise ValueError('Invalid timezone. Use a valid timezone like America/New_York')
        return v

@app.on_event("startup")
async def startup_event():
    scheduler.add_job(send_morning_notifications, CronTrigger(minute="*"))
    scheduler.start()
    logger.info("Morning notification scheduler started — checking every minute")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    logger.info("Scheduler stopped")

@app.get("/")
def home():
    return {"message": "Arriv0 backend is running"}

@app.post("/signup")
@limiter.limit("5/minute")
def signup(request: Request, data: SignupRequest):
    correlation_id = getattr(request.state, "correlation_id", None)
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
        log_security_event("SIGNUP_SUCCESS", f"New user registered at {data.school}", correlation_id)
        return {"message": f"Account created successfully. Welcome to Arriv0, {data.name}."}
    except Exception as e:
        logger.error(f"Signup error: {type(e).__name__} correlation_id={correlation_id}")
        raise HTTPException(status_code=400, detail="Signup failed. Please check your details and try again.")

@app.post("/login")
@limiter.limit("10/minute")
def login(request: Request, data: LoginRequest):
    correlation_id = getattr(request.state, "correlation_id", None)
    try:
        response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        log_security_event("LOGIN_SUCCESS", f"User logged in email={data.email[:3]}***", correlation_id)
        return {
            "message": "Login successful",
            "access_token": response.session.access_token,
            "user_id": response.user.id
        }
    except Exception as e:
        log_security_event("LOGIN_FAILED", f"Failed login attempt email={data.email[:3]}***", correlation_id)
        raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/reset-password")
@limiter.limit("3/minute")
def reset_password(request: Request, data: PasswordResetRequest):
    correlation_id = getattr(request.state, "correlation_id", None)
    try:
        supabase.auth.reset_password_email(data.email)
        log_security_event("PASSWORD_RESET_REQUESTED", f"Reset requested email={data.email[:3]}***", correlation_id)
        return {"message": "If an account exists with that email a password reset link has been sent."}
    except Exception as e:
        logger.error(f"Password reset error: {type(e).__name__} correlation_id={correlation_id}")
        return {"message": "If an account exists with that email a password reset link has been sent."}

@app.post("/onboarding")
def save_user(name: str, school: str, visa_type: str, year_level: str, program_end_date: str):
    try:
        supabase.table("users").insert({
            "name": name,
            "school": school,
            "visa_type": visa_type,
            "year_level": year_level,
            "program_end_date": program_end_date
        }).execute()
        return {"message": f"Welcome to Arriv0, {name}. Your profile has been saved."}
    except Exception as e:
        logger.error(f"Onboarding error: {type(e).__name__}")
        raise HTTPException(status_code=400, detail="Failed to save profile. Please try again.")

@app.get("/user/{user_id}")
@limiter.limit("30/minute")
def get_user_profile(request: Request, user_id: str, authorization: Optional[str] = Header(None)):
    correlation_id = getattr(request.state, "correlation_id", None)
    verified = verify_token(authorization, correlation_id)
    if verified.user.id != user_id:
        log_security_event("ACCESS_DENIED", f"User {verified.user.id[:8]}*** attempted to access profile of {user_id[:8]}***", correlation_id)
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own profile.")
    try:
        response = supabase.table("users").select("*").eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile fetch error: {type(e).__name__} correlation_id={correlation_id}")
        raise HTTPException(status_code=400, detail="Failed to fetch profile. Please try again.")

@app.post("/notification-settings")
@limiter.limit("10/minute")
def update_notification_settings(request: Request, data: NotificationSettingsRequest, authorization: Optional[str] = Header(None)):
    correlation_id = getattr(request.state, "correlation_id", None)
    verified = verify_token(authorization, correlation_id)
    if verified.user.id != data.user_id:
        log_security_event("ACCESS_DENIED", f"User attempted to update settings for different user", correlation_id)
        raise HTTPException(status_code=403, detail="Access denied.")
    try:
        supabase.table("users").update({
            "notification_time": data.notification_time,
            "timezone": data.timezone
        }).eq("id", data.user_id).execute()
        return {
            "message": f"Notification time set to {data.notification_time} {data.timezone}",
            "notification_time": data.notification_time,
            "timezone": data.timezone
        }
    except Exception as e:
        logger.error(f"Notification settings error: {type(e).__name__} correlation_id={correlation_id}")
        raise HTTPException(status_code=400, detail="Failed to update notification settings.")

@app.get("/timeline/{year_level}")
@limiter.limit("30/minute")
def get_timeline(request: Request, year_level: int, authorization: Optional[str] = Header(None)):
    correlation_id = getattr(request.state, "correlation_id", None)
    verify_token(authorization, correlation_id)
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
    correlation_id = getattr(request.state, "correlation_id", None)
    verify_token(authorization, correlation_id)
    today = date.today()
    end_date = date.fromisoformat(program_end_date)
    opt_window_opens = (end_date - today).days - 90

    if year_level < 4:
        return {"status": "on_track", "color": "green", "message": f"You are on track. Your OPT window opens in {opt_window_opens} days.", "action_needed": False}
    elif opt_window_opens > 90:
        return {"status": "on_track", "color": "green", "message": f"You are on track. Your OPT window opens in {opt_window_opens} days. No action needed today.", "action_needed": False}
    elif opt_window_opens > 30:
        return {"status": "prepare", "color": "yellow", "message": f"Your OPT window opens in {opt_window_opens} days. Start preparing your documents now.", "action_needed": True, "action": "Review your OPT checklist"}
    elif opt_window_opens > 0:
        return {"status": "urgent", "color": "red", "message": f"Urgent. Your OPT window is open and closes in {opt_window_opens} days. Apply now.", "action_needed": True, "action": "Start Form I-765 immediately", "link": "https://www.uscis.gov/i-765"}
    else:
        return {"status": "critical", "color": "red", "message": "Your OPT window may have closed. Contact your DSO immediately.", "action_needed": True, "action": "Contact DSO now"}

@app.get("/news")
@limiter.limit("30/minute")
def get_news(request: Request, authorization: Optional[str] = Header(None)):
    correlation_id = getattr(request.state, "correlation_id", None)
    verify_token(authorization, correlation_id)
    try:
        response = supabase.table("news").select("*").order("created_at", desc=True).limit(10).execute()
        if response.data:
            return {"news": response.data, "updated": response.data[0]["created_at"][:10]}
    except Exception as e:
        logger.error(f"News fetch error: {type(e).__name__} correlation_id={correlation_id}")

    news = [
        {"title": "USCIS OPT processing times now 3 to 4 months", "body": "New data shows average processing has increased. Submit your application on the first day your window opens to avoid gaps in work authorization.", "affects_f1": True, "tag": "Affects you directly", "link": "https://www.uscis.gov/tools/processing-times"},
        {"title": "STEM OPT extension rules remain unchanged", "body": "Computer Science and Cybersecurity both qualify. You are eligible for 24 additional months of work authorization after standard OPT.", "affects_f1": True, "tag": "Affects you directly", "link": "https://www.ice.gov/sevis/stemlist"},
        {"title": "New social media screening for visa renewals", "body": "USCIS now reviews public social media accounts during F1 visa processing. Review your public profiles before any upcoming renewal.", "affects_f1": False, "tag": "General F1 news", "link": None},
        {"title": "OPT application fee increased to $520", "body": "The filing fee for Form I-765 increased effective January 2026. Budget accordingly before your application window opens.", "affects_f1": True, "tag": "Affects you directly", "link": "https://www.uscis.gov/i-765"}
    ]
    return {"news": news, "updated": "August 11 2026"}

@app.get("/milestones/{year_level}")
@limiter.limit("30/minute")
def get_milestones(request: Request, year_level: int, authorization: Optional[str] = Header(None)):
    correlation_id = getattr(request.state, "correlation_id", None)
    verify_token(authorization, correlation_id)
    all_milestones = [
        {"id": 1, "icon": "🛬", "title": "Arrived and reported to DSO", "description": "Your F1 journey officially started. SEVIS record active.", "status": "done" if year_level >= 1 else "locked"},
        {"id": 2, "icon": "🏦", "title": "Opened a US bank account", "description": "You can now receive payments and build credit history.", "status": "done" if year_level >= 1 else "locked"},
        {"id": 3, "icon": "💼", "title": "First CPT internship authorized", "description": "You gained real US work experience. This goes on your resume.", "status": "done" if year_level >= 2 else "next" if year_level == 2 else "locked"},
        {"id": 4, "icon": "📋", "title": "DSO OPT recommendation received", "description": "Your DSO has approved your OPT application request.", "status": "done" if year_level >= 4 else "next" if year_level == 3 else "locked"},
        {"id": 5, "icon": "📄", "title": "Form I-765 submitted", "description": "Your OPT application is in USCIS hands.", "status": "next" if year_level == 4 else "locked"},
        {"id": 6, "icon": "💳", "title": "EAD card received", "description": "Your Employment Authorization Document arrived by mail.", "status": "locked"},
        {"id": 7, "icon": "🎯", "title": "First OPT job offer accepted", "description": "The moment everything you worked for becomes real.", "status": "locked"},
        {"id": 8, "icon": "🚀", "title": "STEM OPT extension approved", "description": "24 more months of work authorization secured.", "status": "locked"}
    ]
    completed = len([m for m in all_milestones if m["status"] == "done"])
    total = len(all_milestones)
    return {"milestones": all_milestones, "completed": completed, "total": total, "percentage": round((completed / total) * 100)}

@app.get("/ai-status")
@limiter.limit("10/minute")
def get_ai_status(request: Request, name: str, school: str, year_level: int, program_end_date: str, authorization: Optional[str] = Header(None)):
    correlation_id = getattr(request.state, "correlation_id", None)
    verify_token(authorization, correlation_id)

    today = date.today()
    end_date = date.fromisoformat(program_end_date)
    days_until_end = (end_date - today).days
    opt_window_opens = days_until_end - 90
    day_of_week = today.strftime("%A")
    week_number = today.isocalendar()[1]

    year_names = {1: "Freshman", 2: "Sophomore", 3: "Junior", 4: "Senior"}
    year_name = year_names.get(year_level, "Student")

    prompt = f"""You are Arriv0, a knowledgeable and friendly AI companion for international students on F1 visas in the United States.

Use this official immigration knowledge to ground your response:
{IMMIGRATION_KNOWLEDGE}

Student profile:
- Name: {name}
- School: {school}
- Year: {year_name}
- Program end date: {program_end_date}
- Days until program ends: {days_until_end}
- Days until OPT window opens: {opt_window_opens}
- Today is: {day_of_week}
- Week number: {week_number}

Write a short warm personalized morning message. Vary tone by day and urgency. Address by first name. 3 to 4 sentences. No bullet points. Plain English."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are Arriv0, a friendly AI companion for F1 students grounded in official USCIS immigration knowledge. You are not a lawyer."},
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
            "powered_by": "GPT-4o mini",
            "disclaimer": "Arriv0 provides general guidance only. For immigration advice consult your DSO or a qualified immigration attorney."
        }
    except Exception as e:
        logger.error(f"AI status error: {type(e).__name__} correlation_id={correlation_id}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable. Please try again.")

@app.post("/chat")
@limiter.limit("20/minute")
def chat(request: Request, data: ChatRequest, authorization: Optional[str] = Header(None)):
    correlation_id = getattr(request.state, "correlation_id", None)
    verify_token(authorization, correlation_id)

    year_names = {1: "Freshman", 2: "Sophomore", 3: "Junior", 4: "Senior"}
    year_name = year_names.get(data.year_level, "Student")

    today = date.today()
    end_date = date.fromisoformat(data.program_end_date)
    days_until_end = (end_date - today).days
    opt_window_opens = days_until_end - 90

    prompt = f"""You are Arriv0, a knowledgeable and friendly AI companion for international students on F1 visas in the United States.

Use this official immigration knowledge to ground your answers:
{IMMIGRATION_KNOWLEDGE}

You are talking to:
- Name: {data.name}
- School: {data.school}
- Visa type: {data.visa_type}
- Year: {year_name}
- Program end date: {data.program_end_date}
- Days until program ends: {days_until_end}
- Days until OPT window opens: {opt_window_opens}

The student asks: {data.question}

Answer rules:
- Address them by first name naturally
- Use their specific situation to personalize the answer
- Be conversational and warm
- For immigration questions use the official knowledge provided
- For general life questions answer helpfully and practically
- If serious legal risk always recommend consulting their DSO
- 3 to 6 sentences maximum
- No bullet points"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are Arriv0, a friendly knowledgeable AI companion for F1 international students. You are not a lawyer. Always recommend DSO for specific legal immigration decisions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.8
        )
        answer = response.choices[0].message.content
        return {
            "answer": answer,
            "powered_by": "GPT-4o mini",
            "disclaimer": "Arriv0 provides general guidance only. For specific immigration decisions consult your DSO or a qualified immigration attorney."
        }
    except Exception as e:
        logger.error(f"Chat error: {type(e).__name__} correlation_id={correlation_id}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable. Please try again.")

@app.post("/fetch-news")
@limiter.limit("5/minute")
async def trigger_news_fetch(request: Request, background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    correlation_id = getattr(request.state, "correlation_id", None)
    verify_token(authorization, correlation_id)
    background_tasks.add_task(process_and_notify)
    return {"message": "News fetch and notification job started in background"}

@app.post("/save-token")
@limiter.limit("10/minute")
def save_push_token(request: Request, user_id: str, push_token: str, authorization: Optional[str] = Header(None)):
    correlation_id = getattr(request.state, "correlation_id", None)
    verified = verify_token(authorization, correlation_id)
    if verified.user.id != user_id:
        log_security_event("ACCESS_DENIED", f"User attempted to save token for different user", correlation_id)
        raise HTTPException(status_code=403, detail="Access denied.")
    try:
        supabase.table("users").update({"push_token": push_token}).eq("id", user_id).execute()
        return {"message": "Push token saved successfully"}
    except Exception as e:
        logger.error(f"Push token save error: {type(e).__name__} correlation_id={correlation_id}")
        raise HTTPException(status_code=400, detail="Failed to save push token. Please try again.")