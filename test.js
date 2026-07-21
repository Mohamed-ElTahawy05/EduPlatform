const mongoose = require("mongoose");

async function test() {
  try {
    console.log("Before connect");

    await mongoose.connect(
      "mongodb+srv://mn224970_db_user:<db_password>@eduplatform.bnp82i9.mongodb.net/?appName=EduPlatform",
      {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      }
    );

    console.log("Connected");
  } catch (err) {
    console.log("ERROR:");
    console.log(err.message);
  }
}

test();