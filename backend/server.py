from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import os
import jwt
import uuid
import shutil
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

# Initialize FastAPI app
app = FastAPI(title="Prime Real Estate API", version="1.0.0")

# Create uploads directory
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.prime_real_estate

# JWT Configuration
JWT_SECRET = "prime-real-estate-secret-key-2024"
JWT_ALGORITHM = "HS256"
security = HTTPBearer()

# Company admin email
ADMIN_EMAIL = "admin@primerealestate.com"
ADMIN_PASSWORD = "admin123"

# Pydantic Models
class Property(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    price: float
    location: str
    bedrooms: int
    bathrooms: int
    square_footage: int
    property_type: str  # house, apartment, condo, etc.
    status: str  # for_sale, for_rent, sold, rented
    amenities: List[str] = []
    images: List[str] = []
    created_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PropertyCreate(BaseModel):
    title: str
    description: str
    price: float
    location: str
    bedrooms: int
    bathrooms: int
    square_footage: int
    property_type: str
    status: str
    amenities: List[str] = []
    images: List[str] = []

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    location: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    square_footage: Optional[int] = None
    property_type: Optional[str] = None
    status: Optional[str] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminResponse(BaseModel):
    email: str
    token: str

# Helper functions
def prepare_for_mongo(data: dict) -> dict:
    """Prepare data for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item: dict) -> dict:
    """Parse data from MongoDB"""
    if item and '_id' in item:
        del item['_id']
    return item

def create_jwt_token(email: str) -> str:
    """Create JWT token for admin"""
    payload = {
        "email": email,
        "exp": datetime.now(timezone.utc).timestamp() + 86400  # 24 hours
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify admin JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("email")
        if email != ADMIN_EMAIL:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# Routes

@app.get("/")
async def read_root():
    return {"message": "Prime Real Estate API", "version": "1.0.0"}

@app.post("/api/admin/login", response_model=AdminResponse)
async def admin_login(admin_data: AdminLogin):
    """Admin login endpoint"""
    if admin_data.email != ADMIN_EMAIL or admin_data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    token = create_jwt_token(admin_data.email)
    return AdminResponse(email=admin_data.email, token=token)

@app.get("/api/properties", response_model=List[Property])
async def get_properties():
    """Get all properties (public endpoint)"""
    try:
        properties = await db.properties.find().to_list(length=None)
        return [Property(**parse_from_mongo(prop)) for prop in properties]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching properties: {str(e)}")

@app.get("/api/properties/{property_id}", response_model=Property)
async def get_property(property_id: str):
    """Get single property by ID (public endpoint)"""
    try:
        property_data = await db.properties.find_one({"id": property_id})
        if not property_data:
            raise HTTPException(status_code=404, detail="Property not found")
        return Property(**parse_from_mongo(property_data))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching property: {str(e)}")

@app.post("/api/properties", response_model=Property)
async def create_property(property_data: PropertyCreate, admin_email: str = Depends(verify_admin_token)):
    """Create new property (admin only)"""
    try:
        new_property = Property(**property_data.dict())
        property_dict = prepare_for_mongo(new_property.dict())
        
        await db.properties.insert_one(property_dict)
        return new_property
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating property: {str(e)}")

@app.put("/api/properties/{property_id}", response_model=Property)
async def update_property(property_id: str, property_data: PropertyUpdate, admin_email: str = Depends(verify_admin_token)):
    """Update property (admin only)"""
    try:
        # Check if property exists
        existing_property = await db.properties.find_one({"id": property_id})
        if not existing_property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Prepare update data
        update_data = {k: v for k, v in property_data.dict().items() if v is not None}
        update_data["updated_date"] = datetime.now(timezone.utc).isoformat()
        
        # Update in database
        await db.properties.update_one({"id": property_id}, {"$set": prepare_for_mongo(update_data)})
        
        # Get updated property
        updated_property = await db.properties.find_one({"id": property_id})
        return Property(**parse_from_mongo(updated_property))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating property: {str(e)}")

@app.delete("/api/properties/{property_id}")
async def delete_property(property_id: str, admin_email: str = Depends(verify_admin_token)):
    """Delete property (admin only)"""
    try:
        result = await db.properties.delete_one({"id": property_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Property not found")
        return {"message": "Property deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting property: {str(e)}")

@app.get("/api/admin/verify")
async def verify_admin(admin_email: str = Depends(verify_admin_token)):
    """Verify admin token"""
    return {"email": admin_email, "valid": True}

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...), admin_email: str = Depends(verify_admin_token)):
    """Upload image file for property"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the URL to access the uploaded file
        file_url = f"/uploads/{unique_filename}"
        return {"url": file_url, "filename": unique_filename}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.delete("/api/upload/{filename}")
async def delete_uploaded_image(filename: str, admin_email: str = Depends(verify_admin_token)):
    """Delete uploaded image file"""
    try:
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            file_path.unlink()
            return {"message": "File deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)