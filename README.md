# SISTec IoT Application 2026

A complete, beginner-friendly full-stack IoT dashboard integrated with an ESP8266 ESP-12F board. This project uses an HTML/Tailwind CSS frontend, a Node.js/Express.js backend, a simple JSON Database (`db.json`), and interfaces with ESP8266 for DHT11 sensor logging, LCD messaging, and Blynk for LED control.

## Project Structure

```text
d:/coding/iot_project/
├── backend/
│   ├── server.js            # Node.js Express server
│   ├── db.json              # Simple JSON Database
│   └── package.json         # Backend dependencies
│
├── public/
│   ├── index.html           # Login page
│   ├── register.html        # Registration page
│   ├── dashboard.html       # Main IoT Dashboard UI
│   ├── style.css            # Custom CSS styles
│   └── app.js               # Frontend Logic
│
├── esp8266/
│   └── esp8266_code.ino     # Arduino Code for ESP-12F
│
└── README.md                # Documentation
```

## Hardware Connections

1. **DHT11 Sensor:**
   - VCC -> 3.3V
   - GND -> GND
   - DATA -> D5

2. **I2C LCD Display (16x2):**
   - VCC -> 5V (or VIN)
   - GND -> GND
   - SDA -> D2
   - SCL -> D1

3. **LED (via Blynk):**
   - Setup a device in Blynk Cloud.
   - Use Virtual Pin **V0** to trigger the LED in your Blynk code, or use this dashboard to send HTTP triggers to it.

## Local Installation & Setup

1. **Install Node.js:** Download from [nodejs.org](https://nodejs.org/).
2. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Start the Server:**
   ```bash
   npm start
   # Or use 'npm run dev' to use nodemon
   ```
5. **Access the Dashboard:**
   Open your browser and navigate to `http://localhost:3000`.

## Testing APIs Manually

You can test the APIs using tools like Postman or Thunder Client:
- **POST /api/sensor-data**
  - Body (JSON): `{"temperature": 25.5, "humidity": 60}`
- **GET /api/latest-data**
  - Returns the most recent sensor reading.
- **GET /api/lcd-message**
  - Returns raw text of the current LCD message.
- **POST /api/lcd-message**
  - Body (JSON): `{"text": "HELLO"}`

## Render Deployment Steps

1. Push your code to a GitHub repository.
2. Go to [Render](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository.
4. **Root Directory:** Set this to `backend` (if you structured it with a subfolder) OR leave empty if you move `server.js` to root. *Note: As generated, the start command should run from the backend directory.*
   - If deploying the whole `iot_project` repo, set Root Directory to `backend`.
5. **Build Command:** `npm install`
6. **Start Command:** `node server.js`
7. Click **Create Web Service**. 
8. *Note on JSON DB:* On Render's free tier, local files reset on deployment. Your `db.json` data will be cleared when the server sleeps or redeploys.

## Arduino IDE Setup

1. **Install ESP8266 Board:** 
   - File -> Preferences -> Add `http://arduino.esp8266.com/stable/package_esp8266com_index.json` to Additional Boards Manager URLs.
   - Tools -> Board -> Boards Manager -> Search for `esp8266` and install it.
2. **Select Board:** Tools -> Board -> ESP8266 Boards -> NodeMCU 1.0 (ESP-12E Module) (Works for ESP-12F).
3. **Install Required Libraries (Manage Libraries):**
   - `DHT sensor library` by Adafruit
   - `LiquidCrystal I2C` by Frank de Brabander
4. **Update Code:**
   - Open `esp8266/esp8266_code.ino`.
   - Change `YOUR_WIFI_SSID` and `YOUR_WIFI_PASSWORD`.
   - Change `SERVER_URL` to your Render deployment link (e.g., `https://your-app.onrender.com`).
5. **Upload** the code to the ESP8266.

## Blynk Configuration

To make the LED control buttons work on the Dashboard:
1. Get your `Auth Token` from Blynk.
2. Open `backend/server.js`.
3. Locate the `BLYNK_TOKEN` variable and replace `YOUR_BLYNK_AUTH_TOKEN` with your actual token.
4. Restart the Node.js server.
