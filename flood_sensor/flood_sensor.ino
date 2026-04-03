#include "secrets.h"
#include <ArduinoJson.h>
#include <WiFi.h>

const char* ssid      = SECRET_SSID;
const char* password  = SECRET_PASS;
const char* api_key   = SECRET_API_KEY;
const char* serverUrl = SECRET_SERVER;
const char* sensorId  = SECRET_SENSOR;

// define the pin connections on the sensor
#define TRIG_PIN 5 // gpio pin 5 sends the ultrasonic pulse
#define ECHO_PIN 18 // gpio pin 18 listens for the returning signal

void setup() {
  //Output at 115200 baud
  Serial.begin(115200);

  //Configure pin roles
  pinMode(TRIG_PIN, OUTPUT); // transducer 
  pinMode(ECHO_PIN, INPUT); // receiver

  //Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
}

void loop() {
  float distance = readDistance();

  if (distance < 0) {
    Serial.println("No reading / out of range");
  } else {
    //Serial.printf("Distance: %.2f cm\n", distance);
    JsonDocument doc;
    doc["api_key"] = api_key;
    doc["sensor_id"] = "TEST_001";
    doc["distance_cm"] = distance;
    serializeJsonPretty(doc, Serial);
    Serial.println();
  }

  delay(1000);
}

float readDistance() {
  digitalWrite(TRIG_PIN, LOW); 
  delayMicroseconds(2); // wait to ensure a clean LOW signal before triggering
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10); // send trigger pulse to initiate ultrasonic burst
  digitalWrite(TRIG_PIN, LOW); // turn off the signal

  // measure echo pulse duration; timeout at 30ms (~max sensor range) to prevent blocking
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) return -1; // if no signal is received

  // convert time to distance (0.034 cm/µs = speed of sound); divide by 2 for round-trip
  float distance = (duration * 0.034) / 2.0;

  // discard readings outside reliable sensor range (20 cm – 450 cm)
  if (distance < 20 || distance > 450) return -1; 

  return distance;
}