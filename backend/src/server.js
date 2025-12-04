import express from 'express';
import mongoose from 'mongoose';

// create an express application
const app = express();

//set port number
const port = 4000 //http:localhost:4000


// connection with database
mongoose.connect('mongodb://localhost:27017/estore')
.then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

//user model 

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);  // main api bhaneko http:localhost:4000 ho 
});