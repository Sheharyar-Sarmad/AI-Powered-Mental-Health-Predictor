# 🧠 AI Powered Mental Health Predictor

> Real-time AI analysis of your digital habits and lifestyle patterns for instant wellness insights.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3+-orange.svg)](https://scikit-learn.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000.svg?logo=next.js)](https://nextjs.org/)
[![Groq](https://img.shields.io/badge/AI%20Chat-Groq-F55036.svg)](https://groq.com/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-11+-black.svg)](https://www.framer.com/motion/)
[![GSAP](https://img.shields.io/badge/GSAP-3.12+-yellow.svg)](https://greensock.com/gsap/)

**🔗 Live App:** [ai-powered-mental-health-predictor.vercel.app](https://ai-powered-mental-health-predictor.vercel.app/?v=2)
**⚙️ Backend API:** [ai-powered-mental-health-predictor.onrender.com](https://ai-powered-mental-health-predictor.onrender.com)

---

## 🌟 Overview

**Mental Health Predictor** is an AI-powered web application that analyzes your digital habits, lifestyle patterns, and stress levels to provide a personalized wellness score on a 0-10 scale. It's built with a **Next.js** frontend featuring a dark, glassmorphism UI, an animated starfield, real-time gauge visualization, and a built-in **AI chat assistant** (powered by Groq) that you can talk to about your results — by typing or by voice.

> ⚠️ **Disclaimer**: This is an informational tool and not a clinical diagnosis. Always consult a healthcare professional for medical advice.

---

## ✨ Features

### 🧠 AI-Powered Analysis
- Machine Learning model trained on lifestyle & digital habits
- Real-time predictions with 87% accuracy
- Personalized wellness score (0-10 scale)

### 💬 AI Chat Assistant
- Built-in chat powered by **Groq**, with fast inference models (defaults to a Compound model when available)
- Ask follow-up questions about your score, get tailored recommendations, and discuss your results conversationally
- **Voice input** — speak your question and review the transcript before sending
- **Text-to-speech** replies, with a dedicated stop/cancel control so playback stops the instant you want it to
- Cancel in-flight generation at any time — no waiting for a response you don't want
- Responses render as proper formatted text — headings, bullet points, and tables — not raw markdown

### 📊 Comprehensive Assessment
- **Digital Habits**: Screen time, platform usage, unlock frequency
- **Lifestyle Metrics**: Sleep, physical activity, study hours
- **Stress Levels**: Self-reported stress assessment

### 🎨 Modern UI/UX
- Glassmorphism design with a deep-space dark theme and animated starfield backdrop
- Interactive glowing gauge for score visualization
- Smooth animations using **Framer Motion** + **GSAP**
- Fully responsive across all devices — phone, tablet, and desktop

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
| FastAPI | REST API server |
| joblib | Model serialization |
| Render | Backend hosting |

### Frontend

| Technology | Purpose |
|------------|---------|
| Next.js (App Router) | React framework & UI |
| TypeScript | Type-safe components |
| Tailwind CSS | Styling & glassmorphism design system |
| Framer Motion | UI animations & transitions |
| GSAP | Gauge & entrance animations |
| Groq API | AI chat assistant (LLM inference) |
| Web Speech API | Voice input & text-to-speech |
| Heroicons | Icon library |
| Vercel | Frontend hosting |

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

### AI Chat Flow

1. Submit the form to get your predicted score.
2. Your result is automatically dropped into the chat as a starting point.
3. Ask the AI assistant anything — about your score, specific habits, or general wellness tips.
4. Type or use the mic (your speech fills the input box — you decide when to send).
5. Cancel generation or stop playback at any time.

---

## 🚀 Quick Start

### Try it live

No setup needed — just open the deployed app:

- **Frontend:** [ai-powered-mental-health-predictor.vercel.app](https://ai-powered-mental-health-predictor.vercel.app/?v=2)
- **Backend health check:** [ai-powered-mental-health-predictor.onrender.com](https://ai-powered-mental-health-predictor.onrender.com)

> Note: the backend is hosted on Render's free tier and may take ~30-60s to spin up on first request after idling.

### Prerequisites (local development)

```bash
Python 3.9+
Node.js 18+
pip / npm
```

### Backend Setup

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/mental-health-predictor.git
cd mental-health-predictor/backend
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
uvicorn main:app --reload
# API available at http://localhost:8000
```

### Frontend Setup

**1. Navigate to the frontend folder**

```bash
cd ../frontend
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
GROQ_API_KEY=your_groq_api_key
```

**4. Run the dev server**

```bash
npm run dev
# App available at http://localhost:3000
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

- Glassmorphism for a modern, sleek appearance
- Deep-space dark theme with an animated starfield, reducing eye strain
- Smooth transitions and micro-interactions for better UX
- Accessible color contrast ratios
- Responsive across all screen sizes

### Color Palette

```css
--bg-primary: #04030e;                 /* Deep space background */
--bg-card: rgba(255, 255, 255, 0.035); /* Glass effect */
--text-primary: #f1f5f9;               /* Main text */
--accent-violet: #7c3aed;              /* Primary accent */
--accent-fuchsia: #d946ef;             /* Secondary accent */
--accent-cyan: #22d3ee;                /* Chat / info accent */
--gradient-brand: linear-gradient(#7c3aed, #d946ef); /* Brand gradient */
```

---

## 📬 Contact

**Sheharyar Sarmad**
AI/ML Developer & Full Stack Enthusiast

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sheharyar-sarmad-9b7736289/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://https://github.com/Sheharyar-Sarmad)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:sheharyar.developersheharyar2010@gmail.com)

**Connect with me**
- 💼 LinkedIn: Sheharyar Sarmad
- 📧 Email: developersheharyar2010@gmail.com

---

## 🙏 Acknowledgments

- AI/ML Community for open-source libraries
- scikit-learn for ML tools
- Groq for fast LLM inference powering the chat assistant
- Framer Motion & GSAP for animation libraries
- Vercel & Render for hosting
- Heroicons for icons

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
