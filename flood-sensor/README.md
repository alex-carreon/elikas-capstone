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
      <a href="#roadmap">Roadmap</a>
      <ul>
        <li><a href="#phase-1-basic-prototyping">Phase 1: Basic Prototyping</a></li>
        <li><a href="#phase-2-data-handling--connectivity">Phase 2: Data Handling & Connectivity</a></li>
        <li><a href="#phase-3-logic--reliability">Phase 3: Logic & Reliability</a></li>
        <li><a href="#phase-4-final-hardware--power">Phase 4: Final Hardware & Power</a></li>
        <li><a href="#phase-5-deployment">Phase 5: Deployment</a></li>
      </ul>
    </li>
  </ol>
</details>


<!-- ABOUT THE PROJECT -->
## About The Project

The Flood Sensor module uses ultrasonic sound waves to monitor water levels in real-time. By calculating the distance between the sensor and the water surface, this component can detect rising water levels and provide early warnings for potential flooding. 

This module is designed to sit inside a weather-resistant housing, utilizing the waterproof capabilities of the AJ-SR04M probe to ensure longevity in high-humidity environments. It integrates with the **Elikas Capstone** ecosystem via Wi-Fi to report data.
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
Because the ESP32 operates on 3.3V logic, it cannot safely receive the 5V return signal from the AJ-SR04M. To prevent GPIO damage, there is a voltage divider using 1k$\Omega$ and 2k$\Omega$ resistors.

| AJ-SR04M Pin | Shield / ESP32 Pin | Logic Level | Connection Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| VCC | 5V | 5V | Direct | Main power from the Shield's 5V rail |
| GND | GND | 0V | Direct | Common ground for sensor and resistors | 
| Trig | GPIO 5 | 3.3V | Direct | Pulse trigger sent from ESP32 to sensor |
| Echo | GPIO 18 | 3.3V | In-line Solder | Voltage Divider: 1kΩ (Series) + 2kΩ (to GND) |

<p align="right">(<a href="#readme-top">back to top</a>)</p>


### Prerequisites

To flash and monitor the sensor, the following are needed:
* **[Arduino IDE](https://downloads.arduino.cc/arduino-ide/arduino-ide_2.3.8_Windows_64bit.exe)** (recommended)
* **ESP32 Board Package by Espressif Systems:** Install via the Boards Manager.
* **[CP2102 Drivers by Silicon Labs](https://www.silabs.com/software-and-tools/usb-to-uart-bridge-vcp-drivers?tab=downloads):** Ensure your OS recognizes the Type-C Serial bridge.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Roadmap
- [x] **Phase 1: Basic Prototyping**
    - [x] Hardware assembly (ESP32 + AJ-SR04M)
    - [x] Basic distance measurement logic

- [ ] **Phase 2: Data Handling & Connectivity**
    - [ ] **JSON Serialization:** Implement `ArduinoJson` to package distance, sensor ID, and timestamp.
    - [ ] **Wi-Fi Provisioning:** Implement `WiFiManager` to allow users to configure Wi-Fi credentials.
    - [ ] **HTTP POST Integration:** Develop the client to push JSON payloads to the Elikas backend API.
          
- [ ] **Phase 3: Logic & Reliability**
    - [ ] **Signal Filtering:** Implement a moving average algorithm to stabilize water surface readings.
    - [ ] **Power Management:** Configure ESP32 Deep Sleep cycles to maximize battery life between transmissions.
    - [ ] **Over-the-Air (OTA) Updates:** Enable remote firmware updates since the sensor will be in a waterproof housing.

- [ ] **Phase 4: Final Hardware & Power**
    - [ ] **Power Circuitry:** Solder 2x rechargeable Li-ion batteries with an optional TP4056/Solar charging module.
    - [ ] **Physical Interface:** Add a physical power toggle switch.
    - [ ] **Local Display:** Integrate an OLED/LCD display for real-time status (Wi-Fi signal, Battery %, Distance).

- [ ] **Phase 5: Deployment**
    - [ ] **Enclosure:** Design/assemble a weather-resistant housing for the ESP32 and power components.
    - [ ] **Field Testing:** Real-world stress test in outdoor settings.
    - [ ] **PWA Integration:** Map-side visualization of crowdsourced flood data.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
