#include <Ethernet.h>
#include <SPI.h>

#define PIN_TEMP 0
#define PIN_DB 2

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x05 };
EthernetClient client;
String data;

void setup() {
	Serial.begin(9600);
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
	}
	data = "";
	delay(1000);
}

void loop() {
	sendEvent("roomTemp", String(getTemp(PIN_TEMP), DEC), "C");
	sendEvent("sound", String(getDb(PIN_DB), DEC), "dB");
	delay(10000);
}

int getDb(int dBPin) {
	// sampled data, as a referential
	int numberOfSamples = 9;
	int dB[] = {30, 32, 45, 60, 69, 72, 74, 76, 80};
	double analogValues[] = {0.0, 0.14, 0.6, 1.39, 2.6, 3.68, 5.2, 6.24, 130.2};

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

int getTemp(int tempPin) {
	return (500 * analogRead(tempPin)) /1024;
}


void sendEvent(String name, String value, String unit) {
	String data = "name=" + name + "&value=" + value + "&unit=" + unit;
	data += "&token=***REMOVED***";
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
