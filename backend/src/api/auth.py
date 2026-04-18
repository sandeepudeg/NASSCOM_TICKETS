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
    token_type: str = "Bearer"
    expires_in: int = 3600

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    # Hardcoded admin credentials for the Intelligence Hub demo
    if credentials.username == "admin" and credentials.password == "admin":
        return {
            "access_token": "mock-access-token-admin",
            "refresh_token": "mock-refresh-token-admin",
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
    if request.refresh_token == "mock-refresh-token-admin":
        return {
            "access_token": "mock-access-token-admin-new",
            "refresh_token": "mock-refresh-token-admin",
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
