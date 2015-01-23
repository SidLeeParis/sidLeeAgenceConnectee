var DEBUG_MODE_ON = true;
var initialized_ = false;
var initializing_ = true;

if (!DEBUG_MODE_ON) {
  console = console || {};
  console.log = function () {};
}

(function (document) {
  'use strict';
  /*jslint nomen: true */
  /*global _, PolymerExpressions, SidLeeClient */

  var dashboard_;
  var client_;


  function computeData(sensor) {
    if (! initialized_) {
      if (! initializing_) {
        console.log('reconnecting...');
        initializing_ = true;
        client_.today().exec(initData);
      }
      return;
    }
    console.log(sensor);

    var sensorEl = (sensor._id === 'blue') || (sensor._id === 'red') ? dashboard_.$.baby : dashboard_.$[sensor._id];
    if (sensorEl && sensorEl.tick) {
      sensorEl.tick(sensor);
    }
  }

  function initData(data) {
    document.sensorData = data;
    console.log(data);
    _.each(data, function(sensor) {
      var sensorEl = (sensor._id === 'blue') || (sensor._id === 'red') ? dashboard_.$.baby : dashboard_.$[sensor._id];
      if (sensorEl && sensorEl.initSensor) {
        sensorEl.initSensor(sensor);
      } else {
        console.log('no element update for', sensor);
      }
    });

    initialized_ = true;
    initializing_ = false;
  }

  function removeLoader() {
    setTimeout(function() {
      dashboard_.$.loader.classList.remove('loading');
      dashboard_.$.fridgeDegrees.fitCanvas();
      dashboard_.$.sound.fitCanvas();
    }, 300);
    setTimeout(function() {
      dashboard_.$.loader.remove();
    }, 1000);
  }

  document.addEventListener('polymer-ready', function () {
    console.log('Polymer is ready to rock!');

    // Perform some behaviour
    dashboard_ = document.querySelector('#dashboard');
    PolymerExpressions.prototype.plus = function(value, i) {
      return value + i;
    };

    window.onresize = _.debounce(function() {
      dashboard_.$.fridgeDegrees.fitCanvas();
      dashboard_.$.sound.fitCanvas();
    }, 300);

    document.addEventListener('switch-event', function(event) {
      client_.postEvent({
        name:'lightswitch',
        value: event.detail.value,
        unit:'click',
        token:'b3f2ad85-a221-6fbf-19e2-9bcca6994c44'
      }, function(err) {
        if(err) {
          console.log(err);
          dashboard_.$.lightswitch.failFire(event.detail.value);
        }
      });
    });

    client_ = new SidLeeClient('https://sidlee.herokuapp.com/', computeData);
    client_.today().exec(function(data){
      initData(data);
      removeLoader();
    });

    client_.socket.on('disconnect', function() {
      console.log('disconnected !!!');
      initialized_ = false;
    });
  });

})(wrap(document));
