from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str
    tenant: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    role: str
    user_id: str
    token_type: str = "Bearer"
    expires_in: int = 3600

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    username = credentials.username
    password = credentials.password
    
    # 1. Check for 'admin'
    is_admin = username == "admin" and password == "admin"
    
    # 2. Check for 'User1' through 'User10' (case-insensitive) where password matches username
    username_lower = username.lower()
    is_demo_user = (
        username_lower.startswith("user") 
        and username_lower[4:].isdigit() 
        and 1 <= int(username_lower[4:]) <= 10 
        and username_lower == password.lower()
    )
    
    if is_admin or is_demo_user:
        role = "admin" if is_admin else "user"
        return {
            "access_token": f"mock-access-token-{username}",
            "refresh_token": f"mock-refresh-token-{username}",
            "role": role,
            "user_id": username,
            "token_type": "Bearer",
            "expires_in": 3600
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

@router.post("/refresh", response_model=LoginResponse)
async def refresh(request: RefreshRequest):
    if request.refresh_token.startswith("mock-refresh-token-"):
        username = request.refresh_token.replace("mock-refresh-token-", "")
        return {
            "access_token": f"mock-access-token-{username}-new",
            "refresh_token": f"mock-refresh-token-{username}",
            "token_type": "Bearer",
            "expires_in": 3600
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
    )

@router.post("/logout")
async def logout():
    return {"status": "success", "message": "Logged out"}
