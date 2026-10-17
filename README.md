# Overall Score Academy

Full frontend project for an online school-style assignment platform with **Overall Score** system and reward redemption.

## Tech Stack
- **React** (via CDN)
- **Babel** (standalone for JSX in browser)
- Pure **HTML / CSS / JS**
- Ready to connect to Google Apps Script backend (code.gs + Sheets)

## Features
- Login (Admin / Student)
- Student: View Overall Score, complete assignments, submit work, redeem rewards
- Admin: Manual grading of submissions, award points to Overall Score, manage assignments & rewards
- Score deduction on redemption: e.g. 90 − 25 = 65

## How to run
1. Open `index.html` in a browser (or serve with any static server)
2. Demo logins:
   - Admin: `admin` / `admin`
   - Student: `student1` / `password123`

## Connecting to Google Apps Script
Replace the mock API calls in `js/api.js` with `google.script.run` calls to the Code.gs functions provided earlier.

## Project structure
```
score-academy/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── api.js          (mock backend)
│   ├── App.jsx         (main React app)
│   └── components/     (optional extra components)
└── README.md
```

Created for the request: code.gs + Google Sheets backend + modern React frontend.
