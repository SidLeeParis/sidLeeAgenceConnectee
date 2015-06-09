#include <Ethernet.h>
#include <SPI.h>
#include <SoftwareSerial.h>
#include <Button.h>
#include <elapsedMillis.h>

char inChar;
String data = "";

elapsedMillis edfElapsed;
elapsedMillis doorElapsed;
unsigned int edfInterval = 5000;
unsigned int doorInterval = 100;

SoftwareSerial teleInfo(2, 3);
int watts;
boolean canSend = true;

Button door = Button(A0, INPUT_PULLUP);

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x04 };
EthernetClient client;

void setup() {
	Serial.begin(9600);
	teleInfo.begin(1200);
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
	}
	delay(1000);
}

void loop() {

	if (teleInfo.available()) {
		inChar = teleInfo.read() & 0x7F;
		if (inChar == '\n') {
			int current = getIINST();
			if (current > 0) {
				canSend = true;
				watts = current * 230;
			}
		}
		else {
			data += inChar;
		}
	}
	if (watts > 0 && edfElapsed > edfInterval && canSend) {
		canSend = false;
		sendEvent("watt", String(watts, DEC), "watts");
		edfElapsed = 0;
	}

	if (door.uniquePress() && doorElapsed > doorInterval) {
		sendEvent("door", "1", "door");
		doorElapsed = 0;
	}
}

int getIINST() {
	int iinst = -1;
	// check if line is at least 39 chars long
	if(data.indexOf("IINST1") > 0 && data.indexOf("IINST2") > 0 && data.indexOf("IINST3") > 0) {
		String line = data.substring(data.indexOf("IINST1"), data.indexOf("IINST3")+10);
		//Serial.println(line);
		//IINST1 002  3IINST2 012  6IINST3 006
		iinst = line.substring(7,10).toInt() + line.substring(21,24).toInt() + line.substring(35,39).toInt();
		//Serial.print("total: ");
		//Serial.println(iinst);
	}
	data = "";
	return iinst;
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
