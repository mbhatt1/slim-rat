var Victim = function(socket, ip, port, country, manf, model, release) {
  this.socket = socket;
  this.ip = ip;
  this.port = port;
  this.country = country;
  this.manf = manf;
  this.model = model;
  this.release = release;
};

class Victims {
  constructor() {
    this.victimsList = {};
    this.instance = this;
  }

  addVictim(socket, ip, port, country, manf, model, release, id) {
    var victim = new Victim(socket, ip, port, country, manf, model, release);
    this.victimsList[id] = victim;
  }

  getVictim(id) {
    if (this.victimsList[id] != null) {
      return this.victimsList[id];
    }
    return -1;
  }

  rmVictim(id) {
    delete this.victimsList[id];
  }

  getVictimsList() {
    return this.victimsList;
  }
}

module.exports = new Victims();
