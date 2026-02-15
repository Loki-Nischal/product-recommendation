import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // prefer env var, fallback to loopback IPv4 to avoid IPv6 (::1) issues on some systems
    let uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/estore";
    // convert localhost to 127.0.0.1 to avoid ::1 resolution which can cause ECONNREFUSED
    uri = uri.replace("localhost", "127.0.0.1");

    // Mongoose recommended options
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error(`Tried URI: ${process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/estore'}`);
    console.error('Possible fixes: 1) Start mongod locally, 2) Ensure MONGO_URI points to a running MongoDB instance, 3) Use MongoDB Atlas and update .env');
    process.exit(1);
  }
};

export default connectDB;
