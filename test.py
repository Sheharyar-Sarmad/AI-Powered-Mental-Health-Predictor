import joblib
import pandas as pd

# Load the model
model = joblib.load("data/models/Mental_Health_Score_Model.pkl")
print("✅ Model loaded successfully!")

# Top countries for grouping
top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

# Function to determine grouped country
def get_grouped_country(country):
    return country if country in top_countries else "Other"

# Test data
test_data = pd.DataFrame([{
    'Age': 22,
    'Gender': 'Male',
    'Country': 'Pakistan',
    'Academic_Level': 'Undergraduate',
    'Most_Used_Platform': 'Instagram',
    'Purpose_Of_Use': 'Entertainment',
    'Avg_Daily_Usage_Hours': 6.5,
    'Daily_Unlocks': 120,
    'Study_Hours': 4.0,
    'Physical_Activity_Hours': 1.5,
    'Sleep_Hours_Per_Night': 7.0,
    'Stress_Level': 'Medium',
    'Grouped_Country': get_grouped_country('Pakistan')  # ✅ Auto-group countries
}])

# Make prediction
prediction = model.predict(test_data)[0]
print(f"🧠 Predicted Mental Health Score: {prediction:.2f}")

# Show what was sent to the model
print("\n📊 Data sent to model:")
print(test_data.head())