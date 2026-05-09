const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // For Blynk API

const app = express();
const PORT = process.env.PORT || 3000;

// Path to JSON Database
const DB_FILE = path.join(__dirname, 'db.json');

// Helper to read DB
const readDB = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading database:", err);
        return { users: [], sensorLogs: [], lcdMessage: { currentText: "WELCOME" } };
    }
};

// Helper to write DB
const writeDB = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing to database:", err);
    }
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public'))); // Serve frontend from public folder

// Session configuration
app.use(session({
    secret: 'sistec_iot_secret_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS only
}));

// =======================
// AUTHENTICATION APIs
// =======================

// Register
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    let db = readDB();
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), name, email, password: hashedPassword };

    db.users.push(newUser);
    writeDB(db);

    res.json({ message: 'Registration successful' });
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let db = readDB();
    const user = db.users.find(u => u.email === email);

    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    req.session.userId = user.id;
    req.session.userName = user.name;
    res.json({ message: 'Login successful', name: user.name });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out' });
});

// Check Auth Status
app.get('/api/auth-status', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, name: req.session.userName });
    } else {
        res.json({ loggedIn: false });
    }
});

// =======================
// SENSOR DATA APIs
// =======================

// ESP8266 posts data here
app.post('/api/sensor-data', (req, res) => {
    const { temperature, humidity } = req.body;

    if (temperature === undefined || humidity === undefined) {
        return res.status(400).json({ error: 'Missing data' });
    }

    let db = readDB();

    // Create Date and Time in Asia/Kolkata timezone
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    const timeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

    const newLog = {
        id: Date.now().toString(),
        temperature,
        humidity,
        lcdMessage: db.lcdMessage.currentText,
        date: dateStr,
        time: timeStr
    };

    db.sensorLogs.unshift(newLog); // Add to beginning
    writeDB(db);

    res.send("DATA SENT...!!");
});

// Fetch latest data for dashboard cards
app.get('/api/latest-data', (req, res) => {
    let db = readDB();
    if (db.sensorLogs.length > 0) {
        res.json(db.sensorLogs[0]);
    } else {
        res.json({ temperature: "--", humidity: "--", date: "--", time: "--" });
    }
});

// Fetch history table
app.get('/api/history', (req, res) => {
    let db = readDB();
    res.json(db.sensorLogs);
});

// Delete history record
app.delete('/api/history/:id', (req, res) => {
    const { id } = req.params;
    let db = readDB();
    db.sensorLogs = db.sensorLogs.filter(log => log.id !== id);
    writeDB(db);
    res.json({ message: 'Deleted successfully' });
});

// =======================
// LCD MESSAGE APIs
// =======================

// ESP8266 fetches text from here
app.get('/api/lcd-message', (req, res) => {
    let db = readDB();
    res.send(db.lcdMessage.currentText);
});

// Dashboard updates text
app.post('/api/lcd-message', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    let db = readDB();
    db.lcdMessage.currentText = text.substring(0, 16); // Max 16 chars
    writeDB(db);

    res.json({ message: 'LCD Text updated', currentText: db.lcdMessage.currentText });
});

// =======================
// BLYNK LED CONTROL APIs
// =======================
// Replace this token with your actual Blynk Auth Token
const BLYNK_TOKEN = "KPOTaW6EXO--p8l2DQUJR2TFRt8om-o6";

app.post('/api/led/:state', async (req, res) => {
    const state = req.params.state === 'on' ? '1' : '0';
    try {
        const url = `https://blynk.cloud/external/api/update?token=${BLYNK_TOKEN}&D12=${state}`;
        await axios.get(url);
        res.json({ message: `LED turned ${req.params.state.toUpperCase()}` });
    } catch (err) {
        console.error("Blynk Error:", err.message);
        res.status(500).json({ error: 'Failed to contact Blynk Cloud' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
