#include <Arduino.h>

// ============= EDGE IMPULSE INCLUDE =============
#include <BabyWatch-CryDetection_inferencing.h>

// ============= PIN DEFINITIONS =============

// LEDs
const int LED_SAFE      = 25;
const int LED_MONITOR   = 26;
const int LED_ATTENTION = 27;

// PIR sensors
const int PIR_ZONE1 = 32;
const int PIR_ZONE2 = 33;

// Button (wired: one side → 3V3, other → GPIO; HIGH = pressed)
const int BTN_DIAPER = 34;  // diaper reset

// Microphone (MAX4466)
const int MIC_PIN    = 35;  // ADC

// ============= STATE MACHINE =============

enum State : uint8_t {
  STATE_SAFE     = 0,
  STATE_MONITOR  = 1,
  STATE_ATTENTION = 2
};

const uint32_t SUSTAINED_CRY_MS   = 3000;
const uint32_t MOTION_DEBOUNCE_MS = 200;
const uint32_t DIAPER_OVERDUE_MIN = 180;  // 3 hours
const uint32_t DIAPER_WARN_MIN    = 150;  // 2.5 hours
const uint32_t SERIAL_LOG_MS      = 2000;

State currentState = STATE_SAFE;

bool zone1Motion = false;
bool zone2Motion = false;
uint32_t zone1MotionStartMs = 0;
uint32_t zone2MotionStartMs = 0;

float    cryProb        = 0.0f;
bool     cryDetected    = false;
bool     crySustained   = false;
uint32_t cryStartMs     = 0;
uint32_t lastDiaperResetMs = 0;

uint32_t lastLogMs = 0;

// ============= EDGE IMPULSE BUFFER =============
static float features[EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE];

// Normalize raw ADC [0..4095] to roughly [-1.0 .. 1.0]
inline float normalizeSample(int raw) {
  float centered = static_cast<float>(raw) - 2048.0f;
  return centered / 2048.0f;
}

// ---- Cry detection: ML-based probability ----
float computeCryProbability() {
  // Collect audio samples into features buffer
  for (int i = 0; i < EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE; i++) {
    int raw = analogRead(MIC_PIN);
    features[i] = normalizeSample(raw);
    // Adjust to approximate your training sampling rate
    delayMicroseconds(80);  // <<< TUNE based on your model's input
  }

  // Create signal from features buffer
  signal_t signal;
  numpy::signal_from_buffer(features, EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE, &signal);

  // Run classifier
  ei_impulse_result_t result = { 0 };
  EI_IMPULSE_ERROR res = run_classifier(&signal, &result, false);
  
  if (res != EI_IMPULSE_OK) {
    ei_printf("ERR: Failed to run classifier (%d)\n", res);
    return 0.0f;
  }

  // Get cry probability from classification results
  // Assuming your model has labels like: ["non_cry", "cry"]
  // Adjust index based on your actual label order
  float prob = 0.0f;
  
  if (EI_CLASSIFIER_LABEL_COUNT >= 2) {
    // If "cry" is the second label (index 1)
    prob = result.classification[1].value;
  } else if (EI_CLASSIFIER_LABEL_COUNT == 1) {
    // Single output
    prob = result.classification[0].value;
  }

  return prob;
}

// ============= SENSOR & STATE FUNCTIONS =============

void updatePIRSensors() {
  uint32_t now = millis();

  int z1 = digitalRead(PIR_ZONE1);
  if (z1 == HIGH) {
    if (!zone1Motion) zone1MotionStartMs = now;
    zone1Motion = true;
  } else {
    if (zone1Motion && (now - zone1MotionStartMs) > MOTION_DEBOUNCE_MS) {
      zone1Motion = false;
    }
  }

  int z2 = digitalRead(PIR_ZONE2);
  if (z2 == HIGH) {
    if (!zone2Motion) zone2MotionStartMs = now;
    zone2Motion = true;
  } else {
    if (zone2Motion && (now - zone2MotionStartMs) > MOTION_DEBOUNCE_MS) {
      zone2Motion = false;
    }
  }
}

void updateCryState() {
  static uint32_t highStartMs = 0;
  uint32_t now = millis();

  cryProb = computeCryProbability();

  // Threshold for "model says cry"
  const float CRY_DETECT_LEVEL = 0.7f;  // <<< TUNE with real data

  if (cryProb >= CRY_DETECT_LEVEL) {
    if (highStartMs == 0) highStartMs = now;
    cryDetected  = true;
    crySustained = (now - highStartMs >= SUSTAINED_CRY_MS);
  } else {
    cryDetected  = false;
    crySustained = false;
    highStartMs  = 0;
  }
}

void handleButtons() {
  // Diaper reset (HIGH = pressed)
  if (digitalRead(BTN_DIAPER) == HIGH) {
    delay(30);
    if (digitalRead(BTN_DIAPER) == HIGH) {
      lastDiaperResetMs = millis();
      Serial.println("Diaper timer reset");
      while (digitalRead(BTN_DIAPER) == HIGH) delay(10);
      delay(100);
    }
  }
}

void updateStateMachine() {
  uint32_t now       = millis();
  uint32_t diaperMin = (now - lastDiaperResetMs) / 60000UL;
  bool diaperOverdue = (diaperMin >= DIAPER_OVERDUE_MIN);
  bool diaperNear    = (diaperMin >= DIAPER_WARN_MIN);

  State newState = STATE_SAFE;

  // ATTENTION if sustained cry, cry+Zone1 motion, or diaper overdue
  if (crySustained || (cryDetected && zone1Motion) || diaperOverdue) {
    newState = STATE_ATTENTION;
  }
  // MONITOR if any motion, cryDetected, or diaper near
  else if (zone1Motion || zone2Motion || cryDetected || diaperNear) {
    newState = STATE_MONITOR;
  }
  // SAFE otherwise

  currentState = newState;
}

void updateLEDs() {
  digitalWrite(LED_SAFE,      currentState == STATE_SAFE);
  digitalWrite(LED_MONITOR,   currentState == STATE_MONITOR);
  digitalWrite(LED_ATTENTION, currentState == STATE_ATTENTION);
}

void logSerial() {
  uint32_t now = millis();
  if (now - lastLogMs < SERIAL_LOG_MS) return;
  lastLogMs = now;

  uint32_t diaperMin = (now - lastDiaperResetMs) / 60000UL;

  int priority = 1;
  if (currentState == STATE_MONITOR) priority = 2;
  else if (currentState == STATE_ATTENTION) priority = 3;

  const char* stateStr = "SAFE";
  if (currentState == STATE_MONITOR) stateStr = "MONITOR";
  else if (currentState == STATE_ATTENTION) stateStr = "ATTENTION";

  const char* zoneStr = "NONE";
  if (zone1Motion) zoneStr = "Z1";
  else if (zone2Motion) zoneStr = "Z2";

  bool diaperOverdue = (diaperMin >= DIAPER_OVERDUE_MIN);

  // JSON line (no comments, backend-friendly)
  Serial.print("{");
  Serial.print("\"id\":\"A\",");
  Serial.print("\"room\":\"Room 2\",");
  Serial.print("\"state\":\"");      Serial.print(stateStr); Serial.print("\",");
  Serial.print("\"priority\":");     Serial.print(priority); Serial.print(",");
  Serial.print("\"zone\":\"");       Serial.print(zoneStr);  Serial.print("\",");
  Serial.print("\"cry_prob\":");     Serial.print(cryProb, 2); Serial.print(",");
  Serial.print("\"cry_sustained\":"); Serial.print(crySustained ? "true" : "false"); Serial.print(",");
  Serial.print("\"motion_zone1\":"); Serial.print(zone1Motion ? "true" : "false"); Serial.print(",");
  Serial.print("\"motion_zone2\":"); Serial.print(zone2Motion ? "true" : "false"); Serial.print(",");
  Serial.print("\"diaper_min\":");   Serial.print(diaperMin); Serial.print(",");
  Serial.print("\"diaper_overdue\":"); Serial.print(diaperOverdue ? "true" : "false"); Serial.print(",");
  Serial.print("\"last_update_ms\":"); Serial.print(now);
  Serial.println("}");
}

// ============= SETUP & LOOP =============

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== BabyWatch Room2 (Audio + PIR + ML) ===");

  pinMode(LED_SAFE, OUTPUT);
  pinMode(LED_MONITOR, OUTPUT);
  pinMode(LED_ATTENTION, OUTPUT);

  pinMode(PIR_ZONE1, INPUT);
  pinMode(PIR_ZONE2, INPUT);

  pinMode(BTN_DIAPER, INPUT);   // HIGH = pressed
  pinMode(MIC_PIN, INPUT);

  lastDiaperResetMs = millis();
  currentState = STATE_SAFE;

  // Print Edge Impulse info
  ei_printf("Edge Impulse Inferencing Ready\n");
  ei_printf("Model: %s\n", EI_CLASSIFIER_PROJECT_NAME);
  ei_printf("Input size: %d\n", EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE);
  ei_printf("Label count: %d\n", EI_CLASSIFIER_LABEL_COUNT);
}

void loop() {
  handleButtons();
  updatePIRSensors();
  updateCryState();      // driven by ML
  updateStateMachine();
  updateLEDs();
  logSerial();
  delay(20);
}