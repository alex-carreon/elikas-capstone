#define TRIG_PIN 19 
#define ECHO_PIN 18 

#include "secrets.h"
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <Preferences.h>  // esp32's non-volatile storage (nvs)

#include "time.h"
#include "esp_sntp.h"

#include <Arduino.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <WebSerial.h>
#include <Update.h>
#include <ArduinoOTA.h>

float readDistance();
void saveConfigCallback ();
String getPortalPassword ();
String getUniqueDefaultPass();
void manageConnection(bool isInitialSetup);
void printStatus();
void checkForFirmwareUpdate();
void downloadAndApplyFirmware(String url);
void sendFloodData(float distance);
void timeAvailable(struct timeval *t);
String getFormattedTime();
void trackTrendAndEvaluateState(float newMedian);
float getMedianReading();

const char* currentFirmwareVersion = "1.3.0";
//const char* sensorCode = SECRET_SENSOR;
String sensorCode = "";

// Github Repo Details
const char* github_owner = GITHUB_OWNER;
const char* github_repo = GITHUB_REPO;
const char* firmware_asset_name = FIRMWARE_ASSET;
const char* github_pat = SECRET_GITHUB_PAT;

// API Info
const char* api_key = SECRET_API_KEY;
const char* serverUrl = SECRET_SERVER;

// NTP settings
const char *ntpServer1 = "pool.ntp.org";
const char *ntpServer2 = "time.nist.gov";
const long gmtOffset_sec = 28800;   // GMT +8 for manila
const int daylightOffset_sec = 0;  // DST off per PST

bool shouldSaveConfig = false;
bool timeSynchronized = false;

Preferences preferences;
AsyncWebServer server(80);

// Filtering and Sampling Specs 
const int BURST_SIZE = 5;               // Number of readings per 1-minute burst
const unsigned long BURST_INTERVAL = 60000; // 1 minute between sampling bursts

// Relay Specs 
const unsigned long QUIESCENT_INTERVAL = 600000; // 10 minutes 
const unsigned long ACTIVE_INTERVAL = 60000;     // 1 minute 

// Trend Detection Specs
const float ELEVATION_THRESHOLD = 0.02; // 3 cm (0.03m) threshold to count as a "rise"
const int REQUIRED_CONSECUTIVE_RISES = 3; // N stable readings to confirm trend (Debouncing)

// State Tracking Variables
unsigned long lastBurstTime = 0;
unsigned long lastTransmissionTime = 0;
bool isActiveMode = false;

// Historical Tracking for Trend Analysis
float recentMedians[REQUIRED_CONSECUTIVE_RISES + 1] = {0}; 
int storedMediansCount = 0;

int activeModeCooldownTimer = 0; // Tracks remaining minutes to hold ACTIVE mode
const int MINIMUM_ACTIVE_MINUTES = 10; // Hold high-frequency reporting for at least 10 minutes


void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // load stored sensor code from nvs
  preferences.begin("sensor", true); // true = read-only mode
  sensorCode = preferences.getString("sensor_code", SECRET_SENSOR); // defaults to SECRET_SENSOR if empty
  preferences.end();

  manageConnection(true);

  WebSerial.begin(&server);
  server.begin();   // start AsyncWebServer

  // initialize ntp and OTA after a live wifi connection
  sntp_set_time_sync_notification_cb(timeAvailable);   // trip time sync flag
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer1, ntpServer2);

  ArduinoOTA.begin();

  WebSerial.onMessage([](uint8_t *data, size_t len) {
    Serial.printf("Received %lu bytes from WebSerial: ", len);
    Serial.write(data, len);
    Serial.println();
    WebSerial.println("Received Data...");
    String d = "";
    for(size_t i = 0; i < len; i++){
      d += char(data[i]);
    }
    d.trim();

    WebSerial.println(d);

    if (d == "status") {
      printStatus();
    } 
    
    // !!! will be replaced with a physical reset button 
    // emergency factory reset
    if (d == "R") {
      WebSerial.println("Factory Reset...");
      WiFiManager wm;
      wm.resetSettings();  // wipe saved wifi config
      preferences.begin("sensor", false);  // access nvs read-write mode (false)
      preferences.clear();   // delete saved ap password 
      preferences.end();   // end nvs session
      WebSerial.println("!!! ALL SETTINGS WIPED !!! Restarting...");
      delay(1000);
      ESP.restart();
    }

    if (d == "update") {
      checkForFirmwareUpdate();
    } 
  });

  //checkForFirmwareUpdate();
}


void loop() {
  manageConnection(false);
  ArduinoOTA.handle();
  WebSerial.loop();

  unsigned long now = millis();

  // Per Minute Sampling Burst & Trend Evaluation
  if (now - lastBurstTime >= BURST_INTERVAL) {
    lastBurstTime = now;

    if (timeSynchronized) {
      float currentMedian = getMedianReading();
      
      if (currentMedian < 0) {
        WebSerial.println("[Burst Error] Out of range or invalid reading.");
      } else {
        WebSerial.printf("[Burst Success] Minute Median Distance: %.2fm\n", currentMedian);
        trackTrendAndEvaluateState(currentMedian);
      }
    } else {
      WebSerial.println("Waiting for NTP sync...");
    }
  }

  // Adaptive Transmission Strategy
  unsigned long currentTransmissionInterval = isActiveMode ? ACTIVE_INTERVAL : QUIESCENT_INTERVAL;

  if (now - lastTransmissionTime >= currentTransmissionInterval) {
    lastTransmissionTime = now;

    if (timeSynchronized) {
      // Fetch a fresh filtered median directly for the transmission payload
      float transmissionDistance = getMedianReading(); 
      
      if (transmissionDistance >= 0) {
        WebSerial.printf("Transmitting data. Mode: %s\n", isActiveMode ? "ACTIVE" : "QUIESCENT");
        sendFloodData(transmissionDistance);
      }
    }
  }
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

  // convert into meters
  distance /= 100;

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

  // fetch current sensor code to pre-fill the form
  preferences.begin("sensor", true);
  String currentSensorCode = preferences.getString("sensor_code", "SR-");
  preferences.end();

  Serial.println("Assigned Sensor Code: " + currentSensorCode);
  Serial.println("Current Setup Password: " + savedPass);

  String sensor_code_html = "<br>Sensor Code (Required)";
  WiFiManagerParameter sensor_code(
    "sensor_code",  // key for nvs
    sensor_code_html.c_str(),  // html string preceding input
    currentSensorCode.c_str(),  // pre-fill input with sensor code if saved
    20,  // max length
    "maxlength='20' required " 
  );
  WiFiManagerParameter sc_html_closer("<br>");

  WiFiManagerParameter sc_note("<p><em>Fill in the sensor code after registration of the unit on the eLikas platform. Make sure the code is correct to see readings on the app.</em></p><br>");

  // hides custom password field under advanced settings
  String ap_html = "<details><summary><b>Advanced Settings</b></summary><br>Set New Setup Password";
  WiFiManagerParameter custom_ap_pass(
    "ap_pass",  // key for nvs
    ap_html.c_str(),  // html string preceding input
    savedPass.c_str(),  // pre-fill input with current password
    32,  // max length
    "minlength='8' required title='Password must be at least 8 characters'" // textbox enforcement of 8-char minimum
  );
  WiFiManagerParameter pw_html_closer("</details><br>");
  
  wm.addParameter(&sensor_code);
  wm.addParameter(&sc_note);
  wm.addParameter(&sc_html_closer);
  wm.addParameter(&custom_ap_pass);
  wm.addParameter(&pw_html_closer);

  // configure basic timeouts
  wm.setConfigPortalTimeout(300); 
  wm.setConnectTimeout(30);
  wm.setSaveConfigCallback(saveConfigCallback); // tells wm to trip the flag if a config is saved

  // if reconnection fails, restart the device and initiate a full setup flow
  if (!wm.autoConnect("FloodSensor-Setup", savedPass.c_str())) {
    WebSerial.println("Failed to reconnect. Restarting...");
    delay(3000);
    ESP.restart();
  }

  // once connected OR when user hits "Save"
  if (shouldSaveConfig) {
    String newPass = String(custom_ap_pass.getValue());  // retrieve value of portal textbox
    if (newPass.length() >= 8) {
      preferences.begin("sensor", false);
      preferences.putString("ap_pass", newPass);  // write new password into nvs if valid
      preferences.end();
      WebSerial.println("New password saved to memory: " + newPass);
    } else {
      Serial.println("Error: Password too short! Ignored.");
    } 

    sensorCode = String(sensor_code.getValue());
    preferences.begin("sensor", false);
    preferences.putString("ap_pass", newPass);  // write new password into nvs if valid
    preferences.end();
    Serial.println("Assigned Sensor Code: " + sensorCode);

    shouldSaveConfig = false; // reset the flag so it doesn't loop save

    ESP.restart();
  }
}



void printStatus() {
  WebSerial.println("Connected! IP: " + WiFi.localIP().toString());
  WebSerial.print("Firmware Version: ");
  WebSerial.println(currentFirmwareVersion);
}

void checkForFirmwareUpdate() {
  if (WiFi.status() != WL_CONNECTED) {
    WebSerial.println("WiFi not connected. Skipping update check.");
    return;
  }

  String apiUrl = "https://api.github.com/repos/" + String(github_owner) + "/" + String(github_repo) + "/releases/latest";

  WebSerial.println("---------------------------------");
  WebSerial.println("Checking for new firmware...");
  WebSerial.println("Fetching release info from: " + apiUrl);

  HTTPClient http;
  http.begin(apiUrl);  
  http.addHeader("Authorization", "token " + String(github_pat));
  http.addHeader("Accept", "application/vnd.github.v3+json");
  http.setUserAgent("ESP32-OTA-Client");

  WebSerial.println("Sending API request...");
  int httpCode = http.GET();

  if (httpCode != HTTP_CODE_OK) {
    WebSerial.printf("API request failed. HTTP code: %d\n", httpCode);
    WebSerial.println("Full response: " + http.getString());  // Print error
    http.end();
    return;
  }
  WebSerial.printf("API request successful (HTTP %d). Parsing JSON.\n", httpCode);
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, http.getStream());
  http.end();

  if (error) {
    WebSerial.println("Failed to parse JSON: " + String(error.c_str()));
    return;
  }

  String latestVersion = doc["tag_name"].as<String>();
  if (latestVersion.isEmpty() || latestVersion == "null") {
    WebSerial.println("Could not find 'tag_name' in JSON response.");
    return;
  }
  WebSerial.println("Current Version: " + String(currentFirmwareVersion));
  WebSerial.println("Latest Version:  " + latestVersion);

  if (latestVersion != currentFirmwareVersion) {
    WebSerial.println(">>> New firmware available! <<<");
    WebSerial.println("Searching for asset named: " + String(firmware_asset_name));
    String firmwareUrl = "";
    JsonArray assets = doc["assets"].as<JsonArray>();

    for (JsonObject asset : assets) {
      String assetName = asset["name"].as<String>();
      WebSerial.println("Found asset: " + assetName);

      if (assetName == String(firmware_asset_name)) {
        String assetId = asset["id"].as<String>();
        firmwareUrl = "https://api.github.com/repos/" + String(github_owner) + "/" + String(github_repo) + "/releases/assets/" + assetId;
        WebSerial.println("Found matching asset! Preparing to download.");
        break;
      }
    }

    if (firmwareUrl.isEmpty()) {
      WebSerial.println("Error: Could not find the specified firmware asset in the release.");
      return;
    }
    downloadAndApplyFirmware(firmwareUrl);

  } else {
    WebSerial.println("Device is up to date. No update needed.");
  }
  WebSerial.println("---------------------------------");
}

void downloadAndApplyFirmware(String url) {
  HTTPClient http;
  WebSerial.println("Starting firmware download from: " + url);

  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.setUserAgent("ESP32-OTA-Client");
  http.begin(url);
  http.addHeader("Accept", "application/octet-stream");
  http.addHeader("Authorization", "token " + String(github_pat));

  int httpCode = http.GET();
  if (httpCode != HTTP_CODE_OK) {
    WebSerial.printf("Download failed, HTTP code: %d\n", httpCode);
    http.end();
    return;
  }

  int contentLength = http.getSize();
  if (contentLength <= 0) {
    WebSerial.println("Error: Invalid content length.");
    http.end();
    return;
  }

  // Begin the OTA update
  if (!Update.begin(contentLength)) {
    WebSerial.printf("Update begin failed: %s\n", Update.errorString());
    http.end();
    return;
  }
  WebSerial.println("Writing firmware... (this may take a moment)");
  WiFiClient* stream = http.getStreamPtr();
  uint8_t buff[1024];  
  size_t totalWritten = 0;
  int lastProgress = -1;

  while (totalWritten < contentLength) {
    int available = stream->available();
    if (available > 0) {
      int readLen = stream->read(buff, min((size_t)available, sizeof(buff)));
      if (readLen < 0) {
        WebSerial.println("Error reading from stream");
        Update.abort();
        http.end();
        return;
      }

      if (Update.write(buff, readLen) != readLen) {
        WebSerial.printf("Error: Update.write failed: %s\n", Update.errorString());
        Update.abort();
        http.end();
        return;
      }

      totalWritten += readLen;
      int progress = (int)((totalWritten * 100L) / contentLength);
      if (progress > lastProgress && (progress % 5 == 0 || progress == 100)) {
        WebSerial.printf("Progress: %d%%", progress);
        WebSerial.println();
        if (progress == 100) {
          WebSerial.println(); 
        } else {
          WebSerial.print("\r"); 
        }
        lastProgress = progress;
      }
    }
    delay(1);
  }
  WebSerial.println();

  if (totalWritten != contentLength) {
    WebSerial.printf("Error: Write incomplete. Wrote %d of %d bytes\n", totalWritten, contentLength);
    Update.abort();
  } else if (!Update.end()) {  // Finalize the update
    WebSerial.printf("Error: Update end failed: %s\n", Update.errorString());
  } else {
    WebSerial.println("Update complete! Restarting...");
    delay(1000);
    ESP.restart();
  }
  http.end();
}

void sendFloodData(float distance) {
  String currentTimestamp = getFormattedTime();

  JsonDocument doc;
  doc["apiKey"] = api_key;
  doc["sensorCode"] = sensorCode;
  doc["waterLevel"] = distance;
  doc["sensorTimestamp"] = currentTimestamp;

  String payload;
  serializeJson(doc, payload);
  WebSerial.println(payload);

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  int responseCode = http.POST(payload);
  WebSerial.printf("Response code: %d\n", responseCode);
  http.end();
}

// triggered whenever time is synchronized with the NTP server
void timeAvailable(struct timeval *t) {
  WebSerial.println("Got time adjustment from NTP!");
  timeSynchronized = true;   // set flag to allow data logging to begin
}


String getFormattedTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    WebSerial.println("No time available (yet)");
    return "IDLE_TIME";
  }
  char buffer[64];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);   // formats time into "YYYY-MM-DD HH:MM:SS" if successful

  return String(buffer);
}

float getMedianReading() {
  float readings[BURST_SIZE];
  int validCount = 0;

  // Collect a rapid burst of ultrasonic measurements
  for (int i = 0; i < BURST_SIZE; i++) {
    float raw = readDistance();
    if (raw > 0) {   // filter out immediate out-of-range (-1) errors
      readings[validCount] = raw;
      validCount++;
    }
    delay(40);   // small delay between pulses to prevent echo overlap
  }

  // if no valid readings were collected at all, return error
  if (validCount == 0) return -1.0;

  // Sort the valid readings (Simple Bubble Sort)
  for (int i = 0; i < validCount - 1; i++) {
    for (int j = 0; j < validCount - i - 1; j++) {
      if (readings[j] > readings[j + 1]) {
        float temp = readings[j];
        readings[j] = readings[j + 1];
        readings[j + 1] = temp;
      }
    }
  }

  // Return the median 
  return readings[validCount / 2];
}

void trackTrendAndEvaluateState(float newMedian) {
  if (newMedian < 0) return; // Ignore invalid burst measurements

  // Shift history array to make room for the latest median
  // [Index 0: Oldest Reading] <--- [Index 1] <--- [Index 2] <--- [Index 3: Newest Reading]
  for (int i = 0; i < REQUIRED_CONSECUTIVE_RISES; i++) {
    recentMedians[i] = recentMedians[i + 1];
  }

  // Store the newly calculated burst median at the end of the history array
  recentMedians[REQUIRED_CONSECUTIVE_RISES] = newMedian;

  // Wait for more readings if less than required for debouncing 
  if (storedMediansCount <= REQUIRED_CONSECUTIVE_RISES) {
    storedMediansCount++;
    return; 
  }

  // Compare oldest reading in the window to newest reading
  float oldestDistance = recentMedians[0];
  float newestDistance = recentMedians[REQUIRED_CONSECUTIVE_RISES];
  
  // Total rise over the last 3 minutes
  float netRise = oldestDistance - newestDistance; 

  // Over 3 minutes, the total cumulative rise must exceed 3 times the single-minute threshold (e.g., 3cm * 3 = 9cm)
  float totalRequiredRise = ELEVATION_THRESHOLD * REQUIRED_CONSECUTIVE_RISES;

  bool isSustainedRise = (netRise >= totalRequiredRise);

  // State change logic
  if (isSustainedRise) {
    // trigger/renew the cooldown lock
    activeModeCooldownTimer = MINIMUM_ACTIVE_MINUTES; 
    
    if (!isActiveMode) {
      isActiveMode = true;
      WebSerial.printf("!!! CRITICAL SURGE DETECTED !!! Net rise of %.2fm in 3 mins. Escalating to ACTIVE Mode!\n", netRise);
    }
  } 
  else if (isActiveMode) {
    // If the 3-minute net rise target isn't met, tick down our safe lockout timer
    if (activeModeCooldownTimer > 0) {
      activeModeCooldownTimer--;
      WebSerial.printf("[Safety Lock] Surge tapering. Holding ACTIVE mode for %d more minutes...\n", activeModeCooldownTimer);
    } else {
      // Cooldown has completely expired, safe to revert
      isActiveMode = false;
      WebSerial.println("Sustained surge ended and cooldown expired. Reverting to Normal Mode (10-min intervals).");
    }
  }
}