# React + Node.js Application with Firebase

This is a full-stack application built with React, Node.js, and Firebase.

## Project Structure

```
├── frontend/         # React frontend
│   ├── public/       # Public assets
│   ├── src/          # Source files
│   │   ├── assets/   # Images, fonts, etc.
│   │   ├── components/ # Reusable components
│   │   ├── context/  # React context files
│   │   ├── firebase/ # Firebase configuration
│   │   ├── hooks/    # Custom React hooks
│   │   └── pages/    # Application pages/routes
└── backend/          # Node.js backend
    ├── index.js      # Entry point
```

## Technologies Used

- **Frontend**:
  - React
  - TypeScript
  - Material UI
  - React Router
  - Firebase Auth
  - Firestore

- **Backend**:
  - Node.js
  - Express
  - Dotenv
  - CORS

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Firebase account

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Configure Firebase: Update the `src/firebase/config.ts` file with your Firebase credentials
4. Start the development server: `npm start`

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file with your environment variables
4. Start the server: `npm start` or `npm run dev` for development mode

## Development

- Frontend runs on: http://localhost:3000
- Backend runs on: http://localhost:5000 