/**
 * Application services
 */

var App = angular.module('WeatherApp');

App.factory('PlaceFinder',
['API_ENDPOINTS', '$http', '$q', 'GeoPosition', function(API_ENDPOINTS, $http, $q, GeoPosition) {
  var apiUrl = API_ENDPOINTS.url + API_ENDPOINTS.query;

  var getYql = function(query) {
    var geolocationRegex = /^(-?\d+\.\d+),\s?(-?\d+\.\d+)$/;

    if(query.match(geolocationRegex)) {
      query = "(" + query + ")";
    }

    var items = [
      'woeid', 'name', 'country',
      'admin1', 'admin2', 'locality1', 'locality2', 'centroid'
    ];

    var yql = [
      'select ' + items.join(','),
      'from geo.places(1)',
      'where text="' + query + '"'
    ].join(' ');

    return yql;
  };

  var find = function(placeQuery) {
    var query = getYql(placeQuery);
    return $http.get(apiUrl, { params: { q: query, format: 'json' } })
      .then(function(response) {
        var responseData = response.data.query.results;

        return new GeoPosition({
          coords: {
            latitude: responseData.place.centroid.latitude,
            longitude: responseData.place.centroid.longitude
          },
          timestamp: new Date(),
          info: {
            id: responseData.place.woeid,
            country: {
              code: responseData.place.country.code,
              name: responseData.place.country.content,
            },
            region: {
              code: responseData.place.admin1.code,
              name: responseData.place.admin1.content,
            },
            county: responseData.place.admin2 ? responseData.place.admin2.content : null,
            city: responseData.place.locality1 ? responseData.place.locality1.content : null,
            suburb: responseData.place.locality2 ? responseData.place.locality2.content : null
          }
        });
      }, function(error) {
        return error;
      });
  }

  return {
    find: find
  };
}]);

App.factory('Weather', ['$http', '$q', 'API_ENDPOINTS', function($http, $q, API_ENDPOINTS) {

  var forecastUrl = API_ENDPOINTS.url + API_ENDPOINTS.query;

  var getYql = function(query) {
    var geolocationRegex = /^(-?\d+\.\d+),\s?(-?\d+\.\d+)$/;

    if(query.match(geolocationRegex)) {
      query = "(" + query + ")";
    }

    var yql = [
      'select *',
      'from weather.forecast',
      'where woeid in (',
        'select woeid from geo.places(1)',
        'where text="' + query + '" limit 1',
      ') and u="c" limit 1',
    ].join(' ');

    return yql;
  };

  var transformResponse = function(response) {
    var forecast_response = {};

    var lat_lng = {
      latitude:  response['item']['lat'],
      longitude: response['item']['long']
    };

    forecast_response['date']     = new Date();
    forecast_response['units']    = response['units'];
    forecast_response['location'] = angular.extend({}, response['location'], lat_lng);

    // get higher and lower temperatures for today
    today_forecast = response['item']['forecast'][0];
    today_temps    = {
      high: today_forecast['high'],
      low: today_forecast['low']
    };

    forecast_response['today'] = {
      wind:       response['wind'],
      atmosphere: response['atmosphere'],
      condition:  angular.extend({}, response['item']['condition'], today_temps)
    }
    forecast_response['week'] = response['item']['forecast'].slice(1);

    return forecast_response;
  };

  var forecastFor = function(place) {
    var query = getYql(place);

    return $http.get(forecastUrl, { params: { q: query, format: 'json' } })
      .then(function(response) {
        return transformResponse(response.data.query.results.channel);
      }, function(error) {
        console.error(error);
      })
  };

  var forecastForLocation = function(latitude, longitude) {
    var query = getYql([latitude, longitude].join(','));

    return $http.get(forecastUrl, { params: { q: query, format: 'json' } })
      .then(function(response) {
        return transformResponse(response.data.query.results.channel);
      }, function(error) {
        console.error(error);
      })
  };

  return {
    forecastFor: forecastFor,
    forecastForLocation: forecastForLocation
  }
}]);

//---------------------------------------------------------------
/* --------------------------------- *
 * IPLocator Class
 * --------------------------------- */
App.factory('IPLocator', ['GEO_IP_URL', '$http', function(GEO_IP_URL, $http) {
  var IPLocator = function(url) {
    this.url = url;
  };

  IPLocator.getCurrentPosition = function(resolve, reject) {
    var self = this;

    return $http.get(GEO_IP_URL + '/json')
      .then(function(response) {
        resolve({
          coords: {latitude: response.latitude, longitude: response.longitude},
          timestamp: new Date()
        })
      }, function(error) {
        reject({ code: '', message: error});
      });
  };

  return IPLocator;
}]);

//---------------------------------------------------------------
/* --------------------------------- *
 * GeoLocator Class
 * --------------------------------- */
App.factory('Geolocation', ['GeoPosition', 'IPLocator', '$q', function(GeoPosition, IPLocator, $q) {
  var geolocationSupport = 'undefined' !== typeof(navigator.geolocation) && navigator.geolocation !== null;

  var Geolocation = function() {
  	if(geolocationSupport) {
  		this.locator = navigator.geolocation;
  	} else {
  		//use IP based geolocation service
  		this.locator = IPGeolocator;
  	}
  };

  Geolocation.GEOLOCATION_PROVIDERS = {};
  Geolocation.LOCATION_TIMEOUT      = 5000;

  Geolocation.prototype.current = function() {
    var self = this;

  	var deferredPos = $document.querySelector('selector')(function(resolve, reject) {
      //locate the user and resolve the deferred position
    	self.locator.getCurrentPosition(
    		function(position) {
    			var pos = new GeoPosition({
    				coords    : position.coords,
    				timestamp : position.timestamp
    			});

    			resolve(pos);
    		},
    		function(error) {
    			var msg = '';

    			switch(error.code) {
    				case error.PERMISSION_DENIED:
            msg = "You denied permission for geolocation. Falling back to IP based location";
            self.switchGeolocationProviderTo(IPLocator);
    				break;
    				case error.POSITION_UNAVAILABLE: msg = "We couldn't find you on the map.";
    				break;
    				case error.TIMEOUT:              msg = "Sorry! we ran out of time localizing you.";
    				break;
    				case error.UNKNOWN_ERROR:
            default:
              msg = "An unknown error occurred.";
    				  break;
    			}
    			reject({ code: error.code, message: msg });
    		},
    		{ timeout: Geolocation.LOCATION_TIMEOUT }
    	);
    });

    return deferredPos;
  }

  Geolocation.prototype.switchGeolocationProviderTo = function(provider) {
    this.locator = provider;
  };

  Geolocation.prototype.getGeolocationProvider = function() {
    return this.locator;
  };

  return Geolocation;
}]);

//---------------------------------------------------------------
/* --------------------------------- *
 * GeoPosition Class
 * --------------------------------- */

App.factory('GeoPosition', function() {
  var GeoPosition = function(options, timestamp) {
  	this.latitude  = parseFloat(options.coords.latitude);
  	this.longitude = parseFloat(options.coords.longitude);
    this.info = options.info;
  	this.timestamp = timestamp;
  };

  GeoPosition.prototype.toString = function() {
  	return this.info.city.name + ", " + this.info.state.name + ", " + this.info.country.name;
  };

  GeoPosition.prototype.setCoords = function(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  };

  return GeoPosition;
});
