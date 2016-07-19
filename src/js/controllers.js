/**
 * Application Controllers
 * @author Andres Osorio <androideosorio@me.com>
 */
var App = angular.module('WeatherApp');

/**
 * application controller.
 * It provides methods and utilities for controlling general
 * application states and configurations.
 */
App.controller('ApplicationController', function($scope) {
  // boolean to determine if the loading screen is being shown
  $scope.loading = true;

  // respond to the loading screen toggling event
  $scope.$on('loading:toggle', function(event) {
    $scope.loading = !$scope.loading;
  });
});

/**
 * Weather widget Controller.
 * This object controls all the aspects of the weather widget itself,
 * including how it behaves and how it fetches information from the application
 * services.
 */
App.controller('WeatherWidgetController', function($scope, PlaceFinder, Weather, Geolocation, DEFAULT_LOCATION) {
  this.isPopupOen = false;

  /**
   * initializer method.
   * it fetches the weather forecast for the default location
   * @return {void}
   */
  this.init = function() {
    Weather.forecastFor(DEFAULT_LOCATION).then(function(forecast) {
      $scope.forecast = forecast;
      $scope.$emit('loading:toggle');
    });
  };

  /**
   * toggle the place search popup
   * @return {void}
   */
  this.togglePopup = function() {
    this.isPopupOpen = !this.isPopupOpen;
  };

  /**
   * fetch the forecast for a specified latitude and longitude
   * @param  {string} lat  a latitude value
   * @param  {string} long a longitude value
   * @return {void}
   */
  this.getForecast = function(lat, long) {
    var self = this;

    // fetch the forecast for the location, and
    // assign it to the proper variable, for re-rendering
    Weather.forecastForLocation(lat, long)
    .then(function(forecast) {
      $scope.forecast = forecast;
      $scope.$emit('loading:toggle');
    });

    $scope.$emit('loading:toggle');
    this.togglePopup();
  };

  /**
   * finds info about a place from the query inserted by the user
   * @param  {string} placeQuery the query inserted by the user
   * @return {void}
   */
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
  };

  // call the initializer method
  this.init();
});
