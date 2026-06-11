#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "DESKTOP-D5LGHO7 3127";
const char* password = "00000000";

WebServer server(80);

#define DATA_PIN  23
#define CLOCK_PIN 18
#define LATCH_PIN 5

// (row, col) → bit position in shift register byte
const int bitMap[2][3] = {
  {0, 1, 2},
  {3, 4, 5}
};

uint8_t ledState = 0;

void writeShiftRegister(uint8_t data) {
  digitalWrite(LATCH_PIN, LOW);
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, data);
  digitalWrite(LATCH_PIN, HIGH);
}

void handleLight();

void setup() {
  Serial.begin(115200);

  pinMode(DATA_PIN, OUTPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  writeShiftRegister(0);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  WiFi.setSleep(false);

  server.on("/light", HTTP_GET, handleLight);
  server.begin();
  Serial.println("HTTP server started");
}

unsigned long lastWiFiCheck = 0;
const unsigned long wiFiCheckInterval = 10000; // Check Wi-Fi status every 10 seconds

void loop() {
  server.handleClient();

  unsigned long currentMillis = millis();
  if (currentMillis - lastWiFiCheck >= wiFiCheckInterval) {
    lastWiFiCheck = currentMillis;
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Wi-Fi connection lost. Reconnecting...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }
  }
}

void handleLight() {
  if (!server.hasArg("row") || !server.hasArg("col")) {
    server.send(400, "text/plain", "Missing row or col parameters");
    return;
  }

  int row = server.arg("row").toInt();
  int col = server.arg("col").toInt();

  if (row < 1 || row > 2 || col < 1 || col > 3) {
    server.send(400, "text/plain", "Invalid row or col. Row must be 1-2, col must be 1-3.");
    return;
  }

  int bit = bitMap[row - 1][col - 1];
  bool isAlreadyOn = (ledState >> bit) & 1;

  ledState = 0;
  if (!isAlreadyOn) ledState |= (1 << bit);

  writeShiftRegister(ledState);

  server.send(200, "text/plain", isAlreadyOn ? "LED toggled off" : "LED highlighted");
}