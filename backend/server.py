from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone

from models import (
    User, UserCreate, UserLogin, Token, Interview, InterviewStatus,
    Question, Answer, AnswerCreate, Evaluation, InterviewWithDetails
)
from auth_service import (
    hash_password, verify_password, create_access_token, get_current_user_id
)
from ai_service import AIService
from report_service import ReportService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
ai_service = AIService()
report_service = ReportService()

# Create the main app without a prefix
app = FastAPI(title="MindHire AI API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    
    # Store user with hashed password
    user_doc = user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    user_doc['hashed_password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user"""
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(credentials.password, user_doc['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert datetime
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """Get current user info"""
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# ==================== INTERVIEW ROUTES ====================

@api_router.post("/interviews", response_model=Interview)
async def create_interview(user_id: str = Depends(get_current_user_id)):
    """Start a new interview"""
    interview = Interview(user_id=user_id, total_questions=5)
    
    interview_doc = interview.model_dump()
    interview_doc['started_at'] = interview_doc['started_at'].isoformat()
    
    await db.interviews.insert_one(interview_doc)
    
    return interview

@api_router.get("/interviews", response_model=List[InterviewWithDetails])
async def get_interviews(user_id: str = Depends(get_current_user_id)):
    """Get all interviews for current user"""
    interviews = await db.interviews.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    result = []
    for interview_doc in interviews:
        # Convert datetime strings
        if isinstance(interview_doc['started_at'], str):
            interview_doc['started_at'] = datetime.fromisoformat(interview_doc['started_at'])
        if interview_doc.get('completed_at') and isinstance(interview_doc['completed_at'], str):
            interview_doc['completed_at'] = datetime.fromisoformat(interview_doc['completed_at'])
        
        interview = Interview(**interview_doc)
        
        # Count answered questions
        questions_count = await db.answers.count_documents({"interview_id": interview.id})
        
        # Get evaluation if exists
        eval_doc = await db.evaluations.find_one({"interview_id": interview.id}, {"_id": 0})
        evaluation = None
        if eval_doc:
            if isinstance(eval_doc['evaluated_at'], str):
                eval_doc['evaluated_at'] = datetime.fromisoformat(eval_doc['evaluated_at'])
            evaluation = Evaluation(**eval_doc)
        
        result.append(InterviewWithDetails(
            interview=interview,
            questions_answered=questions_count,
            evaluation=evaluation
        ))
    
    return result

@api_router.get("/interviews/{interview_id}", response_model=InterviewWithDetails)
async def get_interview(interview_id: str, user_id: str = Depends(get_current_user_id)):
    """Get specific interview details"""
    interview_doc = await db.interviews.find_one({"id": interview_id, "user_id": user_id}, {"_id": 0})
    if not interview_doc:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if isinstance(interview_doc['started_at'], str):
        interview_doc['started_at'] = datetime.fromisoformat(interview_doc['started_at'])
    if interview_doc.get('completed_at') and isinstance(interview_doc['completed_at'], str):
        interview_doc['completed_at'] = datetime.fromisoformat(interview_doc['completed_at'])
    
    interview = Interview(**interview_doc)
    
    questions_count = await db.answers.count_documents({"interview_id": interview.id})
    
    eval_doc = await db.evaluations.find_one({"interview_id": interview.id}, {"_id": 0})
    evaluation = None
    if eval_doc:
        if isinstance(eval_doc['evaluated_at'], str):
            eval_doc['evaluated_at'] = datetime.fromisoformat(eval_doc['evaluated_at'])
        evaluation = Evaluation(**eval_doc)
    
    return InterviewWithDetails(
        interview=interview,
        questions_answered=questions_count,
        evaluation=evaluation
    )

# ==================== QUESTION ROUTES ====================

@api_router.get("/interviews/{interview_id}/next-question", response_model=Question)
async def get_next_question(interview_id: str, user_id: str = Depends(get_current_user_id)):
    """Get the next question for the interview"""
    interview_doc = await db.interviews.find_one({"id": interview_id, "user_id": user_id}, {"_id": 0})
    if not interview_doc:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    interview = Interview(**interview_doc)
    
    if interview.status == InterviewStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Interview already completed")
    
    # Check if question already exists
    next_question_num = interview.current_question_number + 1
    existing_question = await db.questions.find_one(
        {"interview_id": interview_id, "question_number": next_question_num},
        {"_id": 0}
    )
    
    if existing_question:
        if isinstance(existing_question['created_at'], str):
            existing_question['created_at'] = datetime.fromisoformat(existing_question['created_at'])
        return Question(**existing_question)
    
    # Generate new question
    previous_questions_docs = await db.questions.find(
        {"interview_id": interview_id},
        {"_id": 0, "question_text": 1}
    ).to_list(100)
    previous_questions = [q['question_text'] for q in previous_questions_docs]
    
    question_text = await ai_service.generate_question(next_question_num, previous_questions)
    
    question = Question(
        interview_id=interview_id,
        question_text=question_text,
        question_number=next_question_num
    )
    
    question_doc = question.model_dump()
    question_doc['created_at'] = question_doc['created_at'].isoformat()
    
    await db.questions.insert_one(question_doc)
    
    return question

@api_router.get("/interviews/{interview_id}/questions", response_model=List[Question])
async def get_interview_questions(interview_id: str, user_id: str = Depends(get_current_user_id)):
    """Get all questions for an interview"""
    interview_doc = await db.interviews.find_one({"id": interview_id, "user_id": user_id}, {"_id": 0})
    if not interview_doc:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    questions = await db.questions.find({"interview_id": interview_id}, {"_id": 0}).to_list(100)
    
    for q in questions:
        if isinstance(q['created_at'], str):
            q['created_at'] = datetime.fromisoformat(q['created_at'])
    
    return [Question(**q) for q in questions]

# ==================== ANSWER ROUTES ====================

@api_router.post("/interviews/{interview_id}/answers", response_model=Answer)
async def submit_answer(interview_id: str, answer_data: AnswerCreate, user_id: str = Depends(get_current_user_id)):
    """Submit an answer to a question"""
    interview_doc = await db.interviews.find_one({"id": interview_id, "user_id": user_id}, {"_id": 0})
    if not interview_doc:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify question exists
    question_doc = await db.questions.find_one({"id": answer_data.question_id}, {"_id": 0})
    if not question_doc:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Create answer
    answer = Answer(
        interview_id=interview_id,
        question_id=answer_data.question_id,
        user_id=user_id,
        answer_text=answer_data.answer_text
    )
    
    answer_doc = answer.model_dump()
    answer_doc['submitted_at'] = answer_doc['submitted_at'].isoformat()
    
    await db.answers.insert_one(answer_doc)
    
    # Update interview progress
    answers_count = await db.answers.count_documents({"interview_id": interview_id})
    update_data = {"current_question_number": answers_count}
    
    if answers_count >= interview_doc['total_questions']:
        update_data['status'] = InterviewStatus.COMPLETED
        update_data['completed_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.interviews.update_one({"id": interview_id}, {"$set": update_data})
    
    return answer

# ==================== EVALUATION ROUTES ====================

@api_router.post("/interviews/{interview_id}/evaluate", response_model=Evaluation)
async def evaluate_interview(interview_id: str, user_id: str = Depends(get_current_user_id)):
    """Evaluate an interview using AI"""
    interview_doc = await db.interviews.find_one({"id": interview_id, "user_id": user_id}, {"_id": 0})
    if not interview_doc:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview_doc['status'] != InterviewStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Interview not completed yet")
    
    # Check if already evaluated
    existing_eval = await db.evaluations.find_one({"interview_id": interview_id}, {"_id": 0})
    if existing_eval:
        if isinstance(existing_eval['evaluated_at'], str):
            existing_eval['evaluated_at'] = datetime.fromisoformat(existing_eval['evaluated_at'])
        return Evaluation(**existing_eval)
    
    # Get all questions and answers
    questions = await db.questions.find({"interview_id": interview_id}, {"_id": 0}).to_list(100)
    answers = await db.answers.find({"interview_id": interview_id}, {"_id": 0}).to_list(100)
    
    # Evaluate each answer
    evaluations = []
    for answer in answers:
        question = next((q for q in questions if q['id'] == answer['question_id']), None)
        if question:
            eval_result = await ai_service.evaluate_answer(question['question_text'], answer['answer_text'])
            evaluations.append(eval_result)
    
    # Calculate aggregate scores
    technical_score = sum(e.get('technical_quality', 0) for e in evaluations) / len(evaluations) if evaluations else 0
    communication_score = sum(e.get('communication_quality', 0) for e in evaluations) / len(evaluations) if evaluations else 0
    
    # Generate psychological profile
    psych_profile = await ai_service.generate_psychological_profile(evaluations)
    emotional_stability_score = psych_profile['emotional_stability_score']
    
    # Calculate overall score
    overall_score = (technical_score + communication_score + emotional_stability_score) / 3
    
    # Generate strengths and improvements
    strengths = []
    improvements = []
    
    if technical_score >= 75:
        strengths.append("Strong technical knowledge and problem-solving skills")
    elif technical_score < 60:
        improvements.append("Focus on deepening technical knowledge in core Computer Science concepts")
    
    if communication_score >= 75:
        strengths.append("Excellent communication and articulation abilities")
    elif communication_score < 60:
        improvements.append("Work on structuring answers more clearly and concisely")
    
    if emotional_stability_score >= 75:
        strengths.append("Maintains composure and confidence under pressure")
    elif emotional_stability_score < 60:
        improvements.append("Practice stress management techniques for interview situations")
    
    if psych_profile['stress_level'] == 'low':
        strengths.append("Demonstrates calmness and professional demeanor")
    
    # Default strengths/improvements if none identified
    if not strengths:
        strengths.append("Shows potential and willingness to engage with technical challenges")
    if not improvements:
        improvements.append("Continue building experience through practice and learning")
    
    # Create evaluation
    evaluation = Evaluation(
        interview_id=interview_id,
        user_id=user_id,
        technical_score=round(technical_score, 2),
        communication_score=round(communication_score, 2),
        emotional_stability_score=round(emotional_stability_score, 2),
        overall_score=round(overall_score, 2),
        strengths=strengths,
        improvements=improvements,
        sentiment_analysis=psych_profile['overall_sentiment'],
        stress_markers=psych_profile.get('stress_indicators', [])
    )
    
    eval_doc = evaluation.model_dump()
    eval_doc['evaluated_at'] = eval_doc['evaluated_at'].isoformat()
    
    await db.evaluations.insert_one(eval_doc)
    
    # Update interview status
    await db.interviews.update_one(
        {"id": interview_id},
        {"$set": {"status": InterviewStatus.EVALUATED}}
    )
    
    return evaluation

@api_router.get("/interviews/{interview_id}/evaluation", response_model=Evaluation)
async def get_evaluation(interview_id: str, user_id: str = Depends(get_current_user_id)):
    """Get evaluation for an interview"""
    interview_doc = await db.interviews.find_one({"id": interview_id, "user_id": user_id}, {"_id": 0})
    if not interview_doc:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    eval_doc = await db.evaluations.find_one({"interview_id": interview_id}, {"_id": 0})
    if not eval_doc:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    if isinstance(eval_doc['evaluated_at'], str):
        eval_doc['evaluated_at'] = datetime.fromisoformat(eval_doc['evaluated_at'])
    
    return Evaluation(**eval_doc)

# ==================== REPORT ROUTES ====================

@api_router.get("/interviews/{interview_id}/report")
async def download_report(interview_id: str, user_id: str = Depends(get_current_user_id)):
    """Download PDF report for an interview"""
    interview_doc = await db.interviews.find_one({"id": interview_id, "user_id": user_id}, {"_id": 0})
    if not interview_doc:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    eval_doc = await db.evaluations.find_one({"interview_id": interview_id}, {"_id": 0})
    if not eval_doc:
        raise HTTPException(status_code=404, detail="Evaluation not found. Please evaluate the interview first.")
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if isinstance(interview_doc['started_at'], str):
        interview_doc['started_at'] = datetime.fromisoformat(interview_doc['started_at'])
    
    pdf_buffer = report_service.generate_pdf_report(
        candidate_name=user_doc['name'],
        evaluation=eval_doc,
        interview_date=interview_doc['started_at']
    )
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=mindhire_report_{interview_id}.pdf"}
    )

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user_id: str = Depends(get_current_user_id)):
    """Get dashboard statistics"""
    total_interviews = await db.interviews.count_documents({"user_id": user_id})
    completed_interviews = await db.interviews.count_documents({
        "user_id": user_id,
        "status": {"$in": [InterviewStatus.COMPLETED, InterviewStatus.EVALUATED]}
    })
    
    # Get average scores from evaluations
    evaluations = await db.evaluations.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    avg_overall_score = 0
    avg_technical_score = 0
    avg_communication_score = 0
    
    if evaluations:
        avg_overall_score = sum(e.get('overall_score', 0) for e in evaluations) / len(evaluations)
        avg_technical_score = sum(e.get('technical_score', 0) for e in evaluations) / len(evaluations)
        avg_communication_score = sum(e.get('communication_score', 0) for e in evaluations) / len(evaluations)
    
    return {
        "total_interviews": total_interviews,
        "completed_interviews": completed_interviews,
        "in_progress_interviews": total_interviews - completed_interviews,
        "average_overall_score": round(avg_overall_score, 2),
        "average_technical_score": round(avg_technical_score, 2),
        "average_communication_score": round(avg_communication_score, 2)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()