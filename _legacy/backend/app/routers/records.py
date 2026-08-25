from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import asc
from typing import List
import os
import uuid
from datetime import datetime
from app.database import get_db
from app.models import User, FitdaysRecord, FitdaysReport
from app.auth import get_current_user
from app.parser import parse_fitdays_file
from app.schemas import FitdaysRecordResponse, DashboardSummary, WeightHistoryPoint, DeleteRecordsRequest, DeleteRecordsResponse, FailedDeletion, FitdaysReportResponse

router = APIRouter(prefix="/api/records", tags=["Fitdays Records"])

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Read file content
    try:
        content = await file.read()
        parsed_records = parse_fitdays_file(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse Fitdays file: {str(e)}"
        )
        
    if not parsed_records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid Fitdays records found in the uploaded file"
        )
        
    inserted_count = 0
    updated_count = 0
    
    # Upsert logic
    for rec_data in parsed_records:
        existing = db.query(FitdaysRecord).filter(
            FitdaysRecord.user_id == current_user.id,
            FitdaysRecord.date == rec_data["date"]
        ).first()
        
        if existing:
            for k, v in rec_data.items():
                setattr(existing, k, v)
            updated_count += 1
        else:
            new_record = FitdaysRecord(user_id=current_user.id, **rec_data)
            db.add(new_record)
            inserted_count += 1
            
    db.commit()
    return {
        "message": "File processed successfully",
        "inserted": inserted_count,
        "updated": updated_count,
        "total_processed": len(parsed_records)
    }

@router.get("", response_model=List[FitdaysRecordResponse])
def get_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(FitdaysRecord).filter(
        FitdaysRecord.user_id == current_user.id
    ).order_by(asc(FitdaysRecord.date)).all()
    return records

@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(FitdaysRecord).filter(
        FitdaysRecord.user_id == current_user.id
    ).order_by(asc(FitdaysRecord.date)).all()
    
    total_records = len(records)
    if total_records == 0:
        return DashboardSummary(
            total_records=0,
            weight_history=[]
        )
        
    first = records[0]
    last = records[-1]
    
    # Extract weight history for plotting
    weight_history = [
        WeightHistoryPoint(
            date=r.date,
            weight=r.weight,
            body_fat_pct=r.body_fat_pct,
            body_fat_mass=r.fat_mass,
            muscle_mass=r.muscle_mass,
            skeletal_muscle_mass=r.skeletal_muscle_mass,
            skeletal_muscle_mass_pct=r.skeletal_muscle_mass_pct
        ) for r in records
    ]
    
    # Calculate differences
    weight_change = last.weight - first.weight
    body_fat_change = last.body_fat_pct - first.body_fat_pct
    body_fat_mass_change = last.fat_mass - first.fat_mass
    muscle_mass_change = last.muscle_mass - first.muscle_mass
    skeletal_muscle_mass_change = last.skeletal_muscle_mass - first.skeletal_muscle_mass
    skeletal_muscle_mass_pct_change = last.skeletal_muscle_mass_pct - first.skeletal_muscle_mass_pct
    
    return DashboardSummary(
        total_records=total_records,
        first_record_date=first.date,
        latest_record_date=last.date,
        starting_weight=first.weight,
        current_weight=last.weight,
        weight_change=round(weight_change, 2),
        starting_body_fat=first.body_fat_pct,
        current_body_fat=last.body_fat_pct,
        body_fat_change=round(body_fat_change, 2),
        starting_body_fat_mass=first.fat_mass,
        current_body_fat_mass=last.fat_mass,
        body_fat_mass_change=round(body_fat_mass_change, 2),
        starting_muscle_mass=first.muscle_mass,
        current_muscle_mass=last.muscle_mass,
        muscle_mass_change=round(muscle_mass_change, 2),
        starting_skeletal_muscle_mass=first.skeletal_muscle_mass,
        current_skeletal_muscle_mass=last.skeletal_muscle_mass,
        skeletal_muscle_mass_change=round(skeletal_muscle_mass_change, 2),
        starting_skeletal_muscle_mass_pct=first.skeletal_muscle_mass_pct,
        current_skeletal_muscle_mass_pct=last.skeletal_muscle_mass_pct,
        skeletal_muscle_mass_pct_change=round(skeletal_muscle_mass_pct_change, 2),
        weight_history=weight_history
    )


@router.post("/delete", response_model=DeleteRecordsResponse)
def delete_records(
    payload: DeleteRecordsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deleted_ids = []
    failed_deletions = []
    
    for rec_id in payload.ids:
        record = db.query(FitdaysRecord).filter(FitdaysRecord.id == rec_id).first()
        if not record:
            failed_deletions.append(FailedDeletion(id=rec_id, reason="not_found"))
        elif record.user_id != current_user.id:
            failed_deletions.append(FailedDeletion(id=rec_id, reason="unauthorized"))
        else:
            db.delete(record)
            deleted_ids.append(rec_id)
            
    if deleted_ids:
        db.commit()
        
    return DeleteRecordsResponse(deleted=deleted_ids, failed=failed_deletions)


@router.get("/{record_id}/report", response_model=FitdaysReportResponse)
def get_record_report(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(FitdaysRecord).filter(
        FitdaysRecord.id == record_id,
        FitdaysRecord.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    if not record.report:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    
    return record.report


@router.post("/{record_id}/report", response_model=FitdaysReportResponse, status_code=status.HTTP_201_CREATED)
async def upload_record_report(
    record_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(FitdaysRecord).filter(
        FitdaysRecord.id == record_id,
        FitdaysRecord.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    # Validate mime type
    ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "application/pdf"]
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PNG, JPEG, and PDF are allowed."
        )
    
    # Validate file size (max 5MB)
    MAX_SIZE = 5 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit."
        )
    
    # Save file locally
    extension = "pdf" if file.content_type == "application/pdf" else ("png" if file.content_type == "image/png" else "jpg")
    filename = f"report_{record_id}_{uuid.uuid4().hex}.{extension}"
    
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    upload_dir = os.getenv("REPORTS_DIR", os.path.join(backend_dir, "uploads", "reports"))
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    
    # If record already has a report, delete old file and database entry
    if record.report:
        db.delete(record.report)
        db.commit() # This will trigger the after_delete hook to remove the old file on disk!
        
    try:
        with open(filepath, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save report file: {str(e)}"
        )
        
    new_report = FitdaysReport(
        record_id=record_id,
        file_path=filepath,
        filename=file.filename or filename,
        mime_type=file.content_type,
        file_size=len(contents),
        uploaded_at=datetime.utcnow()
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report


@router.delete("/{record_id}/report", status_code=status.HTTP_204_NO_CONTENT)
def delete_record_report(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(FitdaysRecord).filter(
        FitdaysRecord.id == record_id,
        FitdaysRecord.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    if not record.report:
        raise HTTPException(status_code=404, detail="No report attached to this record")
    
    db.delete(record.report) # Triggers event listener to delete file on disk
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

