const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('./models/user');
const FlightModel = require('./models/flight');
const BookingModel = require('./models/booking');
// index.js

const User = require('./models/user');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'mysecretkey';

const dbUrl = 'mongodb+srv://nithishrajprof09:L53M3cN5CCSOyxMY@cluster0.3zy9drr.mongodb.net/myapp?retryWrites=true&w=majority';
const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(dbUrl, connectionParams)
  .then(() => {
    console.info('Connected to the DB');
  })
  .catch((e) => {
    console.log('Error:', e);
  });

app.use(express.json());

// User Use Cases

// User Sign up
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(409).send({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({ email, password: hashedPassword, name });
    await user.save();
    res.status(200).send({ message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.status(200).send({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Searching for flights based on date and time
app.get('/api/flights', async (req, res) => {
  try {
    const { date, time } = req.query;
    const flights = await FlightModel.find({ date, time });
    res.status(200).send({ flights });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Internal server error' });
  }
});

app.get("/search", async (req, res) => {
  try {
    const date = req.query.date;
    const time = req.query.time;

    // Find all flights that depart on the given date and time
    const flights = await FlightModel.find({
      departureDate: date,
      departureTime: time
    });

    res.status(200).send({ flights });
  } catch (err) {
    console.error(err);
    res.status(500).send({ "error": "Internal server error" });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { flightId } = req.body;
    const flight = await FlightModel.findById(flightId);
    if (!flight) {
      return res.status(404).send({ error: 'Flight not found' });
    }
    if (flight.seatsLeft === 0) {
      return res.status(400).send({ error: 'No seats left on this flight' });
    }
    const booking = new BookingModel({ flightId });
    await booking.save();
    flight.seatsLeft--;
    await flight.save();
    res.status(200).send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Server error' });
  }
});

app.post("/book/:flightNumber", async (req, res) => {
  try {
    const flightNumber = req.params.flightNumber;
    const userId = req.session.userId;

    // Find the flight by its number
    const flight = await FlightModel.findOne({ number: flightNumber });

    // Check if there are still available seats
    if (flight.availableSeats > 0) {
      // Update the flight's available seats count
      flight.availableSeats--;
      await flight.save();

      // Create a new booking for the user
      const booking = new BookingModel({
        flight: flight._id,
        user: userId
      });
      await booking.save();

      res.status(200).send({ "msg": "Booking successful" });
    } else {
      res.status(400).send({ "error": "No available seats on this flight" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ "error": "Internal server error" });
  }
});

app.get("/bookings", async (req, res) => {
  try {
    const userId = req.session.userId;

    // Find all bookings for the current user
    const bookings = await BookingModel.find({ user: userId })
      .populate("flight");

    res.status(200).send({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).send({ "error": "Internal server error" });
  }
});

// Admin user model
const AdminUserModel = mongoose.model("AdminUser", new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));


