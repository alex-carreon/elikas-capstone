#define TRIG_PIN 19 
#define ECHO_PIN 18 

#include "secrets.h"
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <Preferences.h>  // esp32's non-volatile storage (nvs)

const char* api_key = SECRET_API_KEY;
const char* serverUrl = SECRET_SERVER;
const char* sensorId = SECRET_SENSOR;

bool shouldSaveConfig = false;

Preferences preferences;


void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // !!! will be replaced with a physical reset button 
  // emergency factory reset
  Serial.println("\n--- BOOTING --- \nPress 'R' now to Factory Reset...");
  unsigned long startWait = millis();
  while (millis() - startWait < 3000) {  // 3-second window to press 'R'
    if (Serial.available() > 0 && Serial.read() == 'R') {
        WiFiManager wm;
        wm.resetSettings();  // wipe saved wifi config
        preferences.begin("sensor", false);  // access nvs read-write mode (false)
        preferences.clear();   // delete saved ap password 
        preferences.end();   // end nvs session
        Serial.println("!!! ALL SETTINGS WIPED !!! Restarting...");
        delay(1000);
        ESP.restart();
    }
  }

  manageConnection(true);

  Serial.println("Connected! IP: " + WiFi.localIP().toString());
}


void loop() {
  manageConnection(false);

  float distance = readDistance();

  if (distance < 0) {
    Serial.println("No reading / out of range");
  } else {
    sendFloodData(distance);
  }

  delay(10000);
}


float readDistance() {
  digitalWrite(TRIG_PIN, LOW); 
  delayMicroseconds(2); // wait to ensure a clean LOW signal before triggering
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10); // send trigger pulse to initiate ultrasonic burst
  digitalWrite(TRIG_PIN, LOW); // turn off the signal

  // measure echo pulse duration; timeout at 30ms (max sensor range) 
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) return -1; // if no signal is received

  // convert time to distance (0.034 cm/µs = speed of sound); divide by 2 for round-trip
  float distance = (duration * 0.034) / 2.0;

  // if reading is outside reliable sensor range (20 cm – 450 cm)
  if (distance < 20 || distance > 450) return -1; 

  return distance;
}


// trips the flag whenever the user clicks save in the wifi config portal
void saveConfigCallback () {
  shouldSaveConfig = true;
}

// determine whether to use default or configured password
String getPortalPassword () {
  String factoryDefault = getUniqueDefaultPass(); // generate the default password
  preferences.begin("sensor", true); // access nvs in read mode (true)
  String savedPass = preferences.getString("ap_pass", factoryDefault); // use ap_pass if found, else use default
  preferences.end();
  return savedPass;
}

// generates a unique password like "eLikas-A1B2" using the MAC address
String getUniqueDefaultPass() {
  uint8_t mac[6];   // create an array
  WiFi.macAddress(mac);  // store MAC into the array
  char uniquePW[15];   // create array of 15 chars for default pass
  snprintf(uniquePW, sizeof(uniquePW), "eLikas-%02X%02X", mac[4], mac[5]);  // format password
  return String(uniquePW);
}

void manageConnection(bool isInitialSetup) {
  // if already connected and NOT the initial setup, do nothing
  if (WiFi.status() == WL_CONNECTED && !isInitialSetup) return;

  if (!isInitialSetup) {
    Serial.println("WiFi Connection Lost! Re-launching Config Portal...");
  }

  WiFiManager wm;
  String savedPass = getPortalPassword();
  Serial.println("Current Setup Password: " + savedPass);

  // hides custom password field under advanced settings
  String html = "<details><summary><b>Advanced Settings</b></summary><br>Set New Setup Password";
  WiFiManagerParameter custom_ap_pass(
    "ap_pass",  // key for nvs
    html.c_str(),  // html string preceding input
    savedPass.c_str(),  // pre-fill input with current password
    32,  // max length
    "minlength='8' required title='Password must be at least 8 characters'" // textbox enforcement of 8-char minimum
  );
  WiFiManagerParameter html_closer("</details><br>");

  wm.addParameter(&custom_ap_pass);
  wm.addParameter(&html_closer);

  // configure basic timeouts
  wm.setConfigPortalTimeout(300); 
  wm.setConnectTimeout(30);
  wm.setSaveConfigCallback(saveConfigCallback); // tells wm to trip the flag if a config is saved

  // if reconnection fails, restart the device and initiate a full setup flow
  if (!wm.autoConnect("FloodSensor-Setup", savedPass.c_str())) {
    Serial.println("Failed to reconnect. Restarting...");
    delay(3000);
    ESP.restart();
  }

  // if sensor is wifi configured, save the ap password
  if (shouldSaveConfig) {
    String newPass = String(custom_ap_pass.getValue());  // retrieve value of portal textbox
    if (newPass.length() >= 8) {
      preferences.begin("sensor", false);
      preferences.putString("ap_pass", newPass);  // write new password into nvs if valid
      preferences.end();
      Serial.println("New password saved to memory: " + newPass);
    } else {
      Serial.println("Error: Password too short! Ignored.");
    }
    shouldSaveConfig = false; // reset the flag so it doesn't loop save
  }
}

void sendFloodData(float distance) {
  JsonDocument doc;
  doc["api_key"] = api_key;
  doc["sensor_id"] = sensorId;
  doc["distance_cm"] = distance;
  serializeJsonPretty(doc, Serial);
  Serial.println();

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  int responseCode = http.POST(payload);
  Serial.printf("Response code: %d\n", responseCode);
  http.end();
}