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

    def test_basic_pagination(self):
        """Test basic pagination functionality"""
        print("\n🔍 Testing Basic Pagination...")
        
        # Test with page=1&limit=20
        success, response = self.test_get_applications(params={"page": 1, "limit": 20})
        if not success:
            return False, "Failed to get paginated applications"
            
        # Verify response structure
        required_fields = ["applications", "total", "page", "limit", "total_pages"]
        for field in required_fields:
            if field not in response:
                return False, f"Missing field '{field}' in pagination response"
        
        # Verify data types
        if not isinstance(response["applications"], list):
            return False, "Applications should be a list"
        if not isinstance(response["total"], int):
            return False, "Total should be an integer"
        if not isinstance(response["page"], int):
            return False, "Page should be an integer"
        if not isinstance(response["limit"], int):
            return False, "Limit should be an integer"
        if not isinstance(response["total_pages"], int):
            return False, "Total_pages should be an integer"
            
        print(f"✅ Basic pagination working - Total: {response['total']}, Page: {response['page']}, Limit: {response['limit']}, Total Pages: {response['total_pages']}")
        return True, response

    def create_test_applications(self, count=25):
        """Create multiple test applications for pagination testing"""
        print(f"\n🔍 Creating {count} test applications for pagination testing...")
        
        companies = ["TechCorp", "DataSoft", "CloudInc", "DevCorp", "StartupXYZ"]
        job_titles = ["Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer"]
        statuses = ["Applied", "Interviewing", "Offer", "Rejected"]
        
        created_ids = []
        for i in range(count):
            company = companies[i % len(companies)]
            job_title = job_titles[i % len(job_titles)]
            status = statuses[i % len(statuses)]
            
            success, response = self.test_create_application(
                f"{job_title} {i+1}",
                f"{company} {i+1}",
                f"Recruiter {i+1}",
                f"Test application {i+1} for pagination testing"
            )
            if success and 'id' in response:
                created_ids.append(response['id'])
            else:
                print(f"❌ Failed to create test application {i+1}")
                
        print(f"✅ Created {len(created_ids)} test applications")
        return created_ids

    def test_multiple_pages(self):
        """Test pagination across multiple pages"""
        print("\n🔍 Testing Multiple Pages...")
        
        # Create test applications first
        test_app_ids = self.create_test_applications(25)
        
        # Test page 1
        success, page1_response = self.test_get_applications(params={"page": 1, "limit": 20})
        if not success:
            return False, "Failed to get page 1"
            
        # Test page 2
        success, page2_response = self.test_get_applications(params={"page": 2, "limit": 20})
        if not success:
            return False, "Failed to get page 2"
            
        # Verify different applications are returned
        page1_ids = [app['id'] for app in page1_response['applications']]
        page2_ids = [app['id'] for app in page2_response['applications']]
        
        if set(page1_ids) & set(page2_ids):
            return False, "Same applications found on different pages"
            
        # Verify total count is consistent
        if page1_response['total'] != page2_response['total']:
            return False, "Total count inconsistent across pages"
            
        print(f"✅ Multiple pages working - Page 1: {len(page1_response['applications'])} apps, Page 2: {len(page2_response['applications'])} apps")
        
        # Cleanup test applications
        for app_id in test_app_ids:
            self.test_delete_application(app_id)
            
        return True, {"page1": page1_response, "page2": page2_response}

    def test_pagination_with_filters(self):
        """Test pagination combined with filters"""
        print("\n🔍 Testing Pagination with Filters...")
        
        # Create some test applications with specific status
        test_app_ids = []
        for i in range(10):
            success, response = self.test_create_application(
                f"Test Job {i}",
                f"Test Company {i}",
                f"Test Recruiter {i}",
                "Test for pagination with filters"
            )
            if success and 'id' in response:
                test_app_ids.append(response['id'])
        
        # Test pagination with status filter
        success, filtered_response = self.test_get_applications(params={
            "status": "Applied", 
            "page": 1, 
            "limit": 5
        })
        if not success:
            return False, "Failed to get filtered paginated applications"
            
        # Verify response structure
        if "applications" not in filtered_response or "total" not in filtered_response:
            return False, "Missing fields in filtered pagination response"
            
        # Test pagination with search
        success, search_response = self.test_get_applications(params={
            "search": "Test", 
            "page": 1, 
            "limit": 5
        })
        if not success:
            return False, "Failed to get search paginated applications"
            
        print(f"✅ Pagination with filters working - Status filter: {len(filtered_response['applications'])} apps, Search: {len(search_response['applications'])} apps")
        
        # Cleanup
        for app_id in test_app_ids:
            self.test_delete_application(app_id)
            
        return True, {"filtered": filtered_response, "search": search_response}

    def test_pagination_edge_cases(self):
        """Test pagination edge cases"""
        print("\n🔍 Testing Pagination Edge Cases...")
        
        # Test with no applications (empty database scenario)
        # First, let's get current count and test with high page number
        success, current_response = self.test_get_applications(params={"page": 1, "limit": 20})
        if not success:
            return False, "Failed to get current applications"
            
        # Test invalid page numbers
        success, zero_page = self.test_get_applications(params={"page": 0, "limit": 20})
        if not success:
            return False, "Failed to test page=0"
            
        success, high_page = self.test_get_applications(params={"page": 999, "limit": 20})
        if not success:
            return False, "Failed to test page=999"
            
        # Test without pagination params (should default)
        success, default_response = self.test_get_applications()
        if not success:
            return False, "Failed to test default pagination"
            
        # Verify defaults
        if default_response.get("page") != 1 or default_response.get("limit") != 20:
            return False, f"Default pagination incorrect - page: {default_response.get('page')}, limit: {default_response.get('limit')}"
            
        print(f"✅ Edge cases working - Default page: {default_response['page']}, Default limit: {default_response['limit']}")
        return True, {"default": default_response, "high_page": high_page}

    def test_existing_crud_operations(self):
        """Test all existing CRUD operations"""
        print("\n🔍 Testing Existing CRUD Operations...")
        
        # Test POST - Create
        success, new_app = self.test_create_application(
            "CRUD Test Job",
            "CRUD Test Company", 
            "CRUD Test Recruiter",
            "Testing CRUD operations"
        )
        if not success:
            return False, "POST /api/applications failed"
            
        app_id = new_app.get('id')
        if not app_id:
            return False, "No ID returned from POST"
            
        # Test GET single - Read
        success, get_app = self.test_get_application_by_id(app_id)
        if not success:
            return False, f"GET /api/applications/{app_id} failed"
            
        # Test PUT - Update
        update_data = {
            "status": "Interviewing",
            "notes": "Updated for CRUD testing"
        }
        success, updated_app = self.test_update_application(app_id, update_data)
        if not success:
            return False, f"PUT /api/applications/{app_id} failed"
            
        # Verify update worked
        if updated_app.get('status') != 'Interviewing':
            return False, "Update did not change status"
            
        # Test DELETE
        success, _ = self.test_delete_application(app_id)
        if not success:
            return False, f"DELETE /api/applications/{app_id} failed"
            
        # Test GET stats
        success, stats = self.test_get_stats()
        if not success:
            return False, "GET /api/applications/stats/summary failed"
            
        print("✅ All CRUD operations working correctly")
        return True, {"created": new_app, "updated": updated_app, "stats": stats}

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