Project Name : Seva Saati

Problem Statement ID : PS03HC

Team Name : Cognify

College Name : ST ALOYSIUS UNIVERSITY


 Seva Saati — Your Elderly Health Companion

Problem Statement

India has over **150 million elderly citizens**, many of whom live alone or with minimal supervision. Their families and caregivers face a critical challenge — they cannot monitor health in real time. Elderly individuals often:

- Forget to take medications on time
- Cannot communicate health issues quickly during emergencies
- Have no easy way to do daily health check-ins
- Lack access to tech-friendly health monitoring tools

There is no affordable, simple, and voice-first solution designed specifically for elderly users and their remote caregivers.



Proposed Solution

**Seva Saati** is a full-stack, voice-enabled elderly health companion web application that bridges the gap between elderly patients and their caregivers.

**Voice Check-ins** — Elderly users speak their health status daily; AI processes and classifies it
**Medication Tracking** — Schedule, track, and get reminded about medications
**Real-time Caregiver Alerts** — Caregivers are instantly notified when the patient feels unwell or needs help
**Caregiver Dashboard** — Remote caregivers get a full overview of patient health, missed medicines, and activity
**Yoga & Exercise Tracker** — Daily wellness routines tailored for elderly users
**Inactivity Detection** — Automatically detects if a user has been inactive and alerts caregivers
**Dual Login System** — Separate portals for Elder and Caregiver with secure authentication



Innovation & Creativity

What makes Seva Saati unique:

- **Voice-First Design** — Elderly users can check in just by speaking; no typing needed
- **AI-Powered Analysis** — Voice transcripts are processed by an AI backend to detect sentiment and classify health status (`fine` / `unwell` / `help`)
- **Elder-Optimized UI** — Extra large fonts, high-contrast buttons, and minimal navigation designed specifically for elderly users
- **Caregiver Portal** — A completely separate dashboard giving caregivers real-time visibility with routine deviation detection
- **Offline-First with MongoDB Sync** — Data persists locally and syncs to MongoDB, ensuring reliability even with poor connectivity
- **Inactivity Engine** — Smart background monitoring that triggers alerts if no interaction is detected for extended periods



Tech Stack & Complexity

Frontend

Technology  

React 18 + TypeScript - UI Framework 
Vite - Build Tool 
Tailwind CSS - Styling 
React Router v7 - Navigation 
Lucide React - Icons 
Web Speech API - Voice Recognition 


Backend

Technology
 
Node.js + Express - REST API Server 
MongoDB (local) - Primary Database
Mongoose ODM - Schema Modeling 
UUID - Unique ID Generation 


Complexity highlights:

- Dual authentication system (Elder + Caregiver with separate sessions)
- Real-time inactivity detection with interval-based polling
- Voice transcript classification pipeline
- Routine deviation analysis engine
- MongoDB schemas for 7 collections: medicines, checkins, symptoms, alerts, interactions, caregivers, medicine_logs

---

Usability & Impact

Target Users

- **Primary:** Elderly individuals (60+) living alone or semi-independently
- **Secondary:** Family members and professional caregivers monitoring remotely

Real-World Value

- Reduces **medication non-compliance** — a leading cause of hospital readmissions in elderly
- Enables **early intervention** — caregivers are alerted before situations become emergencies
- Provides **peace of mind** for families who cannot be physically present
- **Accessible design** — large fonts, voice input, and simple 2-tap check-ins make it usable for tech-averse elderly
- **Low cost** — runs on any laptop/phone, no special hardware needed



## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB installed locally
- Git

### 1. Clone the Repository

git clone https://github.com/your-username/seva-saati.git
cd seva-saati


### 2. Start MongoDB

# Windows (run as Administrator)

net start MongoDB

# Or manually

mongod --dbpath "C:\data\db"


### 3. Setup Backend

cd Backend
npm install


Create a `.env` file in the `Backend/` folder:
env
PORT=5000
MONGO_URI=mongodb://localhost:27017/seva_saati


Start the backend:
bash
node server.js


You should see:

 MongoDB connected
 Seva Saati Backend → http://localhost:5000


### 4. Setup Frontend
bash
cd ../Frontend
npm install


Create a `.env` file in the `Frontend/` folder:
env
VITE_API_URL=http://localhost:5000


Start the frontend:

npm run dev


### 5. Open the App

http://localhost:5173


### 6. Demo Credentials
- Register as **Elder** on the login screen
- Use the **Caregiver** tab to login to the caregiver portal
