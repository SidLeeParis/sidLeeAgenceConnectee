var DEBUG_MODE_ON = true;

if (!DEBUG_MODE_ON) {
  console = console || {};
  console.log = function () {};
}

(function (document) {
  'use strict';

  var dashboard_;

  window.addEventListener('polymer-ready', function () {
    console.log('Polymer is ready to rock!');

    dashboard_ = document.querySelector('#dashboard');
    window.onresize = dashboard_.fit;

  });

})(wrap(document));
