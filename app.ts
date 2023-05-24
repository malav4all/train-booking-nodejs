import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
const allowedOrigins = ["http://localhost:3001"];

// publish 1
app.use(cors());
// app.disable('etag');
// app.use(cors({origin: '*'}));
// Reflect the origin if it's in the allowed list or not defined (cURL, Postman, etc.)
const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed by CORS"));
    }
  },
};
// Enable preflight requests for all routes
app.options("*", cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/train_booking");

// Define Seat schema
const seatSchema = new mongoose.Schema({
  seatNumber: { type: Number },
  isAvailable: { type: Boolean },
});

const Seat = mongoose.model("Seat", seatSchema);

// Initialize seats in the database
const initializeSeats = async () => {
  try {
    const seats: any[] = [];
    let seatNumber = 1;

    for (let i = 0; i < 80; i++) {
      let numSeatsInRow = 1;
      for (let j = 0; j < numSeatsInRow; j++) {
        seats.push({ seatNumber: seatNumber, isAvailable: false });
        seatNumber++;
      }
    }
    await Seat.insertMany(seats);
  } catch (error) {
    console.log(error);
  }
};

// Get all seats
app.get("/api/seats", async (req: any, res: any) => {
  try {
    const seats = await Seat.find();
    res.json(seats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Book seats
app.post("/api/book", async (req: any, res: any) => {
  const { bookingCount } = req.body;

  try {
    const availableSeats = await Seat.find({ isAvailable: false });

    if (bookingCount > availableSeats.length) {
      return res
        .status(400)
        .json({ errorMessage: "Insufficient seats available" });
    }

    const selectedSeats = availableSeats.slice(0, bookingCount);
    const selectedSeatNumbers = selectedSeats.map((seat) => seat.seatNumber);

    await Seat.updateMany(
      { seatNumber: { $in: selectedSeatNumbers } },
      { isAvailable: true }
    );

    const updatedSeats = await Seat.find();

    res.json({ selectedSeats: selectedSeatNumbers, updatedSeats });
  } catch (error) {
    console.error("Error booking seats:", error);
    res.status(500).json({ error: "Failed to book seats" });
  }
});
// initializeSeats();
// Start the server
const port = 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
