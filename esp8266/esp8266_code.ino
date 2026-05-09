#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>

// ==========================================
// CONFIGURATION
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";          // Replace with your WiFi SSID
const char* password = "YOUR_WIFI_PASSWORD";  // Replace with your WiFi Password

// Render App URLs (HTTPS)
// Make sure to replace this with your actual Render deployment URL
const String SERVER_URL = "https://your-render-app.onrender.com";
const String POST_SENSOR_URL = SERVER_URL + "/api/sensor-data";
const String GET_LCD_URL = SERVER_URL + "/api/lcd-message";

// ==========================================
// PINS & SENSORS
// ==========================================
#define DHTPIN D5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// LCD configuration: I2C Address 0x27, 16 columns, 2 rows
// SDA -> D2, SCL -> D1
LiquidCrystal_I2C lcd(0x27, 16, 2); 

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Initialize LCD
  Wire.begin(D2, D1); // SDA, SCL
  lcd.begin(16, 2);
  lcd.init();
  lcd.backlight();
  
  // WiFi Connection Sequence
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("CONNECTING TO");
  lcd.setCursor(0, 1);
  lcd.print("WiFi");
  Serial.println("Connecting to WiFi...");
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    lcd.print(".");
    Serial.print(".");
  }
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("CONNECTED TO WiFi");
  lcd.setCursor(0, 1);
  lcd.print("-- WELCOME--");
  Serial.println("\nConnected to WiFi");
  
  delay(2000);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    
    // 1. Read Sensor Data
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor!");
      // Fallback values for testing if sensor is not connected
      temperature = 0.0;
      humidity = 0.0;
    }

    // Display Temperature
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("TEMPERATURE");
    lcd.setCursor(0, 1);
    lcd.print(String(temperature, 1) + " C");
    delay(2000);
    
    // Display Humidity
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("HUMIDITY");
    lcd.setCursor(0, 1);
    lcd.print(String(humidity, 1) + " %");
    delay(2000);

    // 2. Fetch LCD Message from Server
    std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
    client->setInsecure(); // Ignore SSL certificate validation (required for Render)
    
    HTTPClient http;
    String lcdMessage = "SISTec DISPLAY"; // Default fallback

    Serial.println("Fetching LCD Text from API...");
    if (http.begin(*client, GET_LCD_URL)) {
      int httpCode = http.GET();
      if (httpCode > 0) {
        if (httpCode == HTTP_CODE_OK) {
          lcdMessage = http.getString();
          Serial.println("Received: " + lcdMessage);
        }
      } else {
        Serial.printf("[HTTP] GET failed, error: %s\n", http.errorToString(httpCode).c_str());
      }
      http.end();
    }
    
    // Display fetched text
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("SISTec DISPLAY");
    lcd.setCursor(0, 1);
    lcd.print(lcdMessage.substring(0, 16)); // Max 16 chars
    delay(3000);

    // 3. Send Sensor Data to Server
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("SENDING DATA TO");
    lcd.setCursor(0, 1);
    lcd.print("WEB SERVER....");
    delay(1000);

    if (http.begin(*client, POST_SENSOR_URL)) {
      http.addHeader("Content-Type", "application/json");
      
      // Create JSON payload
      String payload = "{\"temperature\":" + String(temperature, 1) + ",\"humidity\":" + String(humidity, 1) + "}";
      
      int httpCode = http.POST(payload);
      
      if (httpCode > 0) {
        Serial.printf("[HTTP] POST code: %d\n", httpCode);
        String response = http.getString();
        Serial.println("Response: " + response);
        
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("DATA SENT...!!");
      } else {
        Serial.printf("[HTTP] POST failed, error: %s\n", http.errorToString(httpCode).c_str());
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("POST FAILED");
      }
      http.end();
    }
    
    delay(1000);
    
  } else {
    Serial.println("WiFi Disconnected");
  }

  // Wait before next cycle
  delay(5000);
}
