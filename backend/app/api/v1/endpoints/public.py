from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

# ----------------------------------------------------
# PUBLIC SCHOOL INFORMATION
# ----------------------------------------------------

@router.get("/school-info")
def get_school_info():
    return {
        "school_name": "Majestic Primary & High School",
        "academic_year": "2026-2027",
        "status": "active",
        "timestamp": datetime.utcnow()
    }


# ----------------------------------------------------
# PUBLIC ANNOUNCEMENTS
# ----------------------------------------------------

@router.get("/announcements")
def get_announcements():
    return {
        "success": True,
        "announcements": [
            {
                "id": 1,
                "title": "Admissions Open",
                "description": "Admissions are now open for Academic Year 2026-27."
            }
        ]
    }


# ----------------------------------------------------
# PUBLIC EVENTS
# ----------------------------------------------------

@router.get("/events")
def get_events():
    return {
        "success": True,
        "events": [
            {
                "id": 1,
                "title": "Annual Day",
                "date": "2026-12-15"
            }
        ]
    }


# ----------------------------------------------------
# PUBLIC NOTICES
# ----------------------------------------------------

@router.get("/notices")
def get_notices():
    return {
        "success": True,
        "notices": [
            {
                "id": 1,
                "title": "School Reopening",
                "message": "School will reopen on June 15."
            }
        ]
    }


# ----------------------------------------------------
# PUBLIC GALLERY
# ----------------------------------------------------

@router.get("/gallery")
def get_gallery():
    return {
        "success": True,
        "images": []
    }


# ----------------------------------------------------
# HEALTH CHECK
# ----------------------------------------------------

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Majestic School Public API",
        "timestamp": datetime.utcnow()
    }


# ----------------------------------------------------
# VERSION
# ----------------------------------------------------

@router.get("/version")
def version():
    return {
        "version": "1.0.0",
        "environment": "development"
    }