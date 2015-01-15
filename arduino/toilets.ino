#include <Ethernet.h>
#include <SPI.h>

#define PIN_SENSOR 2

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x03 };
EthernetClient client;
String data;

void setup() {
	Serial.begin(9600);
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
	}
	pinMode(PIN_SENSOR, INPUT);
	digitalWrite(PIN_SENSOR, HIGH);
	data = "";
	delay(1000);
}

void loop() {
	int sensorVal = digitalRead(2);
	if (sensorVal == HIGH) {
		sendEvent("flush", "1", "flush");
		delay(10000);
	}
}

void sendEvent(String name, String value, String unit) {
	String data = "name=" + name + "&value=" + value + "&unit=" + unit;
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
