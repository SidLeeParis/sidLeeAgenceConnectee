// cf. http://www.righto.com/2010/03/detecting-ir-beam-break-with-arduino-ir.html
// 2 ir leds on PIN 3, in parallel
#include <Ethernet.h>
#include <SPI.h>
#include <IRremote.h>

#define PIN_IR 3
#define PIN_RED 4
#define PIN_BLUE 5
#define PIN_STATUS 9

IRsend irsend;

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x01 };
EthernetClient client;

void setup() {
	Serial.begin(9600);
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
	}
	pinMode(PIN_RED, INPUT);
	pinMode(PIN_BLUE, INPUT);
	pinMode(PIN_STATUS, OUTPUT);
	irsend.enableIROut(38);
	irsend.mark(0);
	delay(1000);
}

void loop(){
	if (digitalRead(PIN_RED)) {
		sendEvent("red", "1", "goal");
		digitalWrite(PIN_STATUS, HIGH);
		delay(500);
	}
	else if (digitalRead(PIN_BLUE)) {
		sendEvent("blue", "1", "goal");
		digitalWrite(PIN_STATUS, HIGH);
		delay(500);
	}
	else {
		digitalWrite(PIN_STATUS, LOW);
	}
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
