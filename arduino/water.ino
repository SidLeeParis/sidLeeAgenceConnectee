// cf. http://www.seeedstudio.com/wiki/index.php?title=G1/2_Water_Flow_sensor
#include <Ethernet.h>
#include <SPI.h>

#define PIN_SENSOR 2

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x02 };
EthernetClient client;
String data;

float calibrationFactor = 6.8;
volatile byte pulseCount;
float flowRate;
unsigned int flowMilliLitres;
unsigned long oldTime;

void setup() {
	Serial.begin(9600);
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
	}
	pinMode(PIN_SENSOR, INPUT);
	digitalWrite(PIN_SENSOR, HIGH);

	pulseCount = 0;
	flowRate = 0.0;
	flowMilliLitres = 0;
	oldTime = 0;
	data = "";

	attachInterrupt(0, pulseCounter, FALLING);
	delay(1000);
}

void loop() {
	if((millis() - oldTime) > 10000) {
		detachInterrupt(0);
		flowRate = ((10000.0 / (millis() - oldTime)) * pulseCount) / calibrationFactor;
		oldTime = millis();
		flowMilliLitres = (flowRate / 60) * 1000;
		if (flowMilliLitres > 0) {
			sendEvent("water", String(flowMilliLitres, DEC), "ml");
		}
		pulseCount = 0;
		attachInterrupt(0, pulseCounter, FALLING);
	}
}

void pulseCounter() {
	pulseCount++;
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
