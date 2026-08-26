import joblib
import pandas as pd
import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

print("Debugging Model Loading...")
print(f"Current directory: {os.getcwd()}")
print(f"Contents: {os.listdir('.')}")

# Check data directory
if os.path.exists('data'):
    print(f"📂 Contents of data: {os.listdir('data')}")
    if os.path.exists('data/models'):
        print(f"📂 Contents of data/models: {os.listdir('data/models')}")
    else:
        print("❌ data/models directory does not exist!")
else:
    print("❌ data directory does not exist!")

# Try to find the model file
model = None
model_found = False

# Search for .pkl files
for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.pkl'):
            print(f"✅ Found model file: {os.path.join(root, file)}")
            try:
                model = joblib.load(os.path.join(root, file))
                print(f"✅ Model loaded successfully from: {os.path.join(root, file)}")
                model_found = True
                break
            except Exception as e:
                print(f"❌ Error loading {file}: {e}")
    if model_found:
        break

if model is None:
    print("❌ No model file found in any directory!")
    print("💡 Make sure to add the model file to your repository")

top_countries = ['Other', 'India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France']

app = FastAPI(title="Mental Health Predictor API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

def fallback_predict(data: StudentData) -> float:
    """Fallback prediction based on simple logic"""
    score = 7.0
    
    # Adjust based on stress
    stress_map = {'Low': 2.0, 'Medium': 0.0, 'High': -1.5, 'Very High': -3.0}
    score += stress_map.get(data.stress_level, 0)
    
    # Adjust based on sleep
    if data.sleep_hours_per_night < 5:
        score -= 1.5
    elif data.sleep_hours_per_night > 8:
        score += 0.5
    
    # Adjust based on screen time
    if data.avg_daily_usage_hours > 8:
        score -= 1.0
    elif data.avg_daily_usage_hours < 3:
        score += 0.5
    
    # Adjust based on physical activity
    if data.physical_activity_hours > 1:
        score += 0.5
    
    # Adjust based on age
    if data.age < 18:
        score -= 0.5
    
    return max(0, min(10, score))

@app.get('/health')
def health_check():
    return {
        'status': 'healthy' if model else 'unhealthy',
        'model_loaded': model is not None,
        'model_type': str(type(model)) if model else 'None',
        'version': '1.0.0',
        'cwd': os.getcwd(),
        'files': os.listdir('.')
    }

@app.get('/')
def greet():
    return {'message': 'Welcome to Mental Health Predictor API'}

@app.post('/predict', response_model=PredictionResponse)
def predict(data: StudentData):
    try:
        if model is not None:
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
            prediction = float(model.predict(input_row)[0])
        else:
            prediction = fallback_predict(data)
            print(f"⚠️ Using fallback prediction: {prediction}")
        
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
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)