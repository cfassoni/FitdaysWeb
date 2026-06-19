import os
import uuid
import io
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from PIL import Image
from app.database import get_db
from app.models import User
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.schemas import UserCreate, UserResponse, Token, UserUpdate

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if login or email already exists
    existing_login = db.query(User).filter(User.login == user_data.login).first()
    if existing_login:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login already registered"
        )
        
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        login=user_data.login,
        email=user_data.email,
        hashed_password=hashed_pwd,
        display_name=user_data.display_name,
        gender=user_data.gender,
        birthday=user_data.birthday,
        height_cm=user_data.height_cm,
        target_weight_kg=user_data.target_weight_kg,
        preferred_language=user_data.preferred_language
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect login or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.login})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(profile_data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if login is being changed and if it is unique
    if profile_data.login is not None and profile_data.login != current_user.login:
        existing_login = db.query(User).filter(User.login == profile_data.login).first()
        if existing_login:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Login already registered"
            )
        current_user.login = profile_data.login

    # Check if email is being changed and if it is unique
    if profile_data.email is not None and profile_data.email != current_user.email:
        existing_email = db.query(User).filter(User.email == profile_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = profile_data.email

    # Update other profile fields
    for field in ['display_name', 'gender', 'birthday', 'height_cm', 'target_weight_kg', 'preferred_language']:
        val = getattr(profile_data, field)
        if val is not None:
            setattr(current_user, field, val)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/profile-picture", response_model=UserResponse)
def upload_profile_picture(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, and WebP are allowed."
        )

    # 2. Validate file size (max 4MB)
    MAX_SIZE = 4 * 1024 * 1024
    contents = file.file.read(MAX_SIZE + 1)
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 4MB limit."
        )

    # 3. Resize and process image with Pillow
    try:
        image = Image.open(io.BytesIO(contents))
        
        # Convert mode to RGB/RGBA if necessary
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
            
        # Perform square crop and resize to 256x256
        width, height = image.size
        min_dim = min(width, height)
        left = (width - min_dim) / 2
        top = (height - min_dim) / 2
        right = (width + min_dim) / 2
        bottom = (height + min_dim) / 2
        image = image.crop((left, top, right, bottom))
        
        # Resampling.LANCZOS is the modern Pillow replacement for ANTIALIAS
        resample_filter = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.ANTIALIAS
        image = image.resize((256, 256), resample_filter)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image file: {str(e)}"
        )

    # 4. Save file to uploads folder
    # users.py is at backend/app/routers/users.py. Go up three levels to reach backend/ root.
    filename = f"user_{current_user.id}_{uuid.uuid4().hex}.png"
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    upload_dir = os.getenv("UPLOAD_DIR", os.path.join(backend_dir, "uploads", "profile_pics"))
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)

    # Delete old profile pic if it exists
    if current_user.profile_image_path and os.path.exists(current_user.profile_image_path):
        try:
            os.remove(current_user.profile_image_path)
        except Exception:
            pass

    try:
        image.save(filepath, format="PNG")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save profile picture: {str(e)}"
        )

    # 5. Update user record
    current_user.profile_image_path = filepath
    db.commit()
    db.refresh(current_user)
    return current_user
