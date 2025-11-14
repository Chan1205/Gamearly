import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = join(__dirname, 'userInfoDB.txt');

// Helper function to sanitize user input
function sanitize(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n]/g, ' ').trim();
}

// Game data from the application
const GAMES = [
  { id: "elden-ring", title: "Elden Ring", genres: ["Action", "RPG"], rating: 4.9, price: 59.99, year: 2022 },
  { id: "hades", title: "Hades", genres: ["Rogue-like", "Indie", "Action"], rating: 4.8, price: 24.99, year: 2020 },
  { id: "stardew", title: "Stardew Valley", genres: ["Indie", "Simulation", "RPG"], rating: 4.7, price: 14.99, year: 2016 },
  { id: "balatro", title: "Balatro", genres: ["Card", "Rogue-like", "Indie"], rating: 4.6, price: 19.99, year: 2024 },
  { id: "gow", title: "God of War", genres: ["Action", "Adventure"], rating: 4.8, price: 39.99, year: 2018 },
  { id: "minecraft", title: "Minecraft", genres: ["Sandbox", "Survival", "Indie"], rating: 4.5, price: 26.95, year: 2011 },
  { id: "hollow-knight", title: "Hollow Knight", genres: ["Metroidvania", "Indie", "Action"], rating: 4.7, price: 14.99, year: 2017 },
  { id: "fortnite", title: "Fortnite", genres: ["Battle Royale", "Shooter"], rating: 4.0, price: 0, year: 2017 },
  { id: "botw", title: "Zelda: Breath of the Wild", genres: ["Adventure", "RPG"], rating: 4.9, price: 59.99, year: 2017 }
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Optional: Add a homepage so you don’t see “Cannot GET /”
app.get("/", (req, res) => {
  res.send("✅ AI Chat Server is running!");
});

// ✅ Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // Check if user is asking for a comparison
    const isComparison = /\b(compare|vs|versus|difference between)\b/i.test(message);

    // Create system message with game database context
    const systemMessage = {
      role: "system",
      content: `You are a helpful game assistant for GAMEARLY, a game discovery platform. You can ONLY provide information about games in our database. Do not mention or recommend games outside of this list.

Our complete game catalog:
${GAMES.map(g => `- ${g.title} (${g.year}): ${g.genres.join(", ")} | Rating: ${g.rating}/5 | Price: $${g.price === 0 ? "Free" : g.price}`).join("\n")}

IMPORTANT RULES:
1. ONLY answer questions using data from the games listed above
2. If asked about a game not in our database, politely say "We don't have that game in our catalog yet"
3. When recommending or suggesting games, format each game as a BULLET POINT with ONE game per line
4. Keep responses under 200 words and friendly
5. Flash sale games are: Hades ($24.99) and Balatro ($19.99)
6. If asked about genres, prices, or ratings, use ONLY the exact data shown above
7. BULLET POINT FORMAT for suggestions: Use this format when listing or recommending games:
   • Game Title ($Price) - Genre | Rating ⭐ - Brief note
   Example: • Hades ($24.99) - Rogue-like, Indie, Action | 4.8⭐ - Great for fast-paced action fans

${isComparison ? `8. COMPARISON FORMAT: When comparing games, use this EXACT format:
[COMPARE]
GAME1: Game Name Here
Title: Full Title
Genres: Genre1, Genre2
Rating: X.X/5
Price: $XX.XX
Year: XXXX
Summary: Brief description
---
GAME2: Game Name Here
Title: Full Title
Genres: Genre1, Genre2
Rating: X.X/5
Price: $XX.XX
Year: XXXX
Summary: Brief description
[/COMPARE]` : ''}`
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        systemMessage,
        { role: "user", content: message }
      ],
    });

    const reply = response.choices[0].message.content;

    // Check if response is a comparison
    if (reply.includes('[COMPARE]') && reply.includes('[/COMPARE]')) {
      res.json({ reply, isComparison: true });
    } else {
      res.json({ reply, isComparison: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ✅ User Registration endpoint
app.post("/register", async (req, res) => {
  try {
    const email = sanitize(req.body.email);
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);

    if (!email || !username || !password) {
      return res.status(400).json({ ok: false, error: 'All fields required' });
    }

    const line = `${email}\t${username}\t${password}\n`;

    fs.appendFile(DB_FILE, line, (err) => {
      if (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ ok: false, error: 'Write failed' });
      }
      return res.json({ ok: true });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ ok: false, error: 'Registration failed' });
  }
});

// ✅ User Login endpoint
app.post("/login", async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Username and password required' });
    }

    fs.readFile(DB_FILE, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return res.status(404).json({ ok: false, error: 'Database empty' });
        }
        return res.status(500).json({ ok: false, error: 'Read failed' });
      }

      const lines = data.split(/\r?\n/).filter(l => l.trim().length > 0);
      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          const emailF = parts[0];
          const userF = parts[1];
          const passF = parts[2];

          if (userF === username && passF === password) {
            return res.json({ ok: true, email: emailF, username: userF });
          } else if (userF === username && passF !== password) {
            return res.status(401).json({ ok: false, error: 'Incorrect password' });
          }
        }
      }
      return res.status(404).json({ ok: false, error: 'Username not found' });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ ok: false, error: 'Login failed' });
  }
});

// ✅ Password Reset endpoint
app.post("/reset-password", async (req, res) => {
  try {
    const email = (req.body.email || '').trim();
    const username = (req.body.username || '').trim();
    const newPassword = req.body.newPassword || '';

    if (!email || !username || !newPassword) {
      return res.status(400).json({ ok: false, error: 'All fields required' });
    }

    fs.readFile(DB_FILE, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return res.status(404).json({ ok: false, error: 'Database empty' });
        }
        return res.status(500).json({ ok: false, error: 'Read failed' });
      }

      const lines = data.split(/\r?\n/);
      let found = false;
      let updatedLines = [];

      for (const line of lines) {
        if (line.trim().length === 0) {
          updatedLines.push(line);
          continue;
        }

        const parts = line.split('\t');
        if (parts.length >= 3) {
          const emailF = parts[0];
          const userF = parts[1];

          if (emailF === email) {
            if (userF === username) {
              updatedLines.push(`${emailF}\t${userF}\t${newPassword}`);
              found = true;
            } else {
              updatedLines.push(line);
              return res.status(400).json({ ok: false, error: 'Email and username do not match' });
            }
          } else {
            updatedLines.push(line);
          }
        } else {
          updatedLines.push(line);
        }
      }

      if (!found) {
        return res.status(404).json({ ok: false, error: 'Email not found' });
      }

      fs.writeFile(DB_FILE, updatedLines.join('\n'), (err) => {
        if (err) {
          return res.status(500).json({ ok: false, error: 'Update failed' });
        }
        return res.json({ ok: true });
      });
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ ok: false, error: 'Reset failed' });
  }
});

app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
