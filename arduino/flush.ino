#include "HttpClient/HttpClient.h"

#define PIN_SENSOR 2

HttpClient http;

http_header_t headers[] = {
	{ "Content-Type", "application/x-www-form-urlencoded" },
	{ NULL, NULL } // NOTE: Always terminate headers will NULL
};

http_request_t request;
http_response_t response;

void setup() {
	Serial.begin(9600);
	pinMode(PIN_SENSOR, INPUT_PULLUP);

	request.hostname = "sidlee.herokuapp.com";
	request.port = 80;
	request.path = "/api/1/event";

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
	data += "&token=a7485fc8-ed22-495c-51fb-2859397537ea";
	Serial.println(data);
	request.body = data;
	http.post(request, response, headers);
}
