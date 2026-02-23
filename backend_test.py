#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime
from typing import Dict, Optional

class MindHireAPITester:
    def __init__(self, base_url="https://talent-assess-ai-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.interview_id = None
        self.question_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, auth_required: bool = True) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            return False, {}

    def test_user_registration(self) -> bool:
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}",
            "role": "candidate"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data,
            auth_required=False
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   ✅ Token received: {self.token[:20]}...")
            print(f"   ✅ User ID: {self.user_id}")
            return True
        return False

    def test_user_login(self) -> bool:
        """Test user login with existing credentials"""
        # First register a user
        timestamp = datetime.now().strftime('%H%M%S')
        email = f"login_test_{timestamp}@example.com"
        password = "LoginTest123!"
        
        # Register
        register_data = {
            "email": email,
            "password": password,
            "name": f"Login Test {timestamp}",
            "role": "candidate"
        }
        
        success, _ = self.run_test(
            "User Registration for Login Test",
            "POST",
            "auth/register",
            200,
            data=register_data,
            auth_required=False
        )
        
        if not success:
            return False
        
        # Now test login
        login_data = {
            "email": email,
            "password": password
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data,
            auth_required=False
        )
        
        if success and 'access_token' in response:
            print(f"   ✅ Login successful with token")
            return True
        return False

    def test_get_current_user(self) -> bool:
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success and 'email' in response:
            print(f"   ✅ User info retrieved: {response.get('name', 'Unknown')}")
            return True
        return False

    def test_dashboard_stats(self) -> bool:
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            print(f"   ✅ Stats: Total={response.get('total_interviews', 0)}, Completed={response.get('completed_interviews', 0)}")
            return True
        return False

    def test_create_interview(self) -> bool:
        """Test creating a new interview"""
        success, response = self.run_test(
            "Create Interview",
            "POST",
            "interviews",
            200
        )
        
        if success and 'id' in response:
            self.interview_id = response['id']
            print(f"   ✅ Interview created: {self.interview_id}")
            return True
        return False

    def test_get_interviews(self) -> bool:
        """Test getting user interviews"""
        success, response = self.run_test(
            "Get Interviews",
            "GET",
            "interviews",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} interview(s)")
            return True
        return False

    def test_get_next_question(self) -> bool:
        """Test getting next question for interview"""
        if not self.interview_id:
            print("❌ No interview ID available")
            return False
            
        success, response = self.run_test(
            "Get Next Question",
            "GET",
            f"interviews/{self.interview_id}/next-question",
            200
        )
        
        if success and 'question_text' in response:
            self.question_id = response['id']
            print(f"   ✅ Question generated: {response['question_text'][:50]}...")
            print(f"   ✅ Question ID: {self.question_id}")
            return True
        return False

    def test_submit_answer(self) -> bool:
        """Test submitting an answer"""
        if not self.interview_id or not self.question_id:
            print("❌ Missing interview_id or question_id")
            return False
            
        answer_data = {
            "question_id": self.question_id,
            "answer_text": "This is a comprehensive test answer that demonstrates technical knowledge, clear communication, and problem-solving skills. I would approach this problem by first analyzing the requirements, then designing an efficient algorithm, implementing it with proper error handling, and testing thoroughly to ensure correctness."
        }
        
        success, response = self.run_test(
            "Submit Answer",
            "POST",
            f"interviews/{self.interview_id}/answers",
            200,
            data=answer_data
        )
        
        if success and 'id' in response:
            print(f"   ✅ Answer submitted successfully")
            return True
        return False

    def test_multiple_questions_and_answers(self) -> bool:
        """Test completing multiple questions to finish interview"""
        if not self.interview_id:
            print("❌ No interview ID available")
            return False
            
        # Submit 4 more answers to complete the interview (we already did 1)
        for i in range(2, 6):  # Questions 2-5
            print(f"\n--- Processing Question {i} ---")
            
            # Get next question
            success, response = self.run_test(
                f"Get Question {i}",
                "GET",
                f"interviews/{self.interview_id}/next-question",
                200
            )
            
            if not success or 'id' not in response:
                print(f"❌ Failed to get question {i}")
                return False
                
            question_id = response['id']
            print(f"   ✅ Question {i} generated: {response['question_text'][:50]}...")
            
            # Submit answer
            answer_data = {
                "question_id": question_id,
                "answer_text": f"Answer {i}: This is a detailed response that covers the key concepts, provides examples, and demonstrates my understanding of the topic. I approach this systematically and consider edge cases."
            }
            
            success, response = self.run_test(
                f"Submit Answer {i}",
                "POST",
                f"interviews/{self.interview_id}/answers",
                200,
                data=answer_data
            )
            
            if not success:
                print(f"❌ Failed to submit answer {i}")
                return False
                
            print(f"   ✅ Answer {i} submitted successfully")
            
            # Small delay between questions
            time.sleep(1)
        
        return True

    def test_evaluate_interview(self) -> bool:
        """Test evaluating a completed interview"""
        if not self.interview_id:
            print("❌ No interview ID available")
            return False
            
        success, response = self.run_test(
            "Evaluate Interview",
            "POST",
            f"interviews/{self.interview_id}/evaluate",
            200
        )
        
        if success and 'overall_score' in response:
            print(f"   ✅ Evaluation completed:")
            print(f"      Overall Score: {response.get('overall_score', 0)}")
            print(f"      Technical: {response.get('technical_score', 0)}")
            print(f"      Communication: {response.get('communication_score', 0)}")
            print(f"      Emotional Stability: {response.get('emotional_stability_score', 0)}")
            return True
        return False

    def test_get_evaluation(self) -> bool:
        """Test retrieving evaluation results"""
        if not self.interview_id:
            print("❌ No interview ID available")
            return False
            
        success, response = self.run_test(
            "Get Evaluation",
            "GET",
            f"interviews/{self.interview_id}/evaluation",
            200
        )
        
        if success and 'overall_score' in response:
            print(f"   ✅ Evaluation retrieved successfully")
            return True
        return False

    def test_download_report(self) -> bool:
        """Test downloading PDF report"""
        if not self.interview_id:
            print("❌ No interview ID available")
            return False
            
        url = f"{self.base_url}/api/interviews/{self.interview_id}/report"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing Download Report...")
        
        try:
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200 and response.headers.get('content-type') == 'application/pdf':
                self.tests_passed += 1
                print(f"✅ PASSED - PDF report downloaded ({len(response.content)} bytes)")
                return True
            else:
                print(f"❌ FAILED - Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}")
                return False
                
        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            return False

def main():
    """Main test execution"""
    print("🚀 Starting MindHire AI API Testing")
    print("=" * 60)
    
    tester = MindHireAPITester()
    
    # Test sequence
    tests = [
        ("Registration", tester.test_user_registration),
        ("Login", tester.test_user_login),
        ("Get Current User", tester.test_get_current_user),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Create Interview", tester.test_create_interview),
        ("Get Interviews", tester.test_get_interviews),
        ("Get Next Question", tester.test_get_next_question),
        ("Submit First Answer", tester.test_submit_answer),
        ("Complete Interview (Questions 2-5)", tester.test_multiple_questions_and_answers),
        ("Evaluate Interview", tester.test_evaluate_interview),
        ("Get Evaluation", tester.test_get_evaluation),
        ("Download Report", tester.test_download_report)
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            if not test_func():
                failed_tests.append(test_name)
                print(f"❌ {test_name} FAILED")
            else:
                print(f"✅ {test_name} PASSED")
        except Exception as e:
            failed_tests.append(test_name)
            print(f"❌ {test_name} FAILED with exception: {str(e)}")
    
    # Final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"  - {test}")
    else:
        print(f"\n🎉 All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())