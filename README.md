[![Build Status](https://travis-ci.org/xseignard/sidLeeAgenceConnectee.svg)](https://travis-ci.org/xseignard/sidLeeAgenceConnectee)
[![Test Coverage](https://codeclimate.com/github/xseignard/sidLeeAgenceConnectee/badges/coverage.svg)](https://codeclimate.com/github/xseignard/sidLeeAgenceConnectee)

# Utilisation de l'API cliente

## Connecter un client:
```
var client = new SidLeeClient('https://sidlee.herokuapp.com/', function(data) {
    console.log(data);
});
```
La fonction passée en callback est appelée à chaque fois qu'une nouvelle mesure est reçue.

## Requeter les anciennes mesures
```
client.events().exec(function(data) {
  console.log(data);
});
```
`events` accepte un argument optionnel permettant de filtrer par nom d'évènement. Chaque capteur aura son nom d'évènement, ainsi on peut filter par nom:

```
client.events('test').exec(function(data) {
  console.log(data);
});
```

On peut aussi filtrer par date avec `from` et `to`:
```
client.events('random')
		.from('2014-12-01')
		.to('2014-12-02')
		.exec(function(data) {
			console.log(data);
		});
```

Cela retournera les mesures du capteur 'random' entre les dates du 1er décembre et du 2 décembre.

Enfin, il est possible de limiter le nombre de résultats avec `limit`:

```
client.events('random')
		.from('2014-12-01')
		.to('2014-12-02')
		.limit(10)
		.exec(function(data) {
			console.log(data);
		});
```

Comme l'exemple précédent, mais ne retournant que 10 résultats.

Il s'agit d'une api utilisant le pattern de [fluent interface](http://martinfowler.com/bliki/FluentInterface.html), cela veut dire qu'il est possible de chainer les fonctions, mais il ne faut pas oublier d'appeler `exec` pour effectivement éxecuter la requête.

Un exemple sur jsfiddle: [http://jsfiddle.net/07acad0b/](http://jsfiddle.net/07acad0b/)
