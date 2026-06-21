import os
import uuid
import secrets
import json
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import jwt

from app.database import get_db
from app.models import User, SharedLink, SharedLinkAuditLog
from app.auth import get_current_user, get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from app.schemas import (
    SharedLinkCreate,
    SharedLinkUpdate,
    SharedLinkResponse,
    SharedLinkPublicResponse,
    SharedLinkVerifyRequest,
    SharedLinkPublicDataResponse,
    DashboardSummary,
    WeightHistoryPoint,
    FitdaysRecordResponse,
    FitdaysRecordGuestResponse
)

router = APIRouter(prefix="/api/shared-links", tags=["Shared Links"])


def map_to_response(link: SharedLink) -> SharedLinkResponse:
    try:
        entries = json.loads(link.snapshot_data)
        entry_count = len(entries)
    except Exception:
        entry_count = 0

    success_logs = [log for log in link.audit_logs if log.status == "success"]
    access_count = len(success_logs)
    last_accessed_at = max((log.accessed_at for log in success_logs), default=None)

    return SharedLinkResponse(
        id=link.id,
        token=link.token,
        description=link.description,
        has_password=link.password_hash is not None,
        include_attachments=link.include_attachments,
        expires_at=link.expires_at,
        created_at=link.created_at,
        entry_count=entry_count,
        access_count=access_count,
        last_accessed_at=last_accessed_at
    )


def log_access(db: Session, link_id: str, request: Request, status_str: str):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    log = SharedLinkAuditLog(
        shared_link_id=link_id,
        ip_address=ip_address,
        user_agent=user_agent,
        status=status_str
    )
    db.add(log)
    db.commit()


def verify_guest_auth(link: SharedLink, authorization: str | None = Header(None), guest_token: str | None = None) -> None:
    if not link.password_hash:
        return

    token_val = None
    if authorization and authorization.startswith("Bearer "):
        token_val = authorization.split(" ")[1]
    elif guest_token:
        token_val = guest_token

    if not token_val:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password required for this shared link"
        )

    try:
        payload = jwt.decode(token_val, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "guest" or payload.get("link_id") != link.id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid guest token"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired guest session"
        )


# ==================== OWNER ENDPOINTS ====================

@router.post("", response_model=SharedLinkResponse, status_code=status.HTTP_201_CREATED)
def create_shared_link(
    payload: SharedLinkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Active links limit check
    max_active_links = int(os.getenv("MAX_ACTIVE_SHARED_LINKS", "10"))
    active_count = db.query(SharedLink).filter(
        SharedLink.owner_id == current_user.id,
        (SharedLink.expires_at == None) | (SharedLink.expires_at > datetime.utcnow())
    ).count()

    if active_count >= max_active_links:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have reached the maximum limit of {max_active_links} active shared links. Please revoke or let old links expire before creating a new one."
        )

    # Fetch and validate records
    from app.models import FitdaysRecord
    records = db.query(FitdaysRecord).filter(
        FitdaysRecord.id.in_(payload.entry_ids),
        FitdaysRecord.user_id == current_user.id
    ).order_by(FitdaysRecord.date.asc()).all()

    if not records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid records selected for sharing"
        )

    # Serialize entries to snapshot JSON
    serialized_entries = []
    for r in records:
        resp_obj = FitdaysRecordResponse.model_validate(r)
        dumped = resp_obj.model_dump(mode='json')
        if r.report and "report" in dumped and dumped["report"]:
            dumped["report"]["file_path"] = r.report.file_path
        serialized_entries.append(dumped)

    # Generate token
    token = secrets.token_urlsafe(32)

    db_link = SharedLink(
        id=str(uuid.uuid4()),
        owner_id=current_user.id,
        token=token,
        description=payload.description,
        password_hash=get_password_hash(payload.password) if payload.password else None,
        include_attachments=payload.include_attachments,
        expires_at=payload.expires_at,
        snapshot_data=json.dumps(serialized_entries),
        created_at=datetime.utcnow()
    )

    db.add(db_link)
    db.commit()
    db.refresh(db_link)

    return map_to_response(db_link)


@router.get("", response_model=List[SharedLinkResponse])
def get_shared_links(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    links = db.query(SharedLink).filter(
        SharedLink.owner_id == current_user.id
    ).order_by(SharedLink.created_at.desc()).all()

    return [map_to_response(l) for l in links]


@router.get("/{link_id}", response_model=SharedLinkResponse)
def get_shared_link_details(
    link_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    link = db.query(SharedLink).filter(
        SharedLink.id == link_id,
        SharedLink.owner_id == current_user.id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")

    return map_to_response(link)


@router.patch("/{link_id}", response_model=SharedLinkResponse)
def update_shared_link(
    link_id: str,
    payload: SharedLinkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    link = db.query(SharedLink).filter(
        SharedLink.id == link_id,
        SharedLink.owner_id == current_user.id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")

    if payload.description is not None:
        link.description = payload.description

    if payload.expires_at is not None:
        link.expires_at = payload.expires_at

    if payload.clear_password:
        link.password_hash = None
    elif payload.password is not None and payload.password != "":
        link.password_hash = get_password_hash(payload.password)

    db.commit()
    db.refresh(link)

    return map_to_response(link)


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shared_link(
    link_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    link = db.query(SharedLink).filter(
        SharedLink.id == link_id,
        SharedLink.owner_id == current_user.id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")

    db.delete(link)
    db.commit()
    return


# ==================== GUEST (PUBLIC) ENDPOINTS ====================

@router.get("/public/{token}", response_model=SharedLinkPublicResponse)
def get_public_link_metadata(
    token: str,
    db: Session = Depends(get_db)
):
    link = db.query(SharedLink).filter(SharedLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")

    # Expiration check
    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Shared link has expired")

    # Extract latest measurement date from snapshotted entries
    latest_measurement_date = None
    try:
        entries = json.loads(link.snapshot_data)
        if entries:
            max_date_str = max(e["date"] for e in entries)
            latest_measurement_date = datetime.fromisoformat(max_date_str)
    except Exception:
        pass

    return SharedLinkPublicResponse(
        id=link.id,
        description=link.description,
        has_password=link.password_hash is not None,
        expires_at=link.expires_at,
        created_at=link.created_at,
        owner_name=link.owner.display_name or link.owner.login,
        owner_email=link.owner.email,
        latest_measurement_date=latest_measurement_date
    )


@router.post("/public/{token}/verify")
def verify_public_link_password(
    token: str,
    payload: SharedLinkVerifyRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    link = db.query(SharedLink).filter(SharedLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")

    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Shared link has expired")

    if not link.password_hash:
        return {"message": "No password required for this link"}

    if not verify_password(payload.password, link.password_hash):
        log_access(db, link.id, request, "failed_password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    log_access(db, link.id, request, "success_password_verified")

    # Generate guest JWT token valid for 60 minutes
    guest_payload = {
        "sub": f"guest:{link.id}",
        "type": "guest",
        "link_id": link.id
    }
    guest_jwt = create_access_token(guest_payload, expires_delta=timedelta(minutes=60))

    return {"guest_token": guest_jwt}


@router.get("/public/{token}/data", response_model=SharedLinkPublicDataResponse)
def get_public_link_data(
    token: str,
    request: Request,
    authorization: str | None = Header(None),
    db: Session = Depends(get_db)
):
    link = db.query(SharedLink).filter(SharedLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")

    if link.expires_at and link.expires_at < datetime.utcnow():
        log_access(db, link.id, request, "expired_access")
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Shared link has expired")

    # Check password/JWT header
    verify_guest_auth(link, authorization)

    log_access(db, link.id, request, "success")

    # Parse and construct response data from snapshot
    try:
        entries = json.loads(link.snapshot_data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse shared data snapshot"
        )

    # Sort entries by date to make sure
    entries.sort(key=lambda x: x["date"])

    total_records = len(entries)
    if total_records == 0:
        summary = DashboardSummary(
            total_records=0,
            weight_history=[]
        )
    else:
        first = entries[0]
        last = entries[-1]

        weight_history = [
            WeightHistoryPoint(
                date=datetime.fromisoformat(r["date"]),
                weight=r["weight"],
                body_fat_pct=r["body_fat_pct"],
                body_fat_mass=r["fat_mass"],
                muscle_mass=r["muscle_mass"],
                skeletal_muscle_mass=r["skeletal_muscle_mass"],
                skeletal_muscle_mass_pct=r["skeletal_muscle_mass_pct"]
            ) for r in entries
        ]

        summary = DashboardSummary(
            total_records=total_records,
            first_record_date=datetime.fromisoformat(first["date"]),
            latest_record_date=datetime.fromisoformat(last["date"]),
            starting_weight=first["weight"],
            current_weight=last["weight"],
            weight_change=round(last["weight"] - first["weight"], 2),
            starting_body_fat=first["body_fat_pct"],
            current_body_fat=last["body_fat_pct"],
            body_fat_change=round(last["body_fat_pct"] - first["body_fat_pct"], 2),
            starting_body_fat_mass=first["fat_mass"],
            current_body_fat_mass=last["fat_mass"],
            body_fat_mass_change=round(last["fat_mass"] - first["fat_mass"], 2),
            starting_muscle_mass=first["muscle_mass"],
            current_muscle_mass=last["muscle_mass"],
            muscle_mass_change=round(last["muscle_mass"] - first["muscle_mass"], 2),
            starting_skeletal_muscle_mass=first["skeletal_muscle_mass"],
            current_skeletal_muscle_mass=last["skeletal_muscle_mass"],
            skeletal_muscle_mass_change=round(last["skeletal_muscle_mass"] - first["skeletal_muscle_mass"], 2),
            starting_skeletal_muscle_mass_pct=first["skeletal_muscle_mass_pct"],
            current_skeletal_muscle_mass_pct=last["skeletal_muscle_mass_pct"],
            skeletal_muscle_mass_pct_change=round(last["skeletal_muscle_mass_pct"] - first["skeletal_muscle_mass_pct"], 2),
            weight_history=weight_history
        )

    # Process and sanitize attachment URLs for the guest
    processed_entries = []
    for entry in entries:
        entry_copy = entry.copy()
        if link.include_attachments and entry_copy.get("report"):
            # Set target URL to guest attachment endpoint
            report_id = entry_copy["report"]["id"]
            entry_copy["report"]["url"] = f"/api/shared-links/public/{token}/attachments/{report_id}"
        else:
            entry_copy["report"] = None
        processed_entries.append(FitdaysRecordGuestResponse.model_validate(entry_copy))

    return SharedLinkPublicDataResponse(
        dashboard=summary,
        entries=processed_entries
    )


@router.get("/public/{token}/attachments/{report_id}")
def get_public_link_attachment(
    token: str,
    report_id: int,
    request: Request,
    authorization: str | None = Header(None),
    guest_token: str | None = None,
    db: Session = Depends(get_db)
):
    link = db.query(SharedLink).filter(SharedLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")

    if link.expires_at and link.expires_at < datetime.utcnow():
        log_access(db, link.id, request, "expired_attachment_access")
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Shared link has expired")

    # Check password/JWT header
    verify_guest_auth(link, authorization, guest_token)

    if not link.include_attachments:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Attachments are not shared for this link"
        )

    # Find the report info from the snapshot data
    try:
        entries = json.loads(link.snapshot_data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse shared data snapshot"
        )

    report_info = None
    for r in entries:
        if r.get("report") and r["report"]["id"] == report_id:
            report_info = r["report"]
            break

    if not report_info:
        raise HTTPException(status_code=404, detail="Attachment report not found in this shared link")

    # Serve the file from disk if it exists
    file_path = report_info["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Attachment file not found on disk")

    log_access(db, link.id, request, f"success_attachment_download_{report_id}")

    return FileResponse(
        path=file_path,
        media_type=report_info["mime_type"],
        filename=report_info["filename"],
        content_disposition_type="inline"
    )
