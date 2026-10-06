# Campus Customs Authentication Flow

Complete end-to-end authentication system connecting frontend to backend.

## Architecture

### Frontend Components

#### 1. **AuthContext** (`src/context/AuthContext.tsx`)
- Centralized authentication state management
- Handles login, register, logout
- Manages JWT tokens
- Provides hooks for all components

#### 2. **Login Page** (`src/pages/Login.tsx`)
- Email and password inputs
- Show/hide password toggle
- Error handling and display
- Link to register page

#### 3. **Register Page** (`src/pages/Register.tsx`)
- First name, last name, email, password inputs
- Password confirmation
- Real-time password strength indicator
- Client-side validation (mirrors backend)
- Link to login page

#### 4. **Updated Navbar** (`src/components/Navbar.tsx`)
- Shows "Create account" / "Log in" buttons when logged out
- Shows user greeting and "Log out" when logged in
- Dynamic navigation based on auth state

#### 5. **App.tsx**
- Wraps entire app with `AuthProvider`
- Routes to login/register pages
- Manages auth page state

### Backend Endpoints

#### Authentication Routes

```
POST /api/auth/register
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@yale.edu",
  "password": "SecurePass123",
  "password_confirm": "SecurePass123"
}
Response: { access_token, token_type, user }

POST /api/auth/login
{
  "email": "john@yale.edu",
  "password": "SecurePass123"
}
Response: { access_token, token_type, user }

POST /api/auth/verify
{
  "token": "jwt-token-here"
}
Response: { valid, user_id, email }
```

## Security Features

### Frontend
- ✅ Password strength indicator (Real-time validation)
- ✅ Password confirmation matching
- ✅ JWT token stored in localStorage
- ✅ Protected routes based on authentication
- ✅ Auto-logout on token expiration
- ✅ Email format validation

### Backend
- ✅ Bcrypt password hashing (12 rounds)
- ✅ JWT token generation (30-min expiration)
- ✅ Password requirements enforcement:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 digit
- ✅ Email uniqueness check
- ✅ Duplicate account prevention
- ✅ Generic error messages (prevents user enumeration)
- ✅ Database password hashing

## User Flow

### Registration
1. User clicks "Create account" in navbar
2. Register page appears with form
3. User enters: First name, Last name, Email, Password
4. Password strength indicator shows in real-time
5. User confirms password
6. Client-side validation runs
7. If valid, POST to `/api/auth/register`
8. Backend validates and hashes password
9. User inserted into database
10. JWT token returned and stored
11. User logged in automatically
12. Redirected to home page

### Login
1. User clicks "Log in" in navbar
2. Login page appears
3. User enters email and password
4. POST to `/api/auth/login`
5. Backend verifies email and password
6. If valid, JWT token returned
7. Token stored in localStorage
8. User state updated
9. Navbar shows user greeting
10. "Create account" / "Log in" buttons change to "Log out"

### Logout
1. User clicks "Log out" in navbar
2. Token removed from localStorage
3. Auth state reset
4. Redirected to home
5. Navbar shows login/register buttons again

## Token Management

### Storage
- JWT stored in `localStorage` with key `authToken`
- Persists across page reloads
- Cleared on logout

### Expiration
- Token valid for 30 minutes
- Auto-verify on app load
- Auto-logout if token expired

### Usage
- Sent with requests that need authentication
- Can be used in Authorization header: `Bearer {token}`

## Error Handling

### Client-Side
- Password mismatch detection
- Email format validation
- Password strength requirements display
- Field-level error messages
- Form submission error display

### Server-Side
- Duplicate email check
- Password validation rules
- Invalid credentials (generic message)
- Database constraints enforcement
- Proper HTTP status codes

## File Structure

```
frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx        # Auth state management
│   ├── pages/
│   │   ├── Login.tsx              # Login form
│   │   ├── Register.tsx           # Register form
│   │   └── ...
│   ├── components/
│   │   ├── Navbar.tsx             # Updated with auth buttons
│   │   └── ...
│   ├── styles/
│   │   ├── auth.css               # Auth page styles
│   │   └── ...
│   ├── App.tsx                    # Routes & AuthProvider wrapper
│   └── ...
└── ...
```

## Testing the Flow

### 1. Register a New User
- Click "Create account"
- Fill in form with valid data
- Check password strength indicator
- Submit

### 2. Login
- Click "Log in"
- Enter credentials
- Should see user greeting in navbar

### 3. Logout
- Click "Log out" button
- Should return to home page
- Navbar should show login/register buttons again

### 4. Validate Password Rules
- Try password without uppercase: Should fail
- Try password without digit: Should fail
- Try mismatched passwords: Should fail
- Try too short password: Should fail
- Correct password: Should succeed

## Future Enhancements

- [ ] Email verification on signup
- [ ] Password reset flow
- [ ] Remember me functionality
- [ ] Social login (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Refresh token rotation
- [ ] User profile management
- [ ] Order history (authenticated)
- [ ] Saved preferences
