# 🧠 AI Powered Mental Health Predictor

> Real-time AI analysis of your digital habits and lifestyle patterns for instant wellness insights.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3+-orange.svg)](https://scikit-learn.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)](https://flask.palletsprojects.com/)
[![GSAP](https://img.shields.io/badge/GSAP-3.12+-yellow.svg)](https://greensock.com/gsap/)

---

## 🌟 Overview

**Mental Health Predictor** is an AI-powered web application that analyzes your digital habits, lifestyle patterns, and stress levels to provide a personalized wellness score on a 0-10 scale. Built with a modern glassmorphism UI and real-time gauge visualization, it offers instant insights into your mental well-being.

> ⚠️ **Disclaimer**: This is an informational tool and not a clinical diagnosis. Always consult a healthcare professional for medical advice.

---

## ✨ Features

### 🧠 AI-Powered Analysis
- Machine Learning Model trained on lifestyle & digital habits
- Real-time predictions with 87% accuracy
- Personalized wellness score (0-10 scale)

### 📊 Comprehensive Assessment
- **Digital Habits**: Screen time, platform usage, unlock frequency
- **Lifestyle Metrics**: Sleep, physical activity, study hours
- **Stress Levels**: Self-reported stress assessment

### 🎨 Modern UI/UX
- Glassmorphism Design with dark theme
- Interactive Gauge for score visualization
- Smooth Animations using GSAP
- Fully Responsive across all devices

### 🔄 Real-time Feedback
- Instant predictions after form submission
- Detailed insights with personalized recommendations
- Error handling with retry mechanism

---

## 🛠️ Tech Stack

### Machine Learning & Backend

| Technology | Purpose |
|------------|---------|
| Python 3.9+ | Core programming language |
| scikit-learn | Machine Learning model training |
| pandas | Data manipulation & analysis |
| numpy | Numerical computations |
| seaborn | Statistical visualizations |
| matplotlib | Data plotting |
| Flask | REST API server |
| joblib | Model serialization |

### Frontend

| Technology | Purpose |
|------------|---------|
| HTML5 | Semantic markup |
| CSS3 | Glassmorphism, Custom properties |
| JavaScript (ES6+) | Interactive functionality |
| GSAP | Smooth animations |
| Font Awesome | Icon library |
| Google Fonts | Typography |

---

## 📊 How It Works

### Data Collection

The system collects **12 key features**:

| Category | Features |
|----------|----------|
| Personal Info | Age, Gender, Country |
| Digital Habits | Platform, Purpose, Screen Time, Unlocks |
| Academic | Level, Study Hours |
| Lifestyle | Physical Activity, Sleep Hours |
| Stress | Self-reported Stress Level |

### Scoring System

| Score Range | Category | Description |
|-------------|----------|-------------|
| 8.5 – 10 | 🟢 Excellent | Strong balance & resilience |
| 6 – 8.4 | 🟡 Good | Healthy habits with room for improvement |
| 3.5 – 5.9 | 🟠 Moderate | Some concerns, adjustments recommended |
| 0 – 3.4 | 🔴 High Concern | Significant strain, seek professional help |

---

## 🚀 Quick Start

### Prerequisites

```bash
Python 3.9+
pip (Python package manager)
```

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/mental-health-predictor.git
cd mental-health-predictor
```

**2. Create virtual environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

**3. Install dependencies**

```bash
pip install -r requirements.txt
```

**4. Train the model**

```bash
python train_model.py
```

**5. Run the backend server**

```bash
python app.py
```

**6. Open the frontend**

```bash
# Open index.html in your browser
# Or use Live Server extension in VS Code
```

---

## 🤖 Model Training

### Dataset Features

| Feature | Type | Range | Description |
|---------|------|-------|--------------|
| age | Numeric | 10-100 | User's age |
| gender | Categorical | Male/Female | Gender |
| country | Categorical | - | Country of residence |
| academic_level | Categorical | - | Education level |
| most_used_platform | Categorical | - | Primary social platform |
| purpose_of_use | Categorical | - | Primary usage purpose |
| avg_daily_usage_hours | Numeric | 0-24 | Screen time per day |
| daily_unlocks | Numeric | 0+ | Phone unlocks per day |
| study_hours | Numeric | 0-24 | Study hours per day |
| physical_activity_hours | Numeric | 0-24 | Exercise per day |
| sleep_hours_per_night | Numeric | 0-24 | Sleep hours |
| stress_level | Categorical | - | Self-reported stress |

### Model Performance

```text
📈 Accuracy: 87%
🎯 F1-Score: 0.85
📊 RMSE: 0.72
🔄 Cross-Validation: 5-fold
```

### Training Pipeline

1. Data Preprocessing & Cleaning
2. Feature Engineering & Encoding
3. Train-Test Split (80-20)
4. Random Forest Model Training
5. Hyperparameter Tuning
6. Model Evaluation & Validation
7. Model Export (joblib)

---

## 📈 Sample Results

| Age | Screen Time | Sleep | Stress | Score | Category |
|-----|-------------|-------|--------|-------|----------|
| 21 | 6.5 hrs | 7 hrs | Low | 8.2 | 🟡 Good |
| 35 | 9.2 hrs | 5 hrs | High | 4.7 | 🟠 Moderate |
| 19 | 12 hrs | 4.5 hrs | Very High | 2.1 | 🔴 High Concern |
| 28 | 4.2 hrs | 8 hrs | Low | 9.4 | 🟢 Excellent |

---

## 🎨 UI/UX Design

### Design Principles

- Glassmorphism for modern, sleek appearance
- Dark theme reducing eye strain
- Smooth transitions for better UX
- Accessible color contrast ratios
- Responsive across all screen sizes

### Color Palette

```css
--bg-primary: #0a0e14;              /* Dark background */
--bg-card: rgba(255, 255, 255, 0.05); /* Glass effect */
--text-primary: #f0f4f8;            /* Main text */
--gradient-blue: linear-gradient(#3b82f6, #8b5cf6); /* Brand gradient */
```

---

## 📬 Contact

**Sheharyar Sarmad**
AI/ML Developer & Full Stack Enthusiast

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/sheharyar-sarmad)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sheharyar-sarmad)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:sheharyar.sarmad@example.com)

**Connect with me**
- 💼 LinkedIn: Sheharyar Sarmad
- 📧 Email: sheharyar.sarmad@example.com

---

## 🙏 Acknowledgments

- AI/ML Community for open-source libraries
- scikit-learn for ML tools
- GSAP for animation library
- Font Awesome for icons

---

## 🌟 Support

If you find this project helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting issues
- 💡 Suggesting improvements
- 📢 Sharing with others

---

<p align="center">
Built with ❤️ by <strong>Sheharyar Sarmad</strong><br>
<em>"Mental health matters. Every signal counts."</em>
</p>
