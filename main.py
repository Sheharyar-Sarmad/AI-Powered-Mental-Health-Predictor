import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

# Load model
try:
    model = joblib.load("./data/models/Mental_Health_Score_Model.pkl")
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

app = FastAPI(title="Mental Health Predictor API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class StudentData(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: Literal['Male', 'Female']
    country: str
    academic_level: Literal['Undergraduate', 'Graduate', 'High School']
    most_used_platform: Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter', 'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp', 'WeChat']
    purpose_of_use: Literal['Networking', 'Education', 'Entertainment', 'News']
    avg_daily_usage_hours: float = Field(..., ge=0, le=24)
    daily_unlocks: int = Field(..., ge=0)
    study_hours: float = Field(..., ge=0, le=24)
    physical_activity_hours: float = Field(..., ge=0, le=24)
    sleep_hours_per_night: float = Field(..., ge=0, le=24)
    stress_level: Literal['Low', 'Medium', 'High', 'Very High']

class PredictionResponse(BaseModel):
    predicted_mental_health_score: float
    status: str = None
    recommendation: str = None

# Helper functions
def get_status(score: float) -> str:
    if score >= 8.0:
        return "Excellent Mental Health"
    elif score >= 6.0:
        return "Good Mental Health"
    elif score >= 4.0:
        return "Concerning - Consider Professional Help"
    else:
        return "Critical - Please Seek Professional Help"

def get_recommendation(score: float, stress_level: str) -> str:
    if score < 4.0:
        return "Please reach out to a mental health professional immediately"
    elif score < 6.0:
        return "Consider counseling or talking to someone you trust"
    elif stress_level in ['High', 'Very High']:
        return "Practice stress management techniques like meditation or deep breathing"
    return "Keep up the great work! Maintain these healthy habits."

@app.get('/health')
def health_check():
    return {
        'status': 'healthy' if model else 'unhealthy',
        'model_loaded': model is not None,
        'model_type': str(type(model)) if model else 'None',
        'version': '1.0.0'
    }

@app.get('/')
def greet():
    return {'message': 'Welcome to Mental Health Predictor API'}

@app.post('/predict', response_model=PredictionResponse)
def predict(data: StudentData):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        country_group = data.country if data.country in top_countries else "Other"

        input_row = pd.DataFrame([{
            'Age': data.age,
            'Gender': data.gender,
            'Country': data.country,
            'Academic_Level': data.academic_level,
            'Most_Used_Platform': data.most_used_platform,
            'Purpose_Of_Use': data.purpose_of_use,
            'Avg_Daily_Usage_Hours': data.avg_daily_usage_hours,
            'Daily_Unlocks': data.daily_unlocks,
            'Study_Hours': data.study_hours,
            'Physical_Activity_Hours': data.physical_activity_hours,
            'Sleep_Hours_Per_Night': data.sleep_hours_per_night,
            'Stress_Level': data.stress_level,
            "Grouped_Country": country_group
        }])

        prediction = model.predict(input_row)[0]
        status = get_status(prediction)
        recommendation = get_recommendation(prediction, data.stress_level)

        return PredictionResponse(
            predicted_mental_health_score=round(prediction, 2),
            status=status,
            recommendation=recommendation
        )
    
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)