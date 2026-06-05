#include <WiFi.h>
#include <WebServer.h>

// WiFi credentials (update these)
const char* ssid = "DESKTOP-D5LGHO7 3127";
const char* password = "00000000";

// Web server on port 80
WebServer server(80);

// Placeholder GPIO pins for 6 compartments
// Drawer size: 3 rows x 2 cols
#define PIN_R1_C1 2
#define PIN_R1_C2 4
#define PIN_R2_C1 5
#define PIN_R2_C2 18
#define PIN_R3_C1 19
#define PIN_R3_C2 21

// 2D Array mapping (row, col) to GPIO pin
// Rows are 1-3, Cols are 1-2. 
// Array indices are 0-based, so row 1 is index 0.
const int ledPins[3][2] = {
  {PIN_R1_C1, PIN_R1_C2}, // Row 1
  {PIN_R2_C1, PIN_R2_C2}, // Row 2
  {PIN_R3_C1, PIN_R3_C2}  // Row 3
};

void setup() {
  Serial.begin(115200);
  
  // Initialize all LED pins as OUTPUT and set them LOW
  for (int r = 0; r < 3; r++) {
    for (int c = 0; c < 2; c++) {
      pinMode(ledPins[r][c], OUTPUT);
      digitalWrite(ledPins[r][c], LOW);
    }
  }

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Setup routes
  server.on("/light", HTTP_GET, handleLight);

  // Start server
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}

void handleLight() {
  // Check if arguments exist
  if (!server.hasArg("row") || !server.hasArg("col")) {
    server.send(400, "text/plain", "Missing row or col parameters");
    return;
  }

  int row = server.arg("row").toInt();
  int col = server.arg("col").toInt();

  // Validate bounds (1-based index from backend)
  if (row < 1 || row > 3 || col < 1 || col > 2) {
    server.send(400, "text/plain", "Invalid row or col. Row must be 1-3, col must be 1-2.");
    return;
  }

  int targetPin = ledPins[row - 1][col - 1];

  // Check if the target LED is already on
  bool isAlreadyOn = digitalRead(targetPin);

  // Turn off all LEDs first
  for (int r = 0; r < 3; r++) {
    for (int c = 0; c < 2; c++) {
      digitalWrite(ledPins[r][c], LOW);
    }
  }

  // If it was already on, it's now off, so we just return
  if (isAlreadyOn) {
    server.send(200, "text/plain", "LED was already on, so it has been toggled off.");
  } else {
    // Otherwise, turn on the specific LED
    digitalWrite(targetPin, HIGH);
    server.send(200, "text/plain", "LED highlighted");
  }
}
