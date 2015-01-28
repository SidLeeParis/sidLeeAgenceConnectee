var DEBUG_MODE_ON = true;

if (!DEBUG_MODE_ON) {
  console = console || {};
  console.log = function () {};
}

(function (document) {
  'use strict';

  var dashboard_;
  var ua = navigator.userAgent.toLowerCase();
  var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");

  if (isAndroid) {
    document.body.classList.remove('not-android');
  }

  window.addEventListener('polymer-ready', function () {
    console.log('Polymer is ready to rock!');

    dashboard_ = document.querySelector('#dashboard');
    window.onresize = dashboard_.adjustCanvases;

  });

})(wrap(document));
