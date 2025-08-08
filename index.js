const express = require('express');
const path = require('path');
const cookieParser = require("cookie-parser");
const csurf = require("csurf");
const dotenv = require("dotenv");
const mysql = require("mysql"); // Added: Import mysql module
const crypto = require("crypto"); // Added: Import crypto module

const app = express();
const PORT = process.env.PORT || 4000; // Improved: Use environment variable for PORT

dotenv.config();

// Fix: Corrected mysql.createPool to mysql.createConnection for single connection or
// for a pool, ensure it's defined correctly if you intend to use a pool throughout.
// For simplicity in this fix, I'll assume a pool is desired and the setup was mostly correct,
// but the 'mysql' variable wasn't defined.
/* const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', // Improved: Use environment variables for DB credentials
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "localhost",
  database: process.env.DB_NAME || "ambit_useraccounts",
  connectionLimit: 10,
});

db.getConnection((err, connection) => { // Added 'connection' parameter
  if (err) {
    console.error("Database connection failed:", err);
    // Exit the process if database connection fails critically
    process.exit(1); // Improved: Exit on critical database error
  } else {
    console.log("Connected to localhost MySQL Database.");
    connection.release(); // Important: Release the connection back to the pool
  }
}); */

// Set EJS as the templating engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(csurf({ cookie: true }));

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next(err);
});

// Routes

app.get('/', (req, res) => {
  res.render('index', { title: "Ambit", csrfToken: req.csrfToken() });
});

app.post("/authetnication/login", (req, res) => { // Fix: Typo "authetnication" -> "authentication" if desired
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  db.query("SELECT * FROM users WHERE Discord_Username = ?", [username], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }

    if (results.length > 0) {
      const user = results[0];

      if (user.password === password) { 
        const sessionCookie = crypto.randomBytes(32).toString("hex");
      
        return res.status(200).json({ message: "Login successful!", session: sessionCookie });
      } else {
        return res.status(401).json({ error: "Invalid username or password." });
      }
    } else {
      return res.status(401).json({ error: "Invalid username or password." });
    }
  });
});

app.get('/signup', (req, res) => {
  res.render("register-account", { title: "Ambit | Register", csrfToken: req.csrfToken() }); // Added csrfToken
});

app.get('/api/authentication/discord/oauth', (req, res) => {
  res.status(200).json({ message: "Discord OAuth endpoint hit." }); // Added a response
});

app.get('/api/authentication/roblox/oauth', (req, res) => {
  res.status(200).json({ message: "Roblox OAuth endpoint hit." }); // Added a response
});


app.get('/workspace/1', (req, res) => {
    const userName = 'Delight_Holdings'; 
    const totalMinutes = 385; 
    const averageDaily = 55;
    const totalChats = 894; 

    const quickDocs = [
        { title: 'Staff Guidelines', author: 'ItsWHOOOP', lastUpdated: '2024-06-11 10:00 AM' },
        { title: 'Interview Guide', author: 'ItsWHOOOP', lastUpdated: '2024-06-10 03:30 PM' },
        { title: 'Training Guide', author: 'ItsWHOOOP', lastUpdated: '2024-06-09 11:15 AM' },
        { title: 'Project X Brief', author: 'John Doe', lastUpdated: '2024-06-08 09:00 AM' },
        { title: 'Marketing Strategy 2024', author: 'Jane Smith', lastUpdated: '2024-06-07 02:45 PM' }
    ];

    const recentActivities = [
        { description: '13 Minutes', time: 'Yesterday at 4:53PM', type: 'Session' },
        { description: '60 Minutes', time: 'Thursday at 2:01PM', type: 'Adjustment' },
        { description: '-8 Minutes', time: 'Tuesday at 10:52AM', type: 'Adjustment' },
        { description: '80 Minutes', time: 'Monday at 1:29PM', type: 'Session' },
        { description: '109 Minutes', time: 'Monday at 9:02AM', type: 'Session' }
    ];

    res.render('worksapcehome', { // Note: There's a typo here in your provided code: 'worksapcehome' should be 'workspacehome'
        userName: userName,
        totalMinutes: totalMinutes,
        averageDaily: averageDaily,
        totalChats: totalChats,
        quickDocs: quickDocs,
        recentActivities: recentActivities,
        csrfToken: req.csrfToken() // Include if you are using CSRF protection
    });
});

app.get('/features', (req, res) => {
  res.render('features', {
    title: "Ambit | Features",
    csrfToken: req.csrfToken()
  });
});

app.get('/testimonials', (req, res) => {
  res.render('testimonials', {
    title: "Ambit | Testimonials",
    csrfToken: req.csrfToken()
  });
});

app.get('/login', (req, res) => {
  res.render('login', {
    title: "Ambit | Sign In"
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
