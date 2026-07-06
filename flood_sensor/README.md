<a id="readme-top"></a>

# 🌊 Flood Sensor Module

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#hardware">Hardware</a></li>
        <li><a href="#wiring--logic-level-shifting">Wiring & Logic Level Shifting</a></li>
      </ul>
    </li>
    <li>
      <a href="#prerequisites">Prerequisites</a>
    </li>
    <li>
      <a href="#how-it-works">How It Works</a>
      <ul>
        <li><a href="#distance-calculation">Distance Calculation</a></li>
        <li><a href="#connectivity">Connectivity</a></li>
        <li><a href="#ntp-implementation--timestamping">Over-the-Air (OTA) Updates</a></li>
        <li><a href="#signal-filtering--sampling-strategy">Signal Filtering & Sampling Strategy</a></li>
        <li><a href="#data-transmission-json-api">Data Transmission (JSON API)</a></li>
      </ul>
    </li>
    <li>
      <a href="#roadmap">Roadmap</a>
    </li>
  </ol>
</details>


<!-- ABOUT THE PROJECT -->
## About The Project

The Flood Sensor module uses ultrasonic sound waves to monitor water levels in real-time. By calculating the distance between the sensor and the water surface, this component can detect rising water levels and provide early warnings for potential flooding. 

This module is designed to sit inside a weather-resistant housing, utilizing the waterproof capabilities of the AJ-SR04M probe to ensure longevity in high-humidity environments. It integrates with the **eLikas Capstone** ecosystem via Wi-Fi to report data.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


### Hardware
The prototype assembly uses a modular approach with an ESP32 Shield to simplify connections and in-line soldering for signal protection.
  * **Microcontroller:** ESP32 (38-Pin Development Board)
    * Features the CP2102 USB-to-UART bridge for stable flashing
    * Powered via USB-C
    * Mounted on an **expansion shield**, which breaks out all GPIOs into VCC/GND/Signal rows, providing a more stable power rail for the 5V sensor.
  * **Sensor:** AJ-SR04M Integrated Ultrasonic Module
    * Uses a sealed integrated transducer and receiver probe
    * Waterproof and suitable for outdoor environments
    * Accurate from 20 cm to 450 cm


#### Wiring & Logic Level Shifting
Because the ESP32 operates on 3.3V logic, it cannot safely receive the 5V return signal from the AJ-SR04M. To prevent GPIO damage, there is a voltage divider using 1kΩ and 2kΩ resistors.

| AJ-SR04M Pin | Shield / ESP32 Pin | Logic Level | Connection Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| VCC | 5V | 5V | Direct | Main power from the Shield's 5V rail |
| GND | GND | 0V | Direct | Common ground for sensor and resistors | 
| Trig | GPIO 19 | 3.3V | Direct | Pulse trigger sent from ESP32 to sensor |
| Echo | GPIO 18 | 3.3V | In-line Solder | Voltage Divider: 1kΩ (Series) + 2kΩ (to GND) |

<p align="right">(<a href="#readme-top">back to top</a>)</p>


### Prerequisites

To flash and monitor the sensor, the following are needed:
  * **[Arduino IDE](https://downloads.arduino.cc/arduino-ide/arduino-ide_2.3.8_Windows_64bit.exe)** (recommended)
  * **ESP32 Board Package by Espressif Systems:** Install via the Boards Manager.
  * **[CP2102 Drivers by Silicon Labs](https://www.silabs.com/software-and-tools/usb-to-uart-bridge-vcp-drivers?tab=downloads):** Ensure your OS recognizes the Type-C Serial bridge.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## How It Works

### Distance Calculation
The ultrasonic sensor is able to determine distance by emitting sound waves on the transducer and measuring the time it takes to bounce back to the receiver after hitting the surface of an object (both of which are integrated on the waterproof AJN-SR04M sensor). 

Using the speed of sound (343 m/s), the distance can be calculated:

```
Distance = Speed × Time
         = 343 m/s × Pulse Duration
```

However, since the measured time includes both the forward and return trip, the result must be divided by two. In the code, this is simplified using a conversion factor:

```
float distance = (duration * 0.034) / 2.0;
```

To ensure reliable readings, the code filters out invalid values beyond the sensor unit's minimum blind zone of 20cm and the commonly reported practical range of 450cm ([Alam, 2023](https://how2electronics.com/jsn-sr04t-waterproof-ultrasonic-sensor-with-arduino-guide/)) :
```
if (duration == 0) return -1;
if (distance < 20 || distance > 450) return -1;
```
<p align="right">(<a href="#readme-top">back to top</a>)</p>


### Connectivity & Set Up
The module can be deployed without hardcoding Wi-Fi credentials using Wi-Fi Provisioning from WiFiManager.

  1. In initial setup, connect to the Wi-Fi network: `FloodSensor-Setup`
  2. Use the unique default password (Format: `eLikas-XXXX`) generated based on the device's MAC address
  3. A web portal will allow the user to select a local SSID and enter the password
      >**Security**: The setup access point (AP) password can be changed from the default password under the Advanced Settings toggle within the web portal. This password is saved to the ESP32's NVS memory and persists through reboots.
  4. Fill in the sensor code for the unit, which is generated after registering it on the eLikas platform with its details. This is essential so that readings are reflected correctly on the app. 

If the device needs to be moved to a new location or the Setup Password is forgotten, send the character 'R' via Serial Monitor (115200 baud). This wipes all saved Wi-Fi credentials and resets the setup AP password to the default (eLikas-XXXX).

<p align="right">(<a href="#readme-top">back to top</a>)</p>


### NTP Implementation & Timestamping
The module utilizes the Network Time Protocol (NTP) to timestamp sensor readings. Instead of relying on a dedicated Real-Time Clock (RTC) module, the ESP32 leverages its internet connectivity to synchronize with atomic-clock-referenced time servers. This approach reduces both hardware complexity and overall system cost while maintaining accurate timekeeping.

Upon successful Wi-Fi connection, the device initializes time synchronization using two configured NTP servers.
```
const char *ntpServer1 = "pool.ntp.org";
const char *ntpServer2 = "time.nist.gov";
```
1. **NTP Pool** (`pool.ntp.org`) - The ESP32 automatically resolves this domain to a nearby server (typically within or near the Philippines), ensuring low latency. Since this is a global, distributed cluster of volunteer-operated time servers, multiple servers can respond if one becomes unavailable.
2. **NIST Time Servers** (`time.nist.gov`) - Operated by the U.S. National Institute of Standards and Technology (NIST), these servers provide highly accurate time derived from atomic clocks. They serve as a reliable secondary reference to validate synchronization.

The system is currently configured with a GMT+8 offset (28800 seconds) to align with Philippine Standard Time, with daylight saving time disabled. Both of these settings can be modified for other time zones by modifying the seconds values of `gmtOffset_sec` and `daylightOffset_sec`.

```
const long gmtOffset_sec = 28800;   // GMT +8 for manila
const int daylightOffset_sec = 0;  // DST off per PST
```

All HTTP POST requests are withheld until the internal clock has been successfully synchronized with an NTP server, preventing invalid timestamps (e.g., Unix epoch `1970-01-01 00:00:00`) from being recorded in the database.

Using the strftime function, the raw system time is converted into a standardized string formatted as `YYYY-MM-DD HH:MM:SS`. This format allows lexicographic sorting (i.e., timestamps can be ordered even as simple strings) and aligns with most databases' `DATETIME` standards. 

<p align="right">(<a href="#readme-top">back to top</a>)</p>


### Signal Filtering & Sampling Strategy
Raw ultrasonic readings are inherently noisy because of the way that the sensor measures distance. Since water is not a stable surface, ripples, floating debris, and reflected pulses from nearby objects can cause erroneous spikes, making a single raw reading unreliable ([Harres, 2012](https://www.edn.com/median-filters-an-efficient-way-to-remove-impulse-noise/)).

To address this, the device takes a short burst of readings every minute and computes for the **median**, specifically chosen because it is more resistant to extreme outlier values common in ultrasonic water surface measurements. A **median filter discards straggler values** entirely rather than allowing them to drag the result in either direction, unlike a mean-based moving average ([Harres, 2012](https://www.edn.com/median-filters-an-efficient-way-to-remove-impulse-noise/)).

```cpp
for (int i = 0; i < BURST_SIZE; i++) {
  float raw = readDistance();
  if (raw > 0) readings[validCount++] = raw;
  delay(40); // prevent echo overlap between pulses
}
// readings[] is sorted here, then the middle value is returned
return readings[validCount / 2];
```


#### Two-Tiered Relay Strategy
Under normal conditions, the system operates in a **normal/quiescent state**, reporting a final water level **every 10 minutes**. This reflects established practice in IoT river level monitoring, where 10 minutes is a commonly recognized transmission interval for non-critical conditions ([Manx Tech Group, 2026](https://manxtechgroup.com/iot-ultrasonic-sensors-revolutionising-river-level-monitoring/)).

However, 10-minute resolution is insufficient during a rapidly developing flood. Research on flash flood hydrographs shows that the rising limb, or the period when water climbs fastest, can involve stage increases exceeding 1 meter per hour, and that coarser reporting intervals cause this critical surge window to be missed entirely ([Huang et al., 2020](https://doi.org/10.3390/w12010255]). 

For instance, the NOAA FLASH project runs at a fine, 5-minute interval to capture rapidly developing flash floods (NOAA, 2012). Industry guidance similarly mention quick intervals ranging from a few times per second to minutely for higher-risk rivers and pre-emptive flood detection scenarios ([Manx Tech Group, 2026](https://manxtechgroup.com/iot-ultrasonic-sensors-revolutionising-river-level-monitoring/); [MaxBotix, 2025](https://maxbotix.com/pages/ultrasonic-flood-level-monitoring)).

As such, the system transitions to an **active state** if consecutive per-minute medians reflect a consistent and significant upward trend in water level, escalating the relay interval to **once per minute**. This adaptive escalation is grounded in embedded systems debouncing practice, where a state change is only accepted after N consecutive stable readings confirm the trend, preventing a single anomalous rise from triggering premature escalation ([Gala, 2025](https://kalapiinfotech.in/the-debouncing-pattern-in-embedded-systems/)).

```cpp
// A rise only counts as sustained if the cumulative change across the window exceeds the threshold. A single noisy minute can't trigger escalation on its own.

float netRise = recentMedians[0] - recentMedians[REQUIRED_CONSECUTIVE_RISES];
float totalRequiredRise = ELEVATION_THRESHOLD * REQUIRED_CONSECUTIVE_RISES;
bool isSustainedRise = (netRise >= totalRequiredRise);
```

Once activated, a cooldown-gated exit is triggered even if the surge tapers off immediately to avoid rapid switching between modes. 

```cpp
if (isSustainedRise) {
  activeModeCooldownTimer = MINIMUM_ACTIVE_MINUTES;
  isActiveMode = true;
} else if (isActiveMode && activeModeCooldownTimer == 0) {
  isActiveMode = false; // only revert once cooldown fully expires
}
```

The result is a three-layer design:

1. **Noise filtering within each burst** — the median removes transient spikes before any value is retained.
2. **Trend detection across per-minute medians** — sustained rises trigger the transition to active reporting.
3. **Adaptive transmission** — 10-minute intervals during dry periods, 1-minute intervals during the critical surge window.

This ensures that the sensor is less likely to miss the onset of a sudden flood while avoiding overwhelming the database with redundant readings during normal conditions.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


### Over-the-Air (OTA) Updates
The module supports remote firmware updates by checking for new releases on GitHub at every boot. This is handled entirely over Wi-Fi using `HTTPClient.h` and the ESP32's built-in `Update` library, with no physical access to the device required.

**Update Flow**

1. On boot, the device queries the GitHub Releases API for the latest release tag of the configured repository:
```
GET https://api.github.com/repos/{owner}/{repo}/releases/latest
```
2. The returned `tag_name` is compared against the current version of the firmware (`currentFirmwareVersion`). If they match, the device boots normally.
3. If a newer version is detected, the release assets are scanned for a file matching the configured `firmware_asset_name`. The matching asset's download URL is then constructed:
```
GET https://api.github.com/repos/{owner}/{repo}/releases/assets/{asset_id}
```
4. The `.bin` file is streamed into `Update.write()`. Progress is reported in 5% increments. On a successful write, `Update.end()` finalizes the update and the device restarts with the new firmware.

All GitHub API requests are authenticated using a Personal Access Token (PAT) stored in `secrets.h` to support private repositories.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


### Data Transmission (JSON API)
Data is transmitted via HTTP POST requests to the eLikas server endpoint for sensor logs using `HTTPClient.h`. Each payload is formatted as a JSON object using `ArduinoJson.h`.

**JSON Structure**
```
{
  "apiKey": "A_SECURE_KEY",
  "sensorCode": "SR-XXXXXX",
  "waterLevel": 1.45,
  "sensorTimestamp": "2026-04-11 14:27:21"
}
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## Roadmap
- [x] **Phase 1: Basic Prototyping**
    - [x] Hardware assembly (ESP32 + AJ-SR04M)
    - [x] Basic distance measurement logic

- [x] **Phase 2: Data Handling & Connectivity**
    - [x] **JSON Serialization:** Use `ArduinoJson` to structure data
    - [x] **Wi-Fi Provisioning:** Implement `WiFiManager` with custom password logic
    - [x] **HTTP POST Integration:** Can push JSON Payloads
    - [x] **NTP Timestamping:** Synchronize system clock with global time servers 
          
- [ ] **Phase 3: Logic & Reliability**
    - [x] **Over-the-Air (OTA) Updates:** Enable remote firmware updates 
    - [X] **Signal Filtering:** Implement a median-based algorithm to stabilize water surface readings.

- [ ] **Phase 4: Final Hardware & Power**
    - [ ] **Power Circuitry:** Solder 2x rechargeable Li-ion batteries.
    - [ ] **Physical Interface:** Add a physical power toggle switch.
    - [ ] **Local Display:** Integrate an LCD display.

- [ ] **Phase 5: Deployment**
    - [ ] **Enclosure:** Design/assemble a weather-resistant housing for the ESP32 and power components.
    - [ ] **Field Testing:** Real-world test as a standalone unit beyond bench testing.
    - [X] **PWA Integration:** Map-side visualization of crowdsourced flood data.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
