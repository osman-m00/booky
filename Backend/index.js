const express = require("express");
const app = express();
const port = 3000;
const cors = require('cors');
const helmet = require('helmet');
const { clerkAuth } = require('./middleware/clerkAuth'); // fix path if needed
require('dotenv').config();

const booksRoutes = require('./routes/books');
const usersRoutes = require('./routes/users');
const libraryRoutes = require('./routes/library');
const reviewRoutes = require('./routes/reviews');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(clerkAuth);

// routes
app.use('/api/books', booksRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
