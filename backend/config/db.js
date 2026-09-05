const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dbName = process.env.DB_NAME || process.env.db_Name || process.env.d_bName;

    await mongoose.connect(process.env.MONGO_URI, {
      ...(dbName ? { dbName } : {}),
    });
    console.log(`Database Connection Successfully`);
  } catch (error) {
    console.log(`Error in Connection with Database. ${error}`);
  }
};

module.exports = connectDB;
