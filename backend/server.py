from fastapi import FastAPI, HTTPException, File, UploadFile, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import pymongo
import os
import uuid
import base64

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'jobapp0')

client = pymongo.MongoClient(mongo_url)
db = client[db_name]
applications_collection = db.applications
portfolio_collection = db.portfolio
cv_files_collection = db.cv_files

# Pydantic models
class JobApplication(BaseModel):
    job_title: str
    company_name: str
    recruiter_name: Optional[str] = ""
    application_date: date
    status: str  # Applied, Interviewing, Offer, Rejected
    progress: str  # Not Started, In Progress, Completed
    notes: Optional[str] = ""

class JobApplicationResponse(BaseModel):
    id: str
    job_title: str
    company_name: str
    recruiter_name: str
    application_date: date
    status: str
    progress: str
    notes: str
    created_at: datetime
    updated_at: datetime

class JobApplicationUpdate(BaseModel):
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    recruiter_name: Optional[str] = None
    application_date: Optional[date] = None
    status: Optional[str] = None
    progress: Optional[str] = None
    notes: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Job Application Tracker API"}

@app.post("/api/applications", response_model=JobApplicationResponse)
def create_application(application: JobApplication):
    app_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    app_dict = application.dict()
    app_dict["id"] = app_id
    app_dict["created_at"] = now
    app_dict["updated_at"] = now
    app_dict["application_date"] = application.application_date.isoformat()
    
    applications_collection.insert_one(app_dict)
    
    return JobApplicationResponse(**app_dict)

@app.get("/api/applications")
def get_applications(
    status: Optional[str] = None,
    search: Optional[str] = None,
    progress: Optional[str] = None,
    page: Optional[int] = 1,
    limit: Optional[int] = 20
):
    query = {}
    
    if status:
        query["status"] = status
    if progress:
        query["progress"] = progress
    if search:
        query["$or"] = [
            {"job_title": {"$regex": search, "$options": "i"}},
            {"company_name": {"$regex": search, "$options": "i"}},
            {"recruiter_name": {"$regex": search, "$options": "i"}}
        ]
    
    # Validate pagination parameters
    page = max(1, page)  # Ensure page is at least 1
    limit = max(1, min(100, limit))  # Ensure limit is between 1 and 100
    
    # Calculate pagination
    skip = (page - 1) * limit
    total = applications_collection.count_documents(query)
    
    applications = list(
        applications_collection.find(query, {"_id": 0})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    
    for app in applications:
        if isinstance(app["application_date"], str):
            app["application_date"] = datetime.fromisoformat(app["application_date"]).date()
    
    return {
        "applications": applications,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

@app.get("/api/applications/{app_id}", response_model=JobApplicationResponse)
def get_application(app_id: str):
    application = applications_collection.find_one({"id": app_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if isinstance(application["application_date"], str):
        application["application_date"] = datetime.fromisoformat(application["application_date"]).date()
    
    return JobApplicationResponse(**application)

@app.put("/api/applications/{app_id}", response_model=JobApplicationResponse)
def update_application(app_id: str, application_update: JobApplicationUpdate):
    existing_app = applications_collection.find_one({"id": app_id}, {"_id": 0})
    if not existing_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = {k: v for k, v in application_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    if "application_date" in update_data:
        update_data["application_date"] = update_data["application_date"].isoformat()
    
    applications_collection.update_one({"id": app_id}, {"$set": update_data})
    
    updated_app = applications_collection.find_one({"id": app_id}, {"_id": 0})
    if isinstance(updated_app["application_date"], str):
        updated_app["application_date"] = datetime.fromisoformat(updated_app["application_date"]).date()
    
    return JobApplicationResponse(**updated_app)

@app.delete("/api/applications/{app_id}")
def delete_application(app_id: str):
    result = applications_collection.delete_one({"id": app_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted successfully"}

@app.get("/api/applications/stats/summary")
def get_application_stats():
    pipeline = [
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]
    
    stats = list(applications_collection.aggregate(pipeline))
    stats_dict = {item["_id"]: item["count"] for item in stats}
    
    total = sum(stats_dict.values())
    
    return {
        "total": total,
        "by_status": stats_dict
    }

# ==================== Portfolio Endpoints ====================

class PortfolioData(BaseModel):
    name: str
    title: str
    about_en: str
    about_de: str
    skills: List[str]
    certifications: List[str]
    languages: List[dict]
    email: Optional[str] = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    location: Optional[str] = ""

class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    about_en: Optional[str] = None
    about_de: Optional[str] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    languages: Optional[List[dict]] = None
    email: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    location: Optional[str] = None

# Simple admin authentication (in production, use proper auth)
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

def verify_admin(authorization: Optional[str] = Header(None)):
    if not authorization or authorization != f"Bearer {ADMIN_PASSWORD}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

@app.get("/api/portfolio")
def get_portfolio():
    """Get portfolio data (public endpoint)"""
    portfolio = portfolio_collection.find_one({"type": "main"}, {"_id": 0})
    
    if not portfolio:
        # Initialize with default data from sample
        default_portfolio = {
            "type": "main",
            "name": "Syvester Nsansi",
            "title": "Cloud Solution Architect",
            "about_en": "Cloud Solution Architect with a passion for designing scalable AWS infrastructure and automating CI/CD pipelines. Completed a 12-month AWS Cloud Engineer program at DCI, gaining hands-on experience with Terraform, Docker, and modern DevOps practices.",
            "about_de": "Cloud Solution Architect mit einer Leidenschaft für skalierbare AWS-Infrastrukturen und CI/CD-Automatisierung. Absolvent eines 12-monatigen Cloud-Engineering-Programms am DCI mit praxisnaher Erfahrung in Docker, Terraform und modernen DevOps-Praktiken.",
            "skills": [
                "AWS (EC2, S3, VPC, IAM, CloudFormation)",
                "CI/CD Pipelines",
                "Docker",
                "Terraform",
                "Python",
                "Bash",
                "WordPress",
                "SEO",
                "Frontend Design",
                "Linux",
                "Git",
                "Docker Compose"
            ],
            "certifications": [
                "AWS Cloud Engineer – DCI (2024–2025)",
                "GoodHabitz: Communication, Teamwork, Problem Solving"
            ],
            "languages": [
                {"name": "English", "level": "Native"},
                {"name": "French", "level": "Fluent"},
                {"name": "Russian", "level": "B1"},
                {"name": "German", "level": "B2"}
            ],
            "email": "",
            "linkedin": "",
            "github": "",
            "location": ""
        }
        portfolio_collection.insert_one(default_portfolio.copy())
        # Remove _id if exists
        if "_id" in default_portfolio:
            del default_portfolio["_id"]
        return default_portfolio
    
    # Ensure _id is removed
    if "_id" in portfolio:
        del portfolio["_id"]
    
    return portfolio

@app.put("/api/portfolio")
def update_portfolio(portfolio_update: PortfolioUpdate, authorized: bool = Header(None, alias="Authorization")):
    """Update portfolio data (admin only)"""
    try:
        auth_header = authorized
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        token = auth_header.split(" ")[1]
        if token != ADMIN_PASSWORD:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    update_data = {k: v for k, v in portfolio_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    portfolio_collection.update_one(
        {"type": "main"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Portfolio updated successfully"}

@app.post("/api/portfolio/cv/upload")
async def upload_cv(
    language: str,
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    """Upload CV file (admin only)"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = authorization.split(" ")[1]
    if token != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if language not in ["en", "de"]:
        raise HTTPException(status_code=400, detail="Language must be 'en' or 'de'")
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Read file content
    content = await file.read()
    
    # Store as base64 in MongoDB
    cv_data = {
        "language": language,
        "filename": file.filename,
        "content": base64.b64encode(content).decode('utf-8'),
        "content_type": "application/pdf",
        "uploaded_at": datetime.utcnow()
    }
    
    # Update or insert
    cv_files_collection.update_one(
        {"language": language},
        {"$set": cv_data},
        upsert=True
    )
    
    return {"message": f"CV ({language}) uploaded successfully", "filename": file.filename}

@app.get("/api/portfolio/cv/{language}")
def download_cv(language: str):
    """Download CV file (public endpoint)"""
    if language not in ["en", "de"]:
        raise HTTPException(status_code=400, detail="Language must be 'en' or 'de'")
    
    cv_file = cv_files_collection.find_one({"language": language})
    
    if not cv_file:
        raise HTTPException(status_code=404, detail=f"CV not found for language: {language}")
    
    # Decode base64 content
    content = base64.b64decode(cv_file["content"])
    
    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={cv_file['filename']}"
        }
    )

@app.get("/api/portfolio/cv/check/{language}")
def check_cv_exists(language: str):
    """Check if CV exists for a language"""
    if language not in ["en", "de"]:
        raise HTTPException(status_code=400, detail="Language must be 'en' or 'de'")
    
    cv_file = cv_files_collection.find_one({"language": language})
    
    return {
        "exists": cv_file is not None,
        "filename": cv_file.get("filename") if cv_file else None,
        "uploaded_at": cv_file.get("uploaded_at") if cv_file else None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
