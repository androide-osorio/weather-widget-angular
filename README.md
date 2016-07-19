Weather Widget
====

A Mini weather widget application developed in Angular 1.5.x that can fetch the current weather forecast in the user's current location (working with both IP location and HTML5 geolocation).

Features
---
* Fully Responsive
* Geolocation support built in, with fallback to IP based location
* Ability to change the widget's forecast location through the UI
* Fully developed API for fetching information about the current weather and week forecasts.
* Integration with Yahoo! Weather API.

System Requirements
---
Make sure you have the following software installed on your server:

| Software    	| Version   	| Installation                               	|
|-------------	|-----------	|--------------------------------------------	|
| NodeJS        	| >= 5.0.0  	| Specific for the OS. More information [here](https://nodejs.org) 	|
| gulp 	| >= 3.8.x 	| `npm install gulp-cli`                         	|
| bower 	| >= 1.7.x    	| `npm install bower`                         	|

Frameworks and APIs used
---
* [AngularJS](http://www.angularjs.org/) framework for JavaScript.
* [Yahoo Weather API](https://developer.yahoo.com/weather/) for weather forecasts.
* [freegeoip.net](http://freegeoip.net/?q=181.55.146.41) for IP-Based geolocation.
* [SASS](http://sass-lang.com/) for CSS preprocessing.
* [gulp](https://gulpjs.com/) as the asset pipeline.

Setting up the project
---
Clone this repository by Running:
```bash
$ git clone https://github.com/androide-osorio/weather-widget-angular.git
```

Next, `cd` into the project's folder that you just cloned and install node packages by running
```bash
# install node packages
$ npm install

# install bower packages
$ bower install
```

To run a local development server where you can see the project up and running, use the command:
```bash
$ npm start

# or alternatively
$ gulp
```
This will open a test server in `http://localhost:8080`.

Configuring the application
---
Currently, there is only one setting that can be configured: the default location the weather widget will load.

To configure it, open the file `src/js/main.js` file and look for the following line:
```javascript
// replace the value in quotes to change the location
App.constant('DEFAULT_LOCATION', 'REPLACE ME FOR A NEW LOCATION');
```

Building the application for production
---
To build the application and generate the final files that can be uploaded to production, simply run the command:
```bash
$ npm run build

# or alternatively
$ gulp build
```

This will generate a set of HTML, CSS and Javascript files in the `/dist` folder, all of them minified and optimized for production.

Deploying to Production
---
To deploy to a production server, all you have to do is upload the compiled files (generated in the previous section) and upload them either via FTP or any other medium you have for connecting to your server.

Authors
---
* Graphic and UX design by Hernando Botero.
* Development by Andrés Osorio.
