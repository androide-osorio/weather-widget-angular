/**
 * declare angular application
 */
var App = window.App = angular.module('WeatherApp', [
  'angularMoment',
  'slugifier'
]);

// configure API urls and endpoints as global constants in the app
App.constant('DEFAULT_LOCATION', 'Los Angeles, United States')
  .constant('API_ENDPOINTS', {
    url: 'https://query.yahooapis.com',
    query: '/v1/public/yql',
    latlong: '/forecast/location',
    location: '/forecast/country/:country/city/:city',
    places: '/places'
  })
  .constant('GEO_IP_URL', 'https://freegeoip.net');
