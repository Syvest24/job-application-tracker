from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import pymongo
import os
import uuid

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
db_name = os.environ.get('DB_NAME', 'test_database')

client = pymongo.MongoClient(mongo_url)
db = client[db_name]
applications_collection = db.applications

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

@app.get("/api/applications", response_model=List[JobApplicationResponse])
def get_applications(
    status: Optional[str] = None,
    search: Optional[str] = None,
    progress: Optional[str] = None
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
    
    applications = list(applications_collection.find(query, {"_id": 0}).sort("created_at", -1))
    
    for app in applications:
        if isinstance(app["application_date"], str):
            app["application_date"] = datetime.fromisoformat(app["application_date"]).date()
    
    return applications

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)