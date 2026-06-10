from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.api.v1.endpoints import auth, admissions, contact, uploads, notifications, admin, public
from app.api.deps import get_current_user, register_audit_log
from app.db.session import get_db

api_router = APIRouter()

# Register core full-stack route modules
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admissions.router, prefix="/admissions", tags=["admissions"])
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(public.router, prefix="/public", tags=["public"])


# Compatibility route for legacy frontend logout path (/api/logout)
@api_router.get("/logout", tags=["auth"])
@api_router.post("/logout", tags=["auth"])
def legacy_logout(request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
	client_host = request.client.host if request.client else "Unknown"
	register_audit_log(
		db=db,
		action="Logout",
		admin_id=current_user.id if hasattr(current_user, "id") else None,
		ip_address=client_host,
		before_data={"email": getattr(current_user, "email", None)},
		after_data={"logout_timestamp": datetime.now(timezone.utc).isoformat()}
	)
	return {"message": "You have been logged out successfully."}

