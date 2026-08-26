import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
import joblib
import os

print("🔍 Training Mental Health Score Model...")

# Load data
data_path = "./data/raw/Student Social Media And Mental Health Impact.csv"
if not os.path.exists(data_path):
    print(f"❌ Data not found at: {data_path}")
    print("📍 Current directory:", os.getcwd())
    print("📂 Contents:", os.listdir('.'))
    exit(1)

data = pd.read_csv(data_path)
print(f"✅ Data loaded: {data.shape[0]} rows, {data.shape[1]} columns")

# Prepare features and target
X = data.drop('Mental_Health_Score', axis=1)
y = data['Mental_Health_Score']

# Define categorical and numerical columns
categorical_cols = ['Gender', 'Country', 'Academic_Level', 'Most_Used_Platform', 
                   'Purpose_Of_Use', 'Stress_Level']
numerical_cols = ['Age', 'Avg_Daily_Usage_Hours', 'Daily_Unlocks', 
                 'Study_Hours', 'Physical_Activity_Hours', 'Sleep_Hours_Per_Night']

# Preprocessing pipeline
preprocessor = ColumnTransformer([
    ('num', Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ]), numerical_cols),
    ('cat', Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='Unknown')),
        ('encoder', LabelEncoder())
    ]), categorical_cols)
])

# Create and train model
model = Pipeline([
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
])

print("🔄 Training model...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model.fit(X_train, y_train)

score = model.score(X_test, y_test)
print(f"✅ Model trained! R² Score: {score:.4f}")

# Save model
model_dir = "./data/models"
os.makedirs(model_dir, exist_ok=True)
model_path = f"{model_dir}/Mental_Health_Score_Model.pkl"
joblib.dump(model, model_path)
print(f"✅ Model saved to: {model_path}")

# Verify model can be loaded
test_model = joblib.load(model_path)
print("✅ Model verification successful!")