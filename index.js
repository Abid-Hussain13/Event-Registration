import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import db from './db.js';
import session from 'express-session';
import flash from 'connect-flash';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;

app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.use(session({
  secret: 'your-secret-key',  
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));
app.use(flash());

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

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in first!');
  res.redirect('/login');
}

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

app.post('/signup/submit', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    req.flash('error', 'All fields are required!');
    return res.redirect('/signup');
  }

  const checkQuery = 'SELECT * FROM user WHERE email = ?';
  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      req.flash('error', 'Database error!');
      return res.redirect('/signup');
    }

    if (results.length > 0) {
      req.flash('error', 'Email already registered!');
      return res.redirect('/signup');
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        req.flash('error', 'Error hashing password!');
        return res.redirect('/signup');
      }

      const query = 'INSERT INTO user (username, email, password, role) VALUES (?, ?, ?, ?)';
      db.query(query, [username, email, hashedPassword, 'user'], (err, result) => {
        if (err) {
          req.flash('error', 'Database error, please try again!');
          console.log(err);
          return res.redirect('/signup');
        }

        req.flash('success', 'Signup successful! Welcome!');
        res.redirect('/login');
      });
    });
  });
});

app.post('/login/submit', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Please fill in all fields');
    return res.redirect('/login');
  }

  const query = 'SELECT * FROM user WHERE email = ?';
  db.query(query, [email], (err, result) => {
    if (err || result.length === 0) {
      req.flash('error', 'Invalid email or password');
      console.log(err);
      return res.redirect('/login');
    }

    const user = result[0];  
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        req.flash('error', 'Invalid email or password');
        console.log(err);
        return res.redirect('/login');
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      req.flash('success', 'Login successful!');
      res.redirect('/');  
    });
  });
});

app.get("/booking", isAuthenticated, (req, res) => {
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');
  const formData = req.session.bookedData || {};
  delete req.session.bookedData;
  const bookingErr = req.flash('bookingError');
  res.render("booking.ejs", { successMessage, errorMessage, bookingErr, formData});
});

app.post("/submitBooking", (req, res) => {
  const { name, email, phone, eventDate, eventType, numPersons, decoration, message, price } = req.body;

  const dateCheck = `Select eventDate from bookings where eventDate = ?`;
  db.query(dateCheck, [eventDate], (err, result) =>{
    if(err){
      console.log("Database Err: ", err);
      return res.status(505).send("Database Error occurs.");
    }
    if(result.length > 0){
      console.log("Event is Already booked on this day.");
      req.flash("bookingError", " Event is already booked on this day.");
      req.session.bookedData = req.body;
      return res.redirect("/booking");
    }
  const userID = req.session.user?.id;
  const query = `
    INSERT INTO bookings (name, email, phone, eventDate, eventType, numPersons, decoration, message, userID, price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [name, email, phone, eventDate, eventType, numPersons, decoration, message, userID, price], (err, result) => {
    if (err) {
      console.error('Error inserting data into database:', err);
      return res.status(500).send('There was an error processing your booking.');
    }
    
    console.log('Booking successful:', result);
    res.redirect('/events');
  });
  
});
});

app.get("/events", isAuthenticated, (req, res) => {
  if(req.session.user?.role == "admin"){
    const query = "select * from bookings";
    db.query(query, (err, results)=>{
      if(err){
        console.log("Error fetching bookings: ",err);
        return res.status(500).send("Database error");
      }
      res.render("events", { bookings: results, user: req.session.user, successMessage: [], errorMessage: [] });
    })
  }else{
  const query = "SELECT * FROM bookings where userID = ?"; 

  db.query(query, [req.session.user?.id], (err, results) => {
      if (err) {
          console.error("Error fetching bookings:", err);
          return res.status(500).send("Database error");
      }
      res.render("events", { bookings: results, user: req.session.user, successMessage: [], errorMessage: [] });
  });}
});

app.post("/deleteEvent/:id",isAuthenticated, (req, res) =>{
  if(req.session.user.role != "admin"){
    return res.status(403).send("Unauthorized");
  }
  const eventId = req.params.id;
  const query = `delete from bookings where id = ?`;
  db.query(query,[eventId], (error, result) => {
    if(error){
      req.flash("Delete err : ", err);
      return res.status(500).send("Database error");
    }
    req.flash("success", "Event Delete Successfully");
    res.redirect('/events');
  })
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
