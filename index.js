const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/journalapp')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.get('/', (req, res) => {
    res.send('Journal App API Running');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/journals', require('./routes/journal'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
