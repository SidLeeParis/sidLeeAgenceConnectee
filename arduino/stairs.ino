#include <Ethernet.h>
#include <SPI.h>

// ir beam between GND and D2
#define PIN_SENSOR 2

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x06 };
EthernetClient client;
String data;

int previousState = HIGH;

void setup() {
	Serial.begin(9600);
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
	}
	pinMode(PIN_SENSOR, INPUT_PULLUP);
	data = "";
	delay(1000);
}

void loop() {
	int irBeamState = digitalRead(PIN_SENSOR);
	if (irBeamState == LOW && previousState == HIGH) {
		sendEvent("stairs", "12", "stairs");
		delay(1000);
	}
	previousState = irBeamState;
	delay(50);
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
