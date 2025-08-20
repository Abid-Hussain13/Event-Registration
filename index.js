import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pool from './db.js';
import session from 'express-session';
import flash from 'connect-flash';
import serverless from 'serverless-http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Middleware setup
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(flash());

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in first!');
  res.redirect('/login');
}

// Routes
app.get('/', (req, res) => {
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');

  res.render('index.ejs', {
    username: req.session.user ? req.session.user.username : null,
    image1: 'img1.jpg',
    image2: 'img2.jpg',
    image3: 'img3.jpg',
    successMessage,
    errorMessage
  });
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs", { 
    error: req.flash("error"), 
    success: req.flash("success") 
  });
});

app.get('/login', (req, res) => {
  res.render('login.ejs', {
    messages: req.flash()  
  });
});

app.post('/signup/submit', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    req.flash('error', 'All fields are required!');
    return res.redirect('/signup');
  }

  try {
    const checkQuery = 'SELECT * FROM user WHERE email = ?';
    const [results] = await pool.promise().query(checkQuery, [email]);

    if (results.length > 0) {
      req.flash('error', 'Email already registered!');
      return res.redirect('/signup');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO user (username, email, password, role) VALUES (?, ?, ?, ?)';
    await pool.promise().query(query, [username, email, hashedPassword, 'user']);

    req.flash('success', 'Signup successful! Welcome!');
    res.redirect('/login');
  } catch (err) {
    console.error('Signup error:', err);
    req.flash('error', 'Database error, please try again!');
    res.redirect('/signup');
  }
});

app.post('/login/submit', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Please fill in all fields');
    return res.redirect('/login');
  }

  try {
    const query = 'SELECT * FROM user WHERE email = ?';
    const [result] = await pool.promise().query(query, [email]);

    if (result.length === 0) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    req.flash('success', 'Login successful!');
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Invalid email or password');
    res.redirect('/login');
  }
});

app.get("/booking", isAuthenticated, (req, res) => {
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');
  const formData = req.session.bookedData || {};
  delete req.session.bookedData;
  const bookingErr = req.flash('bookingError');
  res.render("booking.ejs", { successMessage, errorMessage, bookingErr, formData});
});

app.post("/submitBooking", async (req, res) => {
  const { name, email, phone, eventDate, eventType, numPersons, decoration, message, price } = req.body;

  try {
    const dateCheck = `SELECT eventDate FROM bookings WHERE eventDate = ?`;
    const [result] = await pool.promise().query(dateCheck, [eventDate]);

    if (result.length > 0) {
      console.log("Event is Already booked on this day.");
      req.flash("bookingError", "Event is already booked on this day.");
      req.session.bookedData = req.body;
      return res.redirect("/booking");
    }

    const userID = req.session.user?.id;
    const query = `
      INSERT INTO bookings (name, email, phone, eventDate, eventType, numPersons, decoration, message, userID, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.promise().query(query, [name, email, phone, eventDate, eventType, numPersons, decoration, message, userID, price]);
    
    console.log('Booking successful');
    res.redirect('/events');
  } catch (err) {
    console.error('Error inserting data into database:', err);
    res.status(500).send('There was an error processing your booking.');
  }
});

app.get("/events", isAuthenticated, async (req, res) => {
  try {
    let query, queryParams = [];

    if (req.session.user?.role === "admin") {
      query = "SELECT * FROM bookings";
    } else {
      query = "SELECT * FROM bookings WHERE userID = ?";
      queryParams = [req.session.user?.id];
    }

    const [results] = await pool.promise().query(query, queryParams);
    res.render("Events", { 
      bookings: results, 
      user: req.session.user, 
      successMessage: req.flash('success'), 
      errorMessage: req.flash('error') 
    });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).send("Database error");
  }
});

app.post("/deleteEvent/:id", isAuthenticated, async (req, res) => {
  if (req.session.user.role !== "admin") {
    return res.status(403).send("Unauthorized");
  }

  try {
    const eventId = req.params.id;
    const query = `DELETE FROM bookings WHERE id = ?`;
    await pool.promise().query(query, [eventId]);
    
    req.flash("success", "Event deleted successfully");
    res.redirect('/events');
  } catch (err) {
    console.error("Delete error:", err);
    req.flash("error", "Failed to delete event");
    res.status(500).send("Database error");
  }
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

export const handler = serverless(app);