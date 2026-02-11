const mongoose = require("mongoose");

async function connectDb() {
    
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");
  } 
  catch (err) {
    console.error("Error connecting to MongoDB ", err);
  }
}

module.exports = connectDb;
