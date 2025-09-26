#!/usr/bin/env python3
"""
Prime Real Estate Backend API Testing Suite
Tests all backend API endpoints for property management and admin authentication
"""

import requests
import json
import sys
import os
import io
from datetime import datetime
from PIL import Image

# Get backend URL from frontend .env file
BACKEND_URL = "https://prime-listings-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Admin credentials
ADMIN_EMAIL = "admin@primerealestate.com"
ADMIN_PASSWORD = "admin123"

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

def log_test(test_name, success, message=""):
    """Log test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {test_name}")
    if message:
        print(f"   {message}")
    
    if success:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1
        test_results["errors"].append(f"{test_name}: {message}")

def test_root_endpoint():
    """Test root endpoint - Note: In production, root serves frontend HTML"""
    try:
        response = requests.get(f"{BACKEND_URL}/")
        if response.status_code == 200:
            # In production setup, root endpoint serves frontend HTML, not backend JSON
            if "html" in response.headers.get("content-type", "").lower():
                log_test("Root Endpoint (Frontend)", True, "Root endpoint correctly serves frontend HTML")
                return True
            else:
                # If it's JSON, check for backend response
                data = response.json()
                if "Prime Real Estate API" in data.get("message", ""):
                    log_test("Root Endpoint (Backend)", True, f"Response: {data}")
                    return True
                else:
                    log_test("Root Endpoint", False, f"Unexpected response: {data}")
                    return False
        else:
            log_test("Root Endpoint", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Root Endpoint", False, f"Exception: {str(e)}")
        return False

def test_admin_login():
    """Test admin login and return token"""
    try:
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = requests.post(f"{API_BASE}/admin/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "email" in data:
                log_test("Admin Login", True, f"Token received for {data['email']}")
                return data["token"]
            else:
                log_test("Admin Login", False, f"Missing token or email in response: {data}")
                return None
        else:
            log_test("Admin Login", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        log_test("Admin Login", False, f"Exception: {str(e)}")
        return None

def test_admin_login_invalid_credentials():
    """Test admin login with invalid credentials"""
    try:
        login_data = {
            "email": "wrong@email.com",
            "password": "wrongpassword"
        }
        
        response = requests.post(f"{API_BASE}/admin/login", json=login_data)
        
        if response.status_code == 401:
            log_test("Admin Login - Invalid Credentials", True, "Correctly rejected invalid credentials")
            return True
        else:
            log_test("Admin Login - Invalid Credentials", False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        log_test("Admin Login - Invalid Credentials", False, f"Exception: {str(e)}")
        return False

def test_admin_verify(token):
    """Test admin token verification"""
    if not token:
        log_test("Admin Token Verification", False, "No token available")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE}/admin/verify", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("email") == ADMIN_EMAIL and data.get("valid") == True:
                log_test("Admin Token Verification", True, f"Token verified for {data['email']}")
                return True
            else:
                log_test("Admin Token Verification", False, f"Unexpected response: {data}")
                return False
        else:
            log_test("Admin Token Verification", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Admin Token Verification", False, f"Exception: {str(e)}")
        return False

def test_get_properties_empty():
    """Test getting properties when database is empty"""
    try:
        response = requests.get(f"{API_BASE}/properties")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get Properties (Empty)", True, f"Returned {len(data)} properties")
                return True
            else:
                log_test("Get Properties (Empty)", False, f"Expected list, got: {type(data)}")
                return False
        else:
            log_test("Get Properties (Empty)", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Get Properties (Empty)", False, f"Exception: {str(e)}")
        return False

def create_test_property(token):
    """Create a test property and return its ID"""
    if not token:
        log_test("Create Property", False, "No admin token available")
        return None
    
    try:
        property_data = {
            "title": "Luxury Downtown Penthouse",
            "description": "Stunning penthouse apartment with panoramic city views, featuring modern amenities and premium finishes throughout. Perfect for executive living.",
            "price": 850000.0,
            "location": "Downtown Seattle, WA",
            "bedrooms": 3,
            "bathrooms": 2,
            "square_footage": 2200,
            "property_type": "apartment",
            "status": "for_sale",
            "amenities": [
                "City Views",
                "Hardwood Floors", 
                "Granite Countertops",
                "Stainless Steel Appliances",
                "In-Unit Laundry",
                "Balcony",
                "Parking Garage",
                "Gym Access"
            ],
            "images": [
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
                "https://images.unsplash.com/photo-1560449752-2dd9b55c3d0e?w=800",
                "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800"
            ]
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{API_BASE}/properties", json=property_data, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and data["title"] == property_data["title"]:
                log_test("Create Property", True, f"Created property with ID: {data['id']}")
                return data["id"]
            else:
                log_test("Create Property", False, f"Unexpected response structure: {data}")
                return None
        else:
            log_test("Create Property", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        log_test("Create Property", False, f"Exception: {str(e)}")
        return None

def test_create_property_without_auth():
    """Test creating property without authentication"""
    try:
        property_data = {
            "title": "Unauthorized Property",
            "description": "This should fail",
            "price": 100000.0,
            "location": "Nowhere",
            "bedrooms": 1,
            "bathrooms": 1,
            "square_footage": 500,
            "property_type": "house",
            "status": "for_sale"
        }
        
        response = requests.post(f"{API_BASE}/properties", json=property_data)
        
        if response.status_code == 403 or response.status_code == 401:
            log_test("Create Property - No Auth", True, "Correctly rejected unauthorized request")
            return True
        else:
            log_test("Create Property - No Auth", False, f"Expected 401/403, got {response.status_code}")
            return False
    except Exception as e:
        log_test("Create Property - No Auth", False, f"Exception: {str(e)}")
        return False

def test_get_properties_with_data():
    """Test getting properties after creating one"""
    try:
        response = requests.get(f"{API_BASE}/properties")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                property_item = data[0]
                required_fields = ["id", "title", "description", "price", "location", "bedrooms", "bathrooms"]
                missing_fields = [field for field in required_fields if field not in property_item]
                
                if not missing_fields:
                    log_test("Get Properties (With Data)", True, f"Retrieved {len(data)} properties with all required fields")
                    return True
                else:
                    log_test("Get Properties (With Data)", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                log_test("Get Properties (With Data)", False, f"Expected non-empty list, got: {len(data) if isinstance(data, list) else type(data)}")
                return False
        else:
            log_test("Get Properties (With Data)", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Get Properties (With Data)", False, f"Exception: {str(e)}")
        return False

def test_get_single_property(property_id):
    """Test getting a single property by ID"""
    if not property_id:
        log_test("Get Single Property", False, "No property ID available")
        return False
    
    try:
        response = requests.get(f"{API_BASE}/properties/{property_id}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("id") == property_id:
                log_test("Get Single Property", True, f"Retrieved property: {data.get('title', 'Unknown')}")
                return True
            else:
                log_test("Get Single Property", False, f"ID mismatch: expected {property_id}, got {data.get('id')}")
                return False
        else:
            log_test("Get Single Property", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Get Single Property", False, f"Exception: {str(e)}")
        return False

def test_get_nonexistent_property():
    """Test getting a property that doesn't exist"""
    try:
        fake_id = "nonexistent-property-id"
        response = requests.get(f"{API_BASE}/properties/{fake_id}")
        
        if response.status_code == 404:
            log_test("Get Nonexistent Property", True, "Correctly returned 404 for nonexistent property")
            return True
        else:
            log_test("Get Nonexistent Property", False, f"Expected 404, got {response.status_code}")
            return False
    except Exception as e:
        log_test("Get Nonexistent Property", False, f"Exception: {str(e)}")
        return False

def test_update_property(property_id, token):
    """Test updating a property"""
    if not property_id or not token:
        log_test("Update Property", False, "Missing property ID or token")
        return False
    
    try:
        update_data = {
            "price": 875000.0,
            "description": "Updated: Stunning penthouse apartment with panoramic city views, recently renovated with premium finishes throughout.",
            "amenities": [
                "City Views",
                "Hardwood Floors", 
                "Granite Countertops",
                "Stainless Steel Appliances",
                "In-Unit Laundry",
                "Balcony",
                "Parking Garage",
                "Gym Access",
                "Rooftop Terrace"
            ]
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.put(f"{API_BASE}/properties/{property_id}", json=update_data, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("price") == update_data["price"] and "Updated:" in data.get("description", ""):
                log_test("Update Property", True, f"Successfully updated property price to ${data.get('price')}")
                return True
            else:
                log_test("Update Property", False, f"Update not reflected in response: {data}")
                return False
        else:
            log_test("Update Property", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Update Property", False, f"Exception: {str(e)}")
        return False

def test_update_property_without_auth(property_id):
    """Test updating property without authentication"""
    if not property_id:
        log_test("Update Property - No Auth", False, "No property ID available")
        return False
    
    try:
        update_data = {"price": 999999.0}
        response = requests.put(f"{API_BASE}/properties/{property_id}", json=update_data)
        
        if response.status_code == 403 or response.status_code == 401:
            log_test("Update Property - No Auth", True, "Correctly rejected unauthorized update")
            return True
        else:
            log_test("Update Property - No Auth", False, f"Expected 401/403, got {response.status_code}")
            return False
    except Exception as e:
        log_test("Update Property - No Auth", False, f"Exception: {str(e)}")
        return False

def test_delete_property_without_auth(property_id):
    """Test deleting property without authentication"""
    if not property_id:
        log_test("Delete Property - No Auth", False, "No property ID available")
        return False
    
    try:
        response = requests.delete(f"{API_BASE}/properties/{property_id}")
        
        if response.status_code == 403 or response.status_code == 401:
            log_test("Delete Property - No Auth", True, "Correctly rejected unauthorized delete")
            return True
        else:
            log_test("Delete Property - No Auth", False, f"Expected 401/403, got {response.status_code}")
            return False
    except Exception as e:
        log_test("Delete Property - No Auth", False, f"Exception: {str(e)}")
        return False

def test_delete_property(property_id, token):
    """Test deleting a property"""
    if not property_id or not token:
        log_test("Delete Property", False, "Missing property ID or token")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.delete(f"{API_BASE}/properties/{property_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "deleted successfully" in data.get("message", "").lower():
                log_test("Delete Property", True, f"Successfully deleted property {property_id}")
                return True
            else:
                log_test("Delete Property", False, f"Unexpected response: {data}")
                return False
        else:
            log_test("Delete Property", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Delete Property", False, f"Exception: {str(e)}")
        return False

def test_delete_nonexistent_property(token):
    """Test deleting a property that doesn't exist"""
    if not token:
        log_test("Delete Nonexistent Property", False, "No admin token available")
        return False
    
    try:
        fake_id = "nonexistent-property-id"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.delete(f"{API_BASE}/properties/{fake_id}", headers=headers)
        
        if response.status_code == 404:
            log_test("Delete Nonexistent Property", True, "Correctly returned 404 for nonexistent property")
            return True
        else:
            log_test("Delete Nonexistent Property", False, f"Expected 404, got {response.status_code}")
            return False
    except Exception as e:
        log_test("Delete Nonexistent Property", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("PRIME REAL ESTATE BACKEND API TESTING")
    print("=" * 60)
    print(f"Testing backend at: {BACKEND_URL}")
    print(f"API base URL: {API_BASE}")
    print()
    
    # Test 1: Root endpoint
    test_root_endpoint()
    
    # Test 2: Admin authentication
    print("\n--- ADMIN AUTHENTICATION TESTS ---")
    token = test_admin_login()
    test_admin_login_invalid_credentials()
    test_admin_verify(token)
    
    # Test 3: Property management (empty state)
    print("\n--- PROPERTY MANAGEMENT TESTS (EMPTY STATE) ---")
    test_get_properties_empty()
    test_get_nonexistent_property()
    
    # Test 4: Property creation
    print("\n--- PROPERTY CREATION TESTS ---")
    test_create_property_without_auth()
    property_id = create_test_property(token)
    
    # Test 5: Property retrieval (with data)
    print("\n--- PROPERTY RETRIEVAL TESTS (WITH DATA) ---")
    test_get_properties_with_data()
    test_get_single_property(property_id)
    
    # Test 6: Property updates
    print("\n--- PROPERTY UPDATE TESTS ---")
    test_update_property_without_auth(property_id)
    test_update_property(property_id, token)
    
    # Test 7: Property deletion
    print("\n--- PROPERTY DELETION TESTS ---")
    test_delete_property_without_auth(property_id)
    test_delete_nonexistent_property(token)
    test_delete_property(property_id, token)
    
    # Final results
    print("\n" + "=" * 60)
    print("TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"✅ PASSED: {test_results['passed']}")
    print(f"❌ FAILED: {test_results['failed']}")
    print(f"📊 TOTAL:  {test_results['passed'] + test_results['failed']}")
    
    if test_results['failed'] > 0:
        print(f"\n🚨 FAILED TESTS:")
        for error in test_results['errors']:
            print(f"   • {error}")
        return False
    else:
        print(f"\n🎉 ALL TESTS PASSED!")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)