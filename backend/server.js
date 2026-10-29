
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// API kiểm tra trạng thái backend
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Food Management API is running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
