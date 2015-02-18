[![Build Status](https://travis-ci.org/SidLeeParis/sidLeeAgenceConnectee.svg)](https://travis-ci.org/SidLeeParis/sidLeeAgenceConnectee)
[![Test Coverage](https://codeclimate.com/github/xseignard/sidLeeAgenceConnectee/badges/coverage.svg)](https://codeclimate.com/github/xseignard/sidLeeAgenceConnectee)

# Utilisation de l'API cliente

## Connecter un client:
```javascript
var client = new SidLeeClient('https://sidlee.herokuapp.com/', function(data) {
	console.log(data);
});
```
La fonction passée en callback est appelée à chaque fois qu'une nouvelle mesure est reçue.

## Requeter les mesures du jour
```javascript
client.today().exec(function(data) {
	console.log(data);
});
```
`data` retourne un objet contenant une vue aggrégée des évènements ayant eu lieu ce jour. Voici un exemple de la structure retournée:
```json
[
	{
		"_id": "visits",
		"value": 2
	},
	{
		"_id": "likes",
		"value": 86818
	},
	{
		"_id": "undo",
		"value": 160,
		"date": "DATE_OF_LAST_EVENT",
		"app": "my app",
		"user": "user"
	}
]
```

Pour chacun des capteurs, et API interrogées, le client renvoie un doublet contenant le nom de l'event et une valeur represantant soit la moyenne, soit la somme des données mesurées pour l'event. `undo` est un cas particulier car il renvoie aussi le dernier `undo` (`date`, `app` et `user`).

La liste des capteurs et API est disponible [ici](https://github.com/xseignard/sidLeeAgenceConnectee/blob/master/src/conf/sensorsConf.js).

## Requeter les mesures des dernières 24h
```javascript
client.last24().exec(function(data) {
	console.log(data);
});
```
`data` retourne un objet contenant une vue aggrégée des évènements ayant eu lieu lors des dernières 24 heures, triées par tranches horaire. Voici un exemple de la structure retournée:
```json
[
	{
		"_id": "red",
		"values": [
			{
				"hourAgo": 0,
				"value": 1
			},
			{
				"hourAgo": 12,
				"value": 5
			},
			{
				"hourAgo": 17,
				"value": 14
			},
			{
				"hourAgo": 18,
				"value": 2
			},
			{
				"hourAgo": 21,
				"value": 12
			},
			{
				"hourAgo": 22,
				"value": 2
			}
		]
	},
	...
]
```
Retourne soit une somme, soit une moyenne heure par heure des relevés des capteurs. Le format horaire est un format "hour ago", c'est à dire que dans l'exemple ci-dessus, il y a eu un event "red" dans l'heure en cours, 5 events "red" 12h plus tôt, etc.


## Requeter les mesures des derniers 30 jours
```javascript
client.last30().exec(function(data) {
	console.log(data);
});
```
Idem à last 24, mais la somme ou la moyenne est journalière. En lieu et place de `hourAgo`, ce sera `dayAgo`.


Il s'agit d'une api utilisant le pattern de [fluent interface](http://martinfowler.com/bliki/FluentInterface.html), cela veut dire qu'il est possible de chainer les fonctions, mais il ne faut pas oublier d'appeler `exec` pour effectivement éxecuter la requête.

Un exemple sur jsfiddle: [http://jsfiddle.net/07acad0b/5/](http://jsfiddle.net/07acad0b/5/)
