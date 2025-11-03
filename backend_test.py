import requests
import sys
from datetime import datetime, date
import json

class JobApplicationAPITester:
    def __init__(self, base_url="https://edit-enhance-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_app_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if method == 'POST' and 'id' in response_data:
                        self.created_app_ids.append(response_data['id'])
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_create_application(self, job_title, company_name, recruiter_name="", notes=""):
        """Test creating a new application"""
        data = {
            "job_title": job_title,
            "company_name": company_name,
            "recruiter_name": recruiter_name,
            "application_date": date.today().isoformat(),
            "status": "Applied",
            "progress": "In Progress",
            "notes": notes
        }
        return self.run_test("Create Application", "POST", "api/applications", 200, data=data)

    def test_get_applications(self, params=None):
        """Test getting all applications"""
        return self.run_test("Get All Applications", "GET", "api/applications", 200, params=params)

    def test_get_application_by_id(self, app_id):
        """Test getting a specific application"""
        return self.run_test("Get Application by ID", "GET", f"api/applications/{app_id}", 200)

    def test_update_application(self, app_id, update_data):
        """Test updating an application"""
        return self.run_test("Update Application", "PUT", f"api/applications/{app_id}", 200, data=update_data)

    def test_delete_application(self, app_id):
        """Test deleting an application"""
        return self.run_test("Delete Application", "DELETE", f"api/applications/{app_id}", 200)

    def test_get_stats(self):
        """Test getting application statistics"""
        return self.run_test("Get Statistics", "GET", "api/applications/stats/summary", 200)

    def test_search_functionality(self):
        """Test search functionality"""
        print("\n🔍 Testing Search Functionality...")
        
        # Search by job title
        success, _ = self.test_get_applications(params={"search": "Software"})
        if not success:
            return False
            
        # Search by company
        success, _ = self.test_get_applications(params={"search": "TechCorp"})
        if not success:
            return False
            
        return True

    def test_filter_functionality(self):
        """Test filter functionality"""
        print("\n🔍 Testing Filter Functionality...")
        
        # Filter by status
        success, _ = self.test_get_applications(params={"status": "Applied"})
        if not success:
            return False
            
        # Filter by progress
        success, _ = self.test_get_applications(params={"progress": "In Progress"})
        if not success:
            return False
            
        return True

def main():
    print("🚀 Starting Job Application Tracker API Tests")
    print("=" * 60)
    
    tester = JobApplicationAPITester()
    
    # Test 1: Root endpoint
    success, _ = tester.test_root_endpoint()
    if not success:
        print("❌ Root endpoint failed, stopping tests")
        return 1

    # Test 2: Get initial stats
    success, initial_stats = tester.test_get_stats()
    if success:
        print(f"   Initial stats: {initial_stats}")

    # Test 3: Get existing applications
    success, existing_apps = tester.test_get_applications()
    if success:
        print(f"   Found {len(existing_apps)} existing applications")

    # Test 4: Create new application
    success, new_app = tester.test_create_application(
        "Frontend Developer", 
        "TechCorp Inc", 
        "Sarah Johnson",
        "Applied via company website"
    )
    if not success:
        print("❌ Application creation failed")
        return 1

    # Test 5: Get application by ID
    if tester.created_app_ids:
        app_id = tester.created_app_ids[0]
        success, _ = tester.test_get_application_by_id(app_id)
        if not success:
            print("❌ Get application by ID failed")
            return 1

        # Test 6: Update application
        update_data = {"status": "Interviewing"}
        success, _ = tester.test_update_application(app_id, update_data)
        if not success:
            print("❌ Update application failed")
            return 1

    # Test 7: Search functionality
    if not tester.test_search_functionality():
        print("❌ Search functionality failed")
        return 1

    # Test 8: Filter functionality
    if not tester.test_filter_functionality():
        print("❌ Filter functionality failed")
        return 1

    # Test 9: Get updated stats
    success, final_stats = tester.test_get_stats()
    if success:
        print(f"   Final stats: {final_stats}")

    # Test 10: Delete created application (cleanup)
    if tester.created_app_ids:
        app_id = tester.created_app_ids[0]
        success, _ = tester.test_delete_application(app_id)
        if not success:
            print("❌ Delete application failed")
            return 1

    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Backend API Tests Summary:")
    print(f"   Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("✅ All backend tests passed! API is working correctly.")
        return 0
    else:
        print("❌ Some backend tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())