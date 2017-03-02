/**
 * Application services
 * @author Andres Osorio <androideosorio@me.com>
 */

var App = angular.module('WeatherApp');

/**
 * Utility Factory for constructing YQL queries.
 */
App.factory('YQL', function(GeoPosition) {
  /**
   * constructs a YQL query from the specified query type supported
   * by this application, with the specified search term and fields
   * to fetch from the Yahoo API.
   *
   * Supported queries:
   * - location: for querying information about a specific place.
   * - weather: for querying the weather forecast of a specified location.
   *
   * If a value different from this supported queries is provided,
   * an error will be thrown.
   *
   * @param  {string}        type   a string describing a supported query type
   * @param  {string}        query  a search term to filter the API
   * @param  {Array[string]} fields an array of fields to fetch from the yahoo API
   *
   * @return {string}        a fully formed YQL query
   */
  var queryFor = function(type, query, fields, units) {
    if(GeoPosition.validate(query)) {
      query = "(" + query + ")";
    }

    switch(type) {
      case 'weather':
        return getWeatherQuery(query, fields, units);
        break;
      case 'location':
        return getLocationQuery(query, fields);
        break;
      default:
        throw new Error('unrecognized query type:' + type);
    }
  };

  /**
   * constructs a valid YQL query for extracting information about a specific place.
   * It can accept queries like:
   *
   * - latitude and longitude
   * - <city>,<state>,<country> string
   * - zipcode
   *
   * @param  {string}        query   a search term that will be used to query the Yahoo! API
   * @param  {Array[string]} fields  an array of fields to fetch from the Yahoo! API
   *
   * @return {string}        a fully formed YQL query for getting info about a location
   */
  var getLocationQuery = function(query, fields) {
    // configure the query to fetch
    // the asked fields or default to
    // the supported (and relevant) ones
    var fields = fields || [
      'woeid', 'name', 'country',
      'admin1', 'admin2', 'locality1', 'locality2', 'centroid'
    ];

    // construct the YQL for querying a place
    var yql = [
      'select ' + fields.join(','),
      'from geo.places(1)',
      'where text="' + query + '"'
    ].join(' ');

    return yql;
  };

  /**
   * constructs a valid YQL query for getting the weather forecast of a specific location
   * on earth. It can accept the same queries as "getPlacesQuery()" function.
   * @param  {string}        query  a search term that will be used to query the Yahoo! API
   * @param  {Array[string]} fields an array of fields to fetch from the Yahoo! API
   *
   * @return {string}        a fully formed YQL query for getting the weather forecast for a location
   */
  var getWeatherQuery = function(query, fields, units) {
    // configure the query to fetch
    // the asked fields or default to
    // the supported (and relevant) ones
    var fields = fields || ['*'];
    units = units || 'c';

    var yql = [
      'select ' + fields.join(','),
      'from weather.forecast',
      'where woeid in (',
        'select woeid from geo.places(1)',
        'where text="' + query + '" limit 1',
      ') and u="' + units + '" limit 1',
    ].join(' ');

    return yql;
  };

  return { queryFor: queryFor };
});

/**
 * PlaceFinder Factory.
 * This is a small service that can communicate to the Yahoo!
 * places API, and get information about a specific place using YQL.
 *
 * PlaceFinder can search by:
 * - a specific latitude and longitude
 * - a specific place by city and country
 * - a specific place by zipcode
 */
App.factory('PlaceFinder', function(API_ENDPOINTS, $http, GeoPosition) {
  // build the API url
  var apiUrl = API_ENDPOINTS.url + API_ENDPOINTS.query;

  /**
   * transform a Yahoo! Places API response
   * into an easier to manage payload object.
   *
   * @param  {Object} response a response from the yahoo! places API
   * @return {Object}          the transformed response
   */
  var transformPlaceResponse = function(response) {
    return {
      coords: {
        latitude: response.place.centroid.latitude,
        longitude: response.place.centroid.longitude
      },
      timestamp: new Date(),
      info: {
        id: response.place.woeid,
        country: {
          code: response.place.country.code,
          name: response.place.country.content,
        },
        region: {
          code: response.place.admin1.code,
          name: response.place.admin1.content,
        },
        county: response.place.admin2 ? response.place.admin2.content : null,
        city: response.place.locality1 ? response.place.locality1.content : null,
        suburb: response.place.locality2 ? response.place.locality2.content : null
      }
    };
  };

  /**
   * Queries the yahoo! Places API to get information
   * about a specific place on earth
   * @param  {string} placeQuery the place to search for.
   *
   * @return {Promise}           a promise that will resolve with the Place info.
   */
  var find = function(placeQuery) {
    var query = YQL.queryFor('location', place),
        params = { params: { q: query, format: 'json' } };

    return $http.get(apiUrl, params)
      .then(function(response) {
        var responseData = response.data.query.results;
        return new GeoPosition(transformPlaceResponse(responseData));
      }, function(error) {
        return error;
      });
  };

  return {
    find: find
  };
});

App.factory('Weather', function($http, API_ENDPOINTS, YQL) {

  var forecastUrl = API_ENDPOINTS.url + API_ENDPOINTS.query;

  /**
   * transform a Yahoo! Places API weather response
   * into an easier to manage payload object.
   *
   * @param  {Object} response a response from the yahoo! places API
   * @return {Object}          the transformed response
   */
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

  /**
   * Query the Yahoo! Weather API for a specific location
   * on earth that can be defined by:
   * - zipcode
   * - city, country
   *
   * @param  {string} place the place from where we want the forecast
   * @return {promise}      a promise that will resolve with the weather forecast
   */
  var forecastFor = function(place, units) {
    var query = YQL.queryFor('weather', place, ['*'], units),
      params = { params: { q: query, format: 'json' } };

    return $http.get(forecastUrl, params)
      .then(function(response) {
        return transformResponse(response.data.query.results.channel);
      }, function(error) {
        console.error(error);
      })
  };

  /**
   * Query the Yahoo! Weather API for a specific location
   * on earth that can be defined by a latitude or longitude
   *
   * @param  {string} place the place from where we want the forecast (as a latitude-longitude pair)
   * @return {promise}      a promise that will resolve with the weather forecast
   */
  var forecastForLocation = function(latitude, longitude, units) {
    var query = YQL.queryFor('weather', [latitude, longitude].join(','), ['*'], units);

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
  };
});

//---------------------------------------------------------------
/* --------------------------------- *
 * IPLocator Class
 * --------------------------------- */
/**
 * This a location provider used by the GeoLocation service.
 * This service provides a way to query the user's current location
 * by using an external IP location service.
 */
App.factory('IPLocator', function(GEO_IP_URL, $http) {
  /**
   * constructor
   */
  var IPLocator = function(url) {
    this.url = GEO_IP_URL;
  };

  /**
   * getCurrentPosition method required by GeoLocation Service
   * it queries the specified IP-based location service to get information
   * about the current user's location.
   *
   * @param  {Function} resolve a function that will be called when the location is resolved
   * @param  {Function} reject  a function that will be called if the IP based service fails
   * @return {void}
   */
  IPLocator.getCurrentPosition = function(resolve, reject) {
    var self = this;

    return $http.get(this.url + '/json')
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
});

//---------------------------------------------------------------
/* --------------------------------- *
 * GeoLocation Service
 * --------------------------------- */
/**
 * this services is a simple wrapper for obtaining a user's current
 * position on earth. It can be configured to use either HTML5
 * geolocation through GPS, or an alternative IP based location.
 */
App.factory('Geolocation', function(GeoPosition, IPLocator, $q) {
  var geolocationSupport = 'undefined' !== typeof(navigator.geolocation) && navigator.geolocation !== null;

  /**
   * constructor.
   * it defined the location provider to use according to what the user's
   * browser has support for.
   * @return {Geolocation}
   */
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

  /**
   * get the user's current position, using the configured location provider
   * @return {Promise} a promise that will resolve with the current position or with an error
   */
  Geolocation.prototype.current = function() {
    var self = this;

  	var deferredPos = $q(function(resolve, reject) {
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

  /**
   * change the geolocation provider to another one that conforms to the contract
   * @param  {Object} provider a location provider object
   * @return {void}
   */
  Geolocation.prototype.switchGeolocationProviderTo = function(provider) {
    this.locator = provider;
  };

  /**
   * get the current geolocation provider instance
   * @return {Object}
   */
  Geolocation.prototype.getGeolocationProvider = function() {
    return this.locator;
  };

  return Geolocation;
});

//---------------------------------------------------------------
/* --------------------------------- *
 * GeoPosition Class
 * --------------------------------- */

App.factory('GeoPosition', function() {
  // regex for validating if a string is a latitude, longitude pair
  var latLngRegex = /^(-?\d+\.\d+),\s?(-?\d+\.\d+)$/;

  var GeoPosition = function(options, timestamp) {
  	this.latitude  = parseFloat(options.coords.latitude);
  	this.longitude = parseFloat(options.coords.longitude);
    this.info = options.info;
  	this.timestamp = timestamp;
  };

  /**
   * returns true if the provided string is a latitude-longitude tuple
   * @param  {string} str a potential latitude-longitude tuple
   * @return {boolean}
   */
  GeoPosition.validate = function(str) {
    return str.match(latLngRegex);
  };

  /**
   * override toString method for easy printing
   * @return {string}
   */
  GeoPosition.prototype.toString = function() {
  	return this.info.city.name + ", " + this.info.state.name + ", " + this.info.country.name;
  };

  /**
   * sets the position's coordinates
   * @param  {number} latitude  a latitude value
   * @param  {number} longitude a longitude value
   * @return {void}
   */
  GeoPosition.prototype.setCoordinates = function(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  };

  return GeoPosition;
});
