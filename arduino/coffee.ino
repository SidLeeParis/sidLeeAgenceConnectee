// cf. http://www.olino.org/articles/2014/09/14/reparatie-magimix-m190-nespresso
#include <Ethernet.h>
#include <SPI.h>
#include <RunningMedian.h>

#define PIN_GD_CAFE A1
#define PIN_PT_CAFE A0

RunningMedian gdCafe = RunningMedian(50);
RunningMedian ptCafe = RunningMedian(50);

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x03 };
EthernetClient client;

void setup() {
	Serial.begin(9600);
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
	}
	delay(1000);
}

void loop() {
	int i;
	for (i=0; i<50; i++) {
		long gdCafeSample = analogRead(PIN_GD_CAFE);
		gdCafe.add(gdCafeSample);
		long ptCafeSample = analogRead(PIN_PT_CAFE);
		ptCafe.add(ptCafeSample);
	}
	float medianGdCafe = gdCafe.getMedian();
	float medianPtCafe = ptCafe.getMedian();

	if (medianPtCafe > 400 && medianGdCafe < 300) {
		sendEvent("coffee", "1", "coffee", false);
		delay(30000);
	}
	else if (medianGdCafe > 400 && medianPtCafe < 300) {
		sendEvent("coffee", "1", "coffee", true);
		delay(30000);
	}

	delay(500);
}

void sendEvent(String name, String value, String unit, boolean bigOrNot) {
	String data = "name=" + name + "&value=" + value + "&unit=" + unit + "&big=" + bigOrNot;
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
