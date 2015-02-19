#include <Ethernet.h>
#include <SPI.h>
#include <Button.h>

// sensor between GND and D2
#define PIN_SENSOR A0

// diamètre mini : 3.5 cm
// diamètre maxi: 15 cm
// longueur de papier moyenne par tour: (3.5*3.14 + 15*3.14) / 2 = 29 cm
#define AVG 29

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x07 };
EthernetClient client;

Button tracer = Button(PIN_SENSOR, INPUT_PULLUP);

void setup() {
	Serial.begin(9600);
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
	}
	delay(1000);
}

void loop() {
	if (tracer.uniquePress()) {
		sendEvent("tracer", String(AVG, DEC), "cm");
	}
	delay(50);
}

void sendEvent(String name, String value, String unit) {
	String data = "name=" + name + "&value=" + value + "&unit=" + unit;
	data += "&token=MY_TOKEN";
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
