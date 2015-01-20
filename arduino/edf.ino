#include <Ethernet.h>
#include <SPI.h>
#include <SoftwareSerial.h>
#include <Button.h>
#include <elapsedMillis.h>

#define DEBUT_TRAME 0x02
#define DEBUT_LIGNE 0x0A
#define FIN_LIGNE 0x0D

byte inByte = 0;
char teleInfoData[21] = "";
byte index = 0;

elapsedMillis timeElapsed;
unsigned int interval = 30000;

SoftwareSerial teleInfo(2, 3);

Button door = Button(A0, INPUT_PULLUP);

byte mac[] = { 0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x04 };
EthernetClient client;
String data;

void setup() {
	Serial.begin(9600);
	teleInfo.begin(1200);
	if (Ethernet.begin(mac) == 0) {
		Serial.println("Failed to configure Ethernet using DHCP");
	}
	data = "";
	delay(1000);
}

void loop() {

	if (teleInfo.available() && timeElapsed > interval) {
		inByte = teleInfo.read() & 0x7F;;
		if (inByte == DEBUT_TRAME || inByte == DEBUT_LIGNE) index = 0;
		teleInfoData[index] = inByte;
		index++;
		if (index > 21) index=0;
		if (inByte == FIN_LIGNE && index > 5) {
			if (teleInfoData[1] == 'I' && teleInfoData[2] == 'I') {
				char buffer[4];
				buffer[0] = teleInfoData[7];
				buffer[1] = teleInfoData[8];
				buffer[2] = teleInfoData[9];
				buffer[3] = '\0';
				int  watts;
				watts = atoi(buffer) * 230;
				sendEvent("watt", String(watts, DEC), "watts");
			}
		}
	}

	if (door.uniquePress()) {
		sendEvent("door", "1", "door");
	}
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
