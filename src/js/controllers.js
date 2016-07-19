
var App = angular.module('WeatherApp');

App.controller('WeatherWidgetController',
['$scope', 'PlaceFinder', 'Weather', 'Geolocation', 'DEFAULT_LOCATION',
function($scope, PlaceFinder, Weather, Geolocation, DEFAULT_LOCATION) {
  this.isPopupOen = false;

  this.init = function() {
    Weather.forecastFor(DEFAULT_LOCATION).then(function(forecast) {
      $scope.forecast = forecast;
      console.info(forecast);
    });
  };

  this.togglePopup = function() {
    this.isPopupOpen = !this.isPopupOpen
  };

  this.getForecast = function(lat, long) {
    var self = this;
    Weather.forecast(lat, long).then(function(response) {
      $scope.forecast = response.data;
      self.togglePopup();
    });
  }

  this.findPlace = function(placeQuery) {
    var self = this;
    PlaceFinder.find(placeQuery)
      .then(function(positions) {
        if(positions instanceof Array) {
          $scope.places = positions;
        } else {
          $scope.places = [positions];
        }
      }, function(error) {
        console.error(error);
      });
  }
  this.init();

}]);
