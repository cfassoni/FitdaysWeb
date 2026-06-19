from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import asc
from typing import List
from app.database import get_db
from app.models import User, FitdaysRecord
from app.auth import get_current_user
from app.parser import parse_fitdays_file
from app.schemas import FitdaysRecordResponse, DashboardSummary, WeightHistoryPoint, DeleteRecordsRequest, DeleteRecordsResponse, FailedDeletion

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
            muscle_mass=r.muscle_mass
        ) for r in records
    ]
    
    # Calculate differences
    weight_change = last.weight - first.weight
    body_fat_change = last.body_fat_pct - first.body_fat_pct
    muscle_mass_change = last.muscle_mass - first.muscle_mass
    
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
        starting_muscle_mass=first.muscle_mass,
        current_muscle_mass=last.muscle_mass,
        muscle_mass_change=round(muscle_mass_change, 2),
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

