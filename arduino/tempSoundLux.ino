#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_TSL2561_U.h>
#include <Ethernet.h>
#include <SPI.h>
#include <elapsedMillis.h>
#include <RunningMedian.h>

#define PIN_TEMP 0
#define PIN_DB 2

elapsedMillis timeElapsed;
const unsigned int interval = 20000;

boolean canSend = true;
elapsedMillis canSendDelay;
const unsigned int canSendInterval = 2000;

RunningMedian dbSamples = RunningMedian(40);
elapsedMillis canSampleDbDelay;
const unsigned int canSampleDbInterval = 500;

const int numberOfSamples = 9;
const int dB[] = {30, 32, 45, 60, 69, 72, 74, 76, 80};
const double analogValues[] = {0.0, 0.14, 0.6, 1.39, 2.6, 3.68, 5.2, 6.24, 130.2};
const int threshold = 25;
int previousdB = 0;

Adafruit_TSL2561_Unified tsl = Adafruit_TSL2561_Unified(TSL2561_ADDR_FLOAT, 12345);

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x05 };
EthernetClient client;

void setup() {
	Serial.begin(9600);
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
	}
	// start and configure lux sensor
	if(!tsl.begin()) {
		Serial.print("Failed to configure lux sensor");
	}
	tsl.enableAutoRange(true);
	//tsl.setGain(TSL2561_GAIN_16X);
	//tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_402MS);
	tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_13MS);

	delay(1000);
}

void loop() {
	int currentdB = getDb(PIN_DB);
	if (canSampleDbDelay > canSampleDbInterval) {
		dbSamples.add(currentdB);
	}
	if (abs(currentdB - previousdB) > threshold && canSend) {
		sendEvent("sound", String(currentdB, DEC), "dB");
		canSend = false;
		canSendDelay = 0;
	}
	previousdB = currentdB;
	if (canSendDelay > canSendInterval) {
		canSend = true;
	}
	if (timeElapsed > interval) {
		sendEvent("degrees", getTemp(PIN_TEMP), "C");
		sendEvent("sound", String((int) dbSamples.getAverage(), DEC), "dB");
		sendEvent("light", getLux(), "lux");
		timeElapsed = 0;
	}
}

int getDb(int dBPin) {
	int i;
	double value = 0;
	// take 1000 measures to get a more meaningful value
	for(i=0; i<1000; i++) {
		value += analogRead(dBPin);
	}
	value = value / 1000;
	// constraint it to the min and max values the sensor is able to measure
	value = constrain(value, analogValues[0], analogValues[numberOfSamples-1]);
	// if the value is the maximun one return it
	if (value == analogValues[numberOfSamples-1]) {
		return dB[numberOfSamples-1];
	}
	// else extrapolate to a measure between the range of the closest samples
	else {
		for(i=0; i<numberOfSamples-1; i++) {
			if(analogValues[i] <= value && analogValues[i+1] > value) {
				return dB[i] + int((value * (dB[i+1] - dB[i])) / analogValues[i+1]);
			}
		}
	}
}

String getTemp(int tempPin) {
	float temp = ((500.0 * analogRead(tempPin)) /1024.0);
	// keep only 2 decimals
	String t = String(temp, DEC);
	t = t.substring(0, t.indexOf('.') + 2);
	return t;
}

String getLux() {
	sensors_event_t event;
	tsl.getEvent(&event);
	return String((int) event.light, DEC);
}


void sendEvent(String name, String value, String unit) {
	String data = "name=" + name + "&value=" + value + "&unit=" + unit;
	data += "&token=a7485fc8-ed22-495c-51fb-2859397537ea";
	Serial.println(data);
	if (client.connect("sidlee.herokuapp.com",80)) {
		client.println("POST /api/1/event HTTP/1.1");
		client.println("Host: sidlee.herokuapp.com");
		client.println("Content-Type: application/x-www-form-urlencoded");
		client.print("Content-Length: ");
		client.println(data.length());
		client.println();
		client.print(data);
	}
	if (client.connected()) {
		client.stop();
	}
}
