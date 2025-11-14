# GAMEARLY - Game Discovery Platform# GAMEARLY



A retro-styled game discovery platform with AI-powered recommendations, user authentication, and social features.This repo contains a prototype of the GAMEARLY app, with the Home Screen and stub sections such as Bookmarks, Search, Explore, and Account.



## 🎮 Features## Run locally

1. Download the repo as ZIP and extract.

- **User Authentication**: Login, registration, password reset2. Double‑click `index.html` to open in your browser (no build tools required).

- **AI Chat Assistant**: Get personalized game recommendations with bullet-point formatting

- **Game Comparison**: Side-by-side comparisons with glassmorphism design## Files

- **Bookmarks**: Save and compare your favorite games- `index.html` — markup + sections

- **Search & Filter**: Find games by genre, price, and rating- `styles.css` — dark theme, cards, bottom tab bar, responsive top nav

- **Responsive Design**: iPhone viewport simulation (393x852)- `script.js` — hamburger toggle + tiny bookmark demo

- **Retro Gaming Aesthetic**: 8-bit "Press Start 2P" font

## Notes

## 🚀 Getting Started- Replace placeholder cards with real images/text as needed.

- You can host this via GitHub Pages to share a live demo link.

### Prerequisites

- Node.js (v14 or higher)⸻

- npm

- OpenAI API key✅ Features



### Installation1. Home Screen

	•	Flash Sale

1. **Clone the repository**	•	Popular Now

   ```bash	•	Recommendations

   git clone https://github.com/Chan1205/Gamearly.git	•	Recent Releases

   cd gamearly-main

   ```2. Search Page

	•	Search bar

2. **Install dependencies**	•	Genre filter button

   ```bash	•	Live search through a small game dataset

   npm install	•	Results with bookmark toggle

   ```	•	Tap results to open Game Info page



3. **Set up environment variables**3. Genre Filter

   ```bash	•	Checkbox list

   # Copy the example env file	•	Saves selection using localStorage

   cp .env.example .env	•	Applied automatically to Search results



   # Edit .env and add your OpenAI API key4. Bookmarks Page

   # OPENAI_API_KEY=your_actual_api_key_here	•	Shows all bookmarked games

   ```	•	“Remove” option

	•	Persistent using localStorage

4. **Start the backend server**

   ```bash5. Game Info Page

   node server.js	•	Cover image placeholder

   ```	•	About, Specs, Reviews sections

   Server will run on `http://localhost:3000`	•	Bookmark button

	•	Data loaded using query parameters

5. **Open the application**

   - Open `login.html` in your browser6. Account Page

   - Or open `index.html` to go directly to the home page	•	Profile picture upload (saved to localStorage)

	•	Username section

## 📁 Project Structure	•	Age group + settings using checkboxes



```⸻

gamearly-main/
├── server.js              # Express backend
├── package.json           # Dependencies
├── .env                   # Environment variables (DO NOT COMMIT)
├── .env.example          # Example environment file
├── userInfoDB.txt        # User database
│
├── index.html            # Home page
├── login.html            # User login
├── create.html           # Account creation
├── bookmarks.html        # Saved games
├── explore.html          # AI chat
├── account.html          # User profile
│
├── styles.css            # Global styles
├── app.js                # Frontend JavaScript
└── data.js               # Game database
```

## 🔧 API Endpoints

- `POST /register` - Create account
- `POST /login` - User login
- `POST /reset-password` - Reset password
- `POST /chat` - AI recommendations

## 🔐 Important for GitHub

✅ **What's Safe to Upload:**
- All HTML, CSS, JavaScript files
- package.json
- .gitignore
- .env.example
- README.md

⚠️ **DO NOT Upload:**
- `.env` file (contains your API key)
- `node_modules/` folder
- `userInfoDB.txt` (contains user data)

These are already excluded in `.gitignore`

## 📝 After Cloning from GitHub

1. Run `npm install` to install dependencies
2. Create `.env` file and add your OpenAI API key
3. Run `node server.js` to start the server
4. Open `login.html` in your browser

## 🐛 Known Issues

- Plain text password storage (dev only)
- No email verification
- Limited game database (9 games)

## 🚀 Future Enhancements

- Real database (MongoDB/PostgreSQL)
- Password encryption
- Email verification
- Expand game catalog
- User ratings and reviews

## 👥 Contributors

Chan1205

---

**⚠️ Important:** Never commit your `.env` file with API keys to GitHub!
