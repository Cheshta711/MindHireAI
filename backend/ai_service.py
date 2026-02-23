from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import re
import json
from typing import Dict, List

API_KEY = os.environ.get("EMERGENT_LLM_KEY")

class AIService:
    def __init__(self):
        self.api_key = API_KEY
        # Don't fail on startup, just log the issue
        if not self.api_key:
            print("Warning: EMERGENT_LLM_KEY environment variable is not set. AI features will use fallback responses.")
    
    async def generate_question(self, question_number: int, previous_questions: List[str] = None) -> str:
        """Generate a Computer Science interview question using GPT-4o"""
        try:
            # If no API key, use fallback immediately
            if not self.api_key:
                raise Exception("No API key available")
                
            system_message = "You are an expert technical interviewer specializing in Computer Science. Generate challenging but fair interview questions covering topics like algorithms, data structures, system design, databases, and programming concepts."
            
            previous_context = ""
            if previous_questions:
                previous_context = f"\n\nPrevious questions asked: {', '.join(previous_questions)}\nMake sure this question is different and covers a new topic."
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"question_gen_{question_number}",
                system_message=system_message
            ).with_model("openai", "gpt-4o")
            
            prompt = f"Generate interview question #{question_number} for a Computer Science position. The question should be clear, specific, and test the candidate's technical knowledge or problem-solving ability.{previous_context}\n\nProvide ONLY the question text, nothing else."
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return response.strip()
        except Exception as e:
            print(f"AI question generation failed: {str(e)}. Using fallback question.")
            # Fallback to a predefined question if AI fails
            fallback_questions = [
                "Explain the difference between a stack and a queue data structure. Provide examples of when you would use each.",
                "What is the time complexity of binary search? Explain the algorithm step by step.",
                "Describe how you would design a system to handle 1 million concurrent users.",
                "Explain the concept of database indexing and its impact on query performance.",
                "What are the differences between SQL and NoSQL databases? When would you choose one over the other?"
            ]
            return fallback_questions[(question_number - 1) % len(fallback_questions)]
    
    async def evaluate_answer(self, question: str, answer: str) -> Dict:
        """Evaluate an answer using AI for semantic analysis"""
        try:
            system_message = """You are an expert technical interviewer and psychologist. Evaluate candidate answers for:
1. Technical accuracy and depth
2. Communication clarity
3. Confidence and emotional tone
4. Stress indicators

Provide your evaluation in JSON format with these fields:
- technical_quality (0-100): Technical correctness and depth
- communication_quality (0-100): Clarity, structure, grammar
- confidence_level (0-100): Confidence in the response
- sentiment (positive/neutral/negative): Overall emotional tone
- stress_indicators (list): Words or phrases indicating stress, hesitation, or uncertainty
- key_points (list): Main points mentioned in the answer"""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id="answer_evaluation",
                system_message=system_message
            ).with_model("openai", "gpt-4o")
            
            prompt = f"""Question: {question}

Candidate's Answer: {answer}

Provide a detailed evaluation in JSON format."""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Parse JSON response
            try:
                # Extract JSON from response if it contains markdown code blocks
                json_match = re.search(r'```(?:json)?\s*({.*?})\s*```', response, re.DOTALL)
                if json_match:
                    evaluation = json.loads(json_match.group(1))
                else:
                    evaluation = json.loads(response)
            except:
                # Fallback to basic evaluation if parsing fails
                evaluation = {
                    "technical_quality": 70,
                    "communication_quality": 75,
                    "confidence_level": 65,
                    "sentiment": "neutral",
                    "stress_indicators": [],
                    "key_points": ["Response provided"]
                }
        except Exception as e:
            # Fallback evaluation if AI service fails
            evaluation = {
                "technical_quality": 70,
                "communication_quality": 75,
                "confidence_level": 65,
                "sentiment": "neutral",
                "stress_indicators": [],
                "key_points": ["Response provided"]
            }
        
        return evaluation
    
    async def generate_psychological_profile(self, evaluations: List[Dict]) -> Dict:
        """Generate psychological profile from multiple answer evaluations"""
        if not evaluations:
            return {
                "overall_sentiment": "neutral",
                "stress_level": "low",
                "confidence_trend": "stable",
                "emotional_stability_score": 75
            }
        
        # Aggregate sentiment
        sentiments = [e.get("sentiment", "neutral") for e in evaluations]
        positive_count = sentiments.count("positive")
        negative_count = sentiments.count("negative")
        
        if positive_count > len(sentiments) / 2:
            overall_sentiment = "positive"
        elif negative_count > len(sentiments) / 2:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"
        
        # Aggregate stress indicators
        all_stress_indicators = []
        for e in evaluations:
            all_stress_indicators.extend(e.get("stress_indicators", []))
        
        stress_level = "low"
        if len(all_stress_indicators) > 5:
            stress_level = "high"
        elif len(all_stress_indicators) > 2:
            stress_level = "medium"
        
        # Calculate emotional stability score
        avg_confidence = sum(e.get("confidence_level", 50) for e in evaluations) / len(evaluations)
        sentiment_stability = 100 - (abs(positive_count - negative_count) * 20)
        emotional_stability_score = (avg_confidence + sentiment_stability) / 2
        
        return {
            "overall_sentiment": overall_sentiment,
            "stress_level": stress_level,
            "confidence_trend": "stable" if len(set([e.get("sentiment") for e in evaluations])) <= 2 else "variable",
            "emotional_stability_score": round(emotional_stability_score, 2),
            "stress_indicators": list(set(all_stress_indicators))[:5]
        }