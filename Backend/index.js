const express = require("express");
const app = express();
const port = 3000;
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const booksRoutes = require('./routes/books');
const usersRoutes = require('./routes/users');
const libraryRoutes = require('./routes/library');

//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

//routes
app.use('/api/books', booksRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/library', libraryRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});