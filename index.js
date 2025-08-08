const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const dotenv = require('dotenv');
const mysql = require('mysql');
const crypto = require('crypto');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Set EJS as the templating engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// =======================================================================
// NOTE FOR VERCEL DEPLOYMENT:
// This section for MySQL connection is commented out because it requires
// a live database to be connected. Vercel doesn't host databases.
//
// To use this, you must set up an external database (e.g., PlanetScale,
// AWS RDS, Neon, etc.) and configure your Vercel environment variables
// (DB_HOST, DB_USER, etc.) to connect to it.
// =======================================================================

/*
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
    // On Vercel, if the database is critical, you might let the deployment fail.
    // Locally, this is good for a fail-fast strategy.
  } else {
    console.log("Connected to the MySQL Database.");
    connection.release(); // IMPORTANT: Release the connection back to the pool
  }
});
*/

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// CSRF Protection
// Note: csurf needs session support, but if used with cookieParser, it's ok.
// Make sure you are passing the CSRF token to all your forms.
app.use(csurf({ cookie: true }));

// CSRF Error Handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // This is a CSRF token error
    return res.status(403).render('error', {
      title: 'Invalid CSRF Token',
      message: 'The submitted form had an invalid security token. Please try again.',
      csrfToken: req.csrfToken()
    });
  }
  next(err);
});

// =======================================================================
// WARNING: Plain-text password comparison is a major security risk.
// You should hash passwords (e.g., using bcrypt) and compare the hash.
// This example is for demonstration only and is NOT secure.
// =======================================================================
function authenticateUser(username, password, callback) {
  // This is a placeholder function for demonstration.
  // Replace this with your actual database query and password check.
  // For Vercel, this would require your database connection.
  if (username === 'test' && password === 'password') {
    return callback(null, true);
  } else {
    return callback(null, false);
  }
}

// Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'Ambit', csrfToken: req.csrfToken() });
});

// NOTE: Fixed typo 'authetnication' to 'authentication'
app.post('/authentication/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // NOTE: This call will fail unless you uncomment and configure your database.
  // The current implementation is a placeholder.
  authenticateUser(username, password, (err, isValid) => {
    if (err) {
      console.error('Authentication error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }

    if (isValid) {
      // NOTE: sessionCookie is generated but not saved or used.
      // You would typically use a session management library here.
      const sessionCookie = crypto.randomBytes(32).toString('hex');
      return res.status(200).json({ message: 'Login successful!', session: sessionCookie });
    } else {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
  });
});

app.get('/signup', (req, res) => {
  res.render('register-account', { title: 'Ambit | Register', csrfToken: req.csrfToken() });
});

app.get('/api/authentication/discord/oauth', (req, res) => {
  res.status(200).json({ message: 'Discord OAuth endpoint hit.' });
});

app.get('/api/authentication/roblox/oauth', (req, res) => {
  res.status(200).json({ message: 'Roblox OAuth endpoint hit.' });
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
    { title: 'Marketing Strategy 2024', author: 'Jane Smith', lastUpdated: '2024-06-07 02:45 PM' },
  ];
  const recentActivities = [
    { description: '13 Minutes', time: 'Yesterday at 4:53PM', type: 'Session' },
    { description: '60 Minutes', time: 'Thursday at 2:01PM', type: 'Adjustment' },
    { description: '-8 Minutes', time: 'Tuesday at 10:52AM', type: 'Adjustment' },
    { description: '80 Minutes', time: 'Monday at 1:29PM', type: 'Session' },
    { description: '109 Minutes', time: 'Monday at 9:02AM', type: 'Session' },
  ];
  // NOTE: Fixed typo 'worksapcehome' to 'workspacehome'
  res.render('workspacehome', {
    userName: userName,
    totalMinutes: totalMinutes,
    averageDaily: averageDaily,
    totalChats: totalChats,
    quickDocs: quickDocs,
    recentActivities: recentActivities,
    csrfToken: req.csrfToken(),
  });
});

app.get('/features', (req, res) => {
  res.render('features', {
    title: 'Ambit | Features',
    csrfToken: req.csrfToken(),
  });
});

app.get('/testimonials', (req, res) => {
  res.render('testimonials', {
    title: 'Ambit | Testimonials',
    csrfToken: req.csrfToken(),
  });
});

app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Ambit | Sign In',
    csrfToken: req.csrfToken(),
  });
});


// =======================================================================
// CRITICAL CHANGE FOR VERCEL DEPLOYMENT
// =======================================================================

// 1. You MUST remove `app.listen()` because Vercel handles the server for you.
// 2. You MUST export the `app` instance using `module.exports`.
//
// This is the correct way to make your Express app a Vercel serverless function.
module.exports = app;

// The following is for local development only and must be commented out
// or removed before deploying to Vercel.
/*
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
*/
