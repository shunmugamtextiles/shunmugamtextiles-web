# Firebase Setup Instructions for Shunmugam Textiles

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `shunmugam-textiles`
4. Accept terms and click "Continue"
5. Disable Google Analytics (optional) or configure it
6. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project, click the **Web icon** (`</>`) to add a web app
2. Register app with nickname: `Shunmugam Textiles Web`
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. **Copy the Firebase configuration object** - you'll need this!

## Step 3: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"
5. Enable **Google** (optional):
   - Click on "Google"
   - Toggle "Enable"
   - Select support email
   - Click "Save"

## Step 4: Set Up Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll add rules later)
4. Select your preferred location (closest to your users)
5. Click "Enable"

### Firestore Security Rules (Update later):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow all users to read products
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to submit contact forms
    match /contacts/{contactId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

## Step 5: Set Up Storage (Optional - for product images)

1. In Firebase Console, go to **Build** → **Storage**
2. Click "Get started"
3. Choose **Start in production mode**
4. Select location
5. Click "Done"

### Storage Security Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 6: Configure Your App

1. Create a `.env` file in the root of your project:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. Update `src/firebase/config.js` to use environment variables:
   ```javascript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   };
   ```

## Step 7: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/signup` and create a test account
3. Check Firebase Console → Authentication to see the new user
4. Try logging in with the created account

## Features Implemented

✅ **Email/Password Authentication**
- Sign up with email and password
- Login with email and password
- Logout functionality

✅ **Google Authentication** (Optional)
- Sign in with Google account

✅ **Auth Context**
- Global authentication state management
- Protected routes capability

✅ **User Interface**
- Professional login page
- Professional signup page
- User info display in navbar
- Logout button

## Next Steps

### 1. Add Protected Routes
Create a `ProtectedRoute` component to restrict access to certain pages:

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default ProtectedRoute;
```

### 2. Store User Data in Firestore
When a user signs up, create a user document:

```javascript
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const createUserDocument = async (user) => {
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    createdAt: new Date(),
    role: 'customer'
  });
};
```

### 3. Add Product Management
- Create admin panel for adding/editing products
- Store products in Firestore
- Upload product images to Storage

### 4. Add Contact Form Integration
- Save contact form submissions to Firestore
- Send email notifications (using Firebase Cloud Functions)

## Security Best Practices

1. **Never commit `.env` file** - Add it to `.gitignore`
2. **Use Firestore Security Rules** - Restrict data access
3. **Validate user input** - Both client and server-side
4. **Use HTTPS** - Always in production
5. **Implement rate limiting** - Prevent abuse

## Troubleshooting

### "Firebase not initialized" error
- Make sure `.env` file exists and has correct values
- Restart development server after adding `.env`

### "Permission denied" error
- Check Firestore security rules
- Ensure user is authenticated

### Google Sign-in not working
- Add authorized domains in Firebase Console
- Authentication → Settings → Authorized domains

## Support

For Firebase documentation: https://firebase.google.com/docs
For issues: Check Firebase Console → Project Settings → Service accounts
