#include <Ethernet.h>
#include <SPI.h>

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x01 };
EthernetClient client;
String data;

void setup() {
	Serial.begin(9600);
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
	}
	delay(1000);
	data = "";
}

void loop(){
	data = "name=random&type=%&value=" + String(random(100), DEC);
	Serial.println(data);
	if (client.connect("192.168.1.24",3000)) {
		client.println("POST /api/1/event HTTP/1.1");
		client.println("Host: 192.168.1.24");
		client.println("Content-Type: application/x-www-form-urlencoded");
		client.print("Content-Length: ");
		client.println(data.length());
		client.println();
		client.print(data);
	}
	if (client.connected()) {
		client.stop();
	}
	delay(3000);
}
