# MindHire AI - AI-Powered Interview & Psychological Assessment Platform

## Overview

MindHire AI is a production-ready MVP that combines artificial intelligence with psychological assessment to evaluate candidates through Computer Science interviews. The platform provides comprehensive scoring across technical skills, communication abilities, and emotional stability.

## Features

### 🔐 Authentication
- JWT-based secure authentication
- Role-based access (Candidate/HR)
- Email/password registration and login

### 📊 Candidate Dashboard
- Real-time statistics (total interviews, completion rate, average scores)
- Interactive analytics charts using Recharts
- Recent interview history with quick access
- Beautiful lilac/pink psychology-themed design

### 🤖 AI Interview Module
- Dynamic question generation using OpenAI GPT-4o
- One question at a time for focused responses
- Progress tracking with visual indicators
- 5 Computer Science questions per interview
- Text-based answer submission

### 🎯 AI Evaluation Engine
- **Technical Score**: Analyzes problem-solving skills and knowledge depth
- **Communication Score**: Evaluates clarity, structure, and grammar
- **Emotional Stability Score**: Assesses composure and confidence
- Semantic similarity analysis
- Sentiment detection (positive/neutral/negative)
- Stress marker identification

### 🧠 Psychological Profiling
- Non-clinical sentiment analysis
- Stress indicator detection
- Confidence trend tracking
- Overall emotional stability assessment

### 📄 Report System
- Comprehensive PDF report generation
- Performance breakdown by category
- Key strengths and improvement areas
- Psychological profile summary
- Downloadable via API endpoint

## Tech Stack

### Frontend
- **Framework**: React.js 19.0
- **Styling**: Tailwind CSS with custom lilac/pink theme
- **Charts**: Recharts for data visualization
- **Fonts**: Manrope (headings), Public Sans (body)
- **UI Components**: Shadcn/UI with Radix primitives
- **Routing**: React Router v7
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT with python-jose
- **Password Hashing**: bcrypt
- **AI Integration**: OpenAI GPT-4o via emergentintegrations
- **PDF Generation**: ReportLab
- **Validation**: Pydantic v2

### AI/ML
- **Provider**: OpenAI
- **Model**: GPT-4o
- **Integration**: Emergent LLM Key (universal key)
- **Capabilities**: Question generation, answer evaluation, sentiment analysis

## Project Structure

```
/app
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── models.py              # Pydantic models
│   ├── auth_service.py        # JWT authentication
│   ├── ai_service.py          # AI question & evaluation
│   ├── report_service.py      # PDF generation
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main application
│   │   ├── contexts/
│   │   │   └── AuthContext.js # Authentication state
│   │   ├── pages/
│   │   │   ├── AuthPage.js   # Login/Register
│   │   │   ├── Dashboard.js  # Main dashboard
│   │   │   ├── InterviewPage.js # Interview interface
│   │   │   ├── ResultsPage.js # Evaluation results
│   │   │   └── InterviewsPage.js # Interview history
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── ui/           # Shadcn components
│   │   └── services/
│   │       └── api.js        # API client
│   ├── package.json
│   └── tailwind.config.js    # Custom theme
└── README.md
```

## Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB
- Yarn package manager

### Backend Setup

1. Install Python dependencies:
```bash
cd /app/backend
pip install -r requirements.txt
```

2. Configure environment variables in `/app/backend/.env`:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="mindhire_db"
CORS_ORIGINS="*"
JWT_SECRET="your-secret-key"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EMERGENT_LLM_KEY=your-emergent-key
```

3. Start the backend server:
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup

1. Install Node dependencies:
```bash
cd /app/frontend
yarn install
```

2. Configure environment variables in `/app/frontend/.env`:
```env
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

3. Start the development server:
```bash
yarn start
```

The application will be available at `http://localhost:3000`

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "candidate"
}
```

#### POST `/api/auth/login`
Login with credentials
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/me`
Get current user info (requires authentication)

### Interview Endpoints

#### POST `/api/interviews`
Start a new interview (requires authentication)

#### GET `/api/interviews`
Get all interviews for current user

#### GET `/api/interviews/{interview_id}`
Get specific interview details

#### GET `/api/interviews/{interview_id}/next-question`
Get the next question for an interview

#### POST `/api/interviews/{interview_id}/answers`
Submit an answer to a question
```json
{
  "question_id": "uuid",
  "answer_text": "Your answer here..."
}
```

#### POST `/api/interviews/{interview_id}/evaluate`
Evaluate a completed interview

#### GET `/api/interviews/{interview_id}/evaluation`
Get evaluation results

#### GET `/api/interviews/{interview_id}/report`
Download PDF report

### Dashboard Endpoints

#### GET `/api/dashboard/stats`
Get dashboard statistics

## Design System

### Color Palette
- **Primary Lilac**: `#a855f7` - Main brand color
- **Secondary Teal**: `#0f766e` - Accent color
- **Background**: `#fafaf9` (Bone) - Main background
- **Text Primary**: `#2e1065` - Deep purple for headings
- **Text Secondary**: `#581c87` - Purple for body text

### Typography
- **Headings**: Manrope (sans-serif)
- **Body**: Public Sans (sans-serif)
- **Accent**: Fraunces (serif)

### Design Principles
- Psychological safety and comfort
- Soft colors and rounded corners
- Generous spacing (2-3x normal)
- Glass-morphism effects
- Micro-animations for interactions
- Accessible contrast ratios

## Key Features Implementation

### AI Question Generation
Questions are dynamically generated using GPT-4o with context about:
- Computer Science domain
- Previous questions (to avoid repetition)
- Appropriate difficulty level
- Clear and specific phrasing

### Answer Evaluation
Each answer is evaluated across multiple dimensions:
- **Technical Quality** (0-100): Correctness and depth of knowledge
- **Communication Quality** (0-100): Clarity and structure
- **Confidence Level** (0-100): Language patterns indicating confidence
- **Sentiment**: Positive, neutral, or negative tone
- **Stress Indicators**: Hesitation words, uncertainty markers

### Psychological Profiling
Non-clinical assessment includes:
- Overall sentiment aggregation
- Stress level classification (low/medium/high)
- Confidence trend analysis
- Emotional stability score calculation

### PDF Report Generation
Professional reports include:
- Candidate information and date
- Performance score table
- Detailed breakdown by category
- Key strengths (bullet points)
- Areas for improvement (bullet points)
- Psychological profile summary
- Legal disclaimer

## User Journey

1. **Registration/Login**: User creates account or logs in
2. **Dashboard**: View statistics, charts, and previous interviews
3. **Start Interview**: Click "Start New Interview" button
4. **Answer Questions**: Respond to 5 Computer Science questions one at a time
5. **Automatic Evaluation**: System evaluates all answers using AI
6. **View Results**: See comprehensive scores and feedback
7. **Download Report**: Get PDF report for records

## Security Considerations

- JWT tokens expire after 24 hours
- Passwords are hashed using bcrypt
- All API endpoints require authentication (except auth routes)
- MongoDB ObjectId excluded from responses
- Environment variables for sensitive data
- CORS configured for allowed origins

## Performance

- Hot reload enabled for both frontend and backend
- Async MongoDB operations
- Efficient Recharts rendering
- Lazy loading for routes
- Optimized API responses (exclude _id fields)

## Testing

The application has been tested for:
- User registration and login flows
- Dashboard statistics display
- Interview creation and management
- AI question generation
- Answer submission and progress tracking
- Interview completion and evaluation
- Results display with all scores
- PDF report download
- Complete end-to-end user journey

## Important Notes

⚠️ **Psychological Assessment Disclaimer**: This platform provides AI-generated assessments for recruitment and talent evaluation purposes only. It is NOT a clinical psychological diagnosis tool and should not be used as such.

🔑 **Emergent LLM Key**: The platform uses Emergent's universal key for AI integration. Users can replace this with their own OpenAI API key if needed.

## Future Enhancements

- Adaptive question difficulty based on performance
- Real-time score updates during interview
- Multiple interview domains (not just Computer Science)
- Video interview integration
- Advanced analytics and reporting
- HR dashboard for viewing all candidates
- Interview scheduling system
- Email notifications

## License

This project is part of the MindHire AI MVP and is intended for educational and demonstration purposes.

## Support

For questions or issues, please refer to the system documentation or contact the development team.

---

**Built with ❤️ using React, FastAPI, and OpenAI GPT-4o**
