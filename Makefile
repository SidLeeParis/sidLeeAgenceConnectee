MOCHA="node_modules/.bin/mocha"
_MOCHA="node_modules/.bin/_mocha"
MOCHA_PHANTOM="node_modules/.bin/mocha-phantomjs"
JSHINT="node_modules/.bin/jshint"
ISTANBUL="node_modules/.bin/istanbul"
CODECLIMATE="node_modules/.bin/codeclimate"
KARMA="node_modules/karma/bin/karma"
SUPERVISOR="node_modules/.bin/supervisor"

TESTS=$(shell find test/ -name "*.test.js")

clean:
	rm -rf reports

back-test:
	$(MOCHA) -R spec $(TESTS)

front-test:
	@#$(MOCHA_PHANTOM) -R spec test/public/test.html
	-$(KARMA) start


test: back-test front-test

jshint:
	$(JSHINT) src test app/scripts/api
coverage:
	@# check if reports folder exists, if not create it
	@test -d reports || mkdir reports
	$(ISTANBUL) cover --dir ./reports $(_MOCHA) -- -R spec $(TESTS)
	@# merge client side coeverage in server side lcov
	@cat ./reports/phantomjs/lcov.info >> ./reports/lcov.info

codeclimate:
	CODECLIMATE_REPO_TOKEN=dec3f4db135a9088676a04f44bdc4c4857b9012c46b1e2f35801e8ffc5f68678 $(CODECLIMATE) < reports/lcov.info

ci: clean jshint test coverage codeclimate

dev-server:
	$(SUPERVISOR) ./src/app

.PHONY: clean back-test front-test test jshint coverage codeclimate ci dev-server
