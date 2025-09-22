const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Storage config for uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save in uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});

const upload = multer({ storage: storage });

// API route to upload image
app.post("/report", upload.single("image"), (req, res) => {
  const { latitude, longitude } = req.body;
  const imagePath = req.file.path;

  // Here, ideally, save {lat,long,imagePath,timestamp} in DB
  res.json({
    success: true,
    message: "Report submitted successfully!",
    data: {
      latitude,
      longitude,
      image: imagePath,
    },
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
