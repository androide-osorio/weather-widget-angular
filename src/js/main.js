/**
 * declare angular application
 */
var App = window.App = angular.module('WeatherApp', [
  'ngAnimate',
  'angularMoment',
  'slugifier'
]);

//----------------------------------------------------------------------
// configure API urls and endpoints as global constants in the app.
/**
 * Modify the constant DEFAULT_LOCATION, for changing
 * the location the widget will get the forecast by default.
 * @type {string}
 */
App.constant('DEFAULT_LOCATION', 'Los Angeles, United States');

/**
 * API urls for fetching weather information.
 * DO NOT MODIFY!!!
 *
 * @type {Object}
 */
App.constant('API_ENDPOINTS', {
  url: 'https://query.yahooapis.com',
  query: '/v1/public/yql'
});

/**
 * service for IP based geolocation
 * @type {string}
 */
App.constant('GEO_IP_URL', 'https://freegeoip.net');
