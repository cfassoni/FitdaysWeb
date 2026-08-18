import os
import uuid
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from PIL import Image
from app.database import get_db
from app.models import User
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    generate_verification_code,
    get_verification_expiry,
    generate_reset_token,
    get_reset_token_expiry,
    MAX_VERIFICATION_ATTEMPTS,
    MAX_RESET_PASSWORD_ATTEMPTS,
)
from app.schemas import (
    UserCreate,
    UserResponse,
    Token,
    UserUpdate,
    VerifyCodeRequest,
    ResendVerificationRequest,
    VerifyEmailResponse,
    MessageResponse,
    ForgotPasswordRequest,
    ValidateResetTokenRequest,
    ValidateResetTokenResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
)
from app.email import (
    send_verification_email,
    send_password_reset_email,
    send_password_reset_confirmation_email,
)

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    code = generate_verification_code()
    expiry = get_verification_expiry()
    hashed_pwd = get_password_hash(user_data.password)

    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        display_name=user_data.display_name,
        gender=user_data.gender,
        birthday=user_data.birthday,
        height_cm=user_data.height_cm,
        target_weight_kg=user_data.target_weight_kg,
        preferred_language=user_data.preferred_language,
        email_confirmed=False,
        verification_code=code,
        verification_code_expires_at=expiry,
        verification_attempts=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send verification email with 6-digit code
    send_verification_email(
        to_email=new_user.email,
        code=code,
        language=new_user.preferred_language,
        is_email_change=False
    )

    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.email_confirmed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_CONFIRMED",
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

def _process_verification(email: str, code: str, db: Session) -> VerifyEmailResponse:
    # Find user by email or pending_email
    user = db.query(User).filter(
        (User.email == email) | (User.pending_email == email)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found or invalid email"
        )

    if user.email_confirmed and not user.pending_email:
        return VerifyEmailResponse(
            message="Email already verified",
            email=user.email,
            email_confirmed=True
        )

    if user.verification_attempts >= MAX_VERIFICATION_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please request a new verification code."
        )

    if not user.verification_code or not user.verification_code_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending verification code found. Please request a new one."
        )

    if user.verification_code_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    if user.verification_code != code:
        user.verification_attempts += 1
        db.commit()
        remaining = MAX_VERIFICATION_ATTEMPTS - user.verification_attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining."
        )

    # Verification successful
    if user.pending_email and (user.pending_email == email or user.email == email):
        user.email = user.pending_email
        user.pending_email = None

    user.email_confirmed = True
    user.verification_code = None
    user.verification_code_expires_at = None
    user.verification_attempts = 0
    db.commit()

    return VerifyEmailResponse(
        message="Email verified successfully",
        email=user.email,
        email_confirmed=True
    )

@router.post("/verify-code", response_model=VerifyEmailResponse)
def verify_code(data: VerifyCodeRequest, db: Session = Depends(get_db)):
    return _process_verification(email=data.email, code=data.code, db=db)

@router.get("/verify-email", response_model=VerifyEmailResponse)
def verify_email(email: str = Query(...), code: str = Query(...), db: Session = Depends(get_db)):
    return _process_verification(email=email, code=code, db=db)

@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == data.email) | (User.pending_email == data.email)
    ).first()

    if not user:
        # Return generic success message to prevent user enumeration
        return MessageResponse(message="If an account exists with this email, a verification code has been sent.")

    if user.email_confirmed and not user.pending_email:
        return MessageResponse(message="Email is already verified.")

    code = generate_verification_code()
    expiry = get_verification_expiry()

    user.verification_code = code
    user.verification_code_expires_at = expiry
    user.verification_attempts = 0
    db.commit()

    target_email = user.pending_email if user.pending_email else user.email
    send_verification_email(
        to_email=target_email,
        code=code,
        language=user.preferred_language,
        is_email_change=bool(user.pending_email)
    )

    return MessageResponse(message="Verification code sent.")

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Anti-enumeration response
        return MessageResponse(
            message="If an account exists with this email, a password reset link and code have been sent."
        )

    token = generate_reset_token()
    code = generate_verification_code()
    expiry = get_reset_token_expiry()

    user.reset_password_token = token
    user.reset_password_code = code
    user.reset_password_expires_at = expiry
    user.reset_password_attempts = 0
    db.commit()

    send_password_reset_email(
        to_email=user.email,
        token=token,
        code=code,
        language=user.preferred_language
    )

    return MessageResponse(
        message="If an account exists with this email, a password reset link and code have been sent."
    )

@router.post("/validate-reset-token", response_model=ValidateResetTokenResponse)
def validate_reset_token(data: ValidateResetTokenRequest, db: Session = Depends(get_db)):
    token_or_code = data.token_or_code.strip()
    if data.email:
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            return ValidateResetTokenResponse(valid=False)
        is_match = (user.reset_password_token == token_or_code) or (user.reset_password_code == token_or_code)
    else:
        user = db.query(User).filter(
            (User.reset_password_token == token_or_code) | (User.reset_password_code == token_or_code)
        ).first()
        is_match = bool(user)

    if not user or not is_match:
        return ValidateResetTokenResponse(valid=False)

    if user.reset_password_attempts >= MAX_RESET_PASSWORD_ATTEMPTS:
        return ValidateResetTokenResponse(valid=False)

    if not user.reset_password_expires_at or user.reset_password_expires_at < datetime.utcnow():
        return ValidateResetTokenResponse(valid=False)

    return ValidateResetTokenResponse(valid=True, email=user.email)

@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_or_code = data.token_or_code.strip()
    if data.email:
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token/code"
            )
        
        if user.reset_password_attempts >= MAX_RESET_PASSWORD_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many failed attempts. Please request a new password reset link."
            )

        if not user.reset_password_expires_at or user.reset_password_expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset link or code has expired. Please request a new one."
            )

        if user.reset_password_token != token_or_code and user.reset_password_code != token_or_code:
            user.reset_password_attempts += 1
            db.commit()
            remaining = MAX_RESET_PASSWORD_ATTEMPTS - user.reset_password_attempts
            if remaining <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Too many failed attempts. Please request a new password reset link."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid reset code or token. {remaining} attempt(s) remaining."
            )
    else:
        user = db.query(User).filter(
            (User.reset_password_token == token_or_code) | (User.reset_password_code == token_or_code)
        ).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token/code"
            )

        if user.reset_password_attempts >= MAX_RESET_PASSWORD_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many failed attempts. Please request a new password reset link."
            )

        if not user.reset_password_expires_at or user.reset_password_expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset link or code has expired. Please request a new one."
            )

    # Update password and clear reset fields
    user.hashed_password = get_password_hash(data.new_password)
    user.email_confirmed = True
    user.reset_password_token = None
    user.reset_password_code = None
    user.reset_password_expires_at = None
    user.reset_password_attempts = 0
    db.commit()

    # Send security notification email
    send_password_reset_confirmation_email(
        to_email=user.email,
        language=user.preferred_language
    )

    # Issue access token for auto-login
    access_token = create_access_token(data={"sub": user.email})
    return ResetPasswordResponse(
        access_token=access_token,
        token_type="bearer",
        message="Password reset successfully"
    )

@router.post("/cancel-email-change", response_model=MessageResponse)
def cancel_email_change(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.pending_email = None
    current_user.verification_code = None
    current_user.verification_code_expires_at = None
    current_user.verification_attempts = 0
    db.commit()
    return MessageResponse(message="Email change cancelled.")

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(profile_data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if email is being changed and if it is unique
    if profile_data.email is not None and profile_data.email != current_user.email:
        existing_email = db.query(User).filter(
            (User.email == profile_data.email) | (User.pending_email == profile_data.email),
            User.id != current_user.id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Store in pending_email and send verification code
        code = generate_verification_code()
        expiry = get_verification_expiry()
        current_user.pending_email = profile_data.email
        current_user.verification_code = code
        current_user.verification_code_expires_at = expiry
        current_user.verification_attempts = 0

        send_verification_email(
            to_email=profile_data.email,
            code=code,
            language=profile_data.preferred_language or current_user.preferred_language,
            is_email_change=True
        )

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
        
        resample_filter = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.ANTIALIAS
        image = image.resize((256, 256), resample_filter)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image file: {str(e)}"
        )

    # 4. Save file to uploads folder
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
