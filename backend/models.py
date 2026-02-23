from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class UserRole(str, Enum):
    CANDIDATE = "candidate"
    HR = "hr"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: UserRole = UserRole.CANDIDATE
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.CANDIDATE

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    interview_id: str
    question_text: str
    question_number: int
    difficulty: str = "medium"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Answer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    interview_id: str
    question_id: str
    user_id: str
    answer_text: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)

class AnswerCreate(BaseModel):
    question_id: str
    answer_text: str

class InterviewStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EVALUATED = "evaluated"

class Interview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    status: InterviewStatus = InterviewStatus.IN_PROGRESS
    total_questions: int = 5
    current_question_number: int = 0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class Evaluation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    interview_id: str
    user_id: str
    technical_score: float
    communication_score: float
    emotional_stability_score: float
    overall_score: float
    strengths: List[str]
    improvements: List[str]
    sentiment_analysis: str
    stress_markers: List[str]
    evaluated_at: datetime = Field(default_factory=datetime.utcnow)

class InterviewWithDetails(BaseModel):
    interview: Interview
    questions_answered: int
    evaluation: Optional[Evaluation] = None