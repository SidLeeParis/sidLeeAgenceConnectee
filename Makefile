MOCHA="node_modules/.bin/mocha"
_MOCHA="node_modules/.bin/_mocha"
JSHINT="node_modules/.bin/jshint"
ISTANBUL="node_modules/.bin/istanbul"
CODECLIMATE="node_modules/.bin/codeclimate"

TESTS=$(shell find test/ -name "*.test.js")

clean:
	rm -rf reports

test:
	$(MOCHA) -R spec $(TESTS)

jshint:
	$(JSHINT) src test

coverage:
	@# check if reports folder exists, if not create it
	@test -d reports || mkdir reports
	$(ISTANBUL) cover --dir ./reports $(_MOCHA) -- -R spec $(TESTS)

codeclimate:
	CODECLIMATE_REPO_TOKEN=dec3f4db135a9088676a04f44bdc4c4857b9012c46b1e2f35801e8ffc5f68678 $(CODECLIMATE) < reports/lcov.info

ci: clean jshint test coverage codeclimate

.PHONY: clean test jshint coverage codeclimate ci
