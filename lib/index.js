"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PrivilegesClient = (function () {
  function PrivilegesClient(http, url) {
    this.http = http;
    this.url = url;
    this.getPrivileges = this.getPrivileges.bind(this);
  }
  PrivilegesClient.prototype.getPrivileges = function () {
    return this.http.get(this.url);
  };
  return PrivilegesClient;
}());
exports.PrivilegesClient = PrivilegesClient;
var OAuth2Client = (function () {
  function OAuth2Client(http, url1, url2) {
    this.http = http;
    this.url1 = url1;
    this.url2 = url2;
    this.authenticate = this.authenticate.bind(this);
    this.configurations = this.configurations.bind(this);
    this.configuration = this.configuration.bind(this);
  }
  OAuth2Client.prototype.authenticate = function (auth) {
    return this.http.post(this.url1, auth);
  };
  OAuth2Client.prototype.configurations = function () {
    return this.http.get(this.url2);
  };
  OAuth2Client.prototype.configuration = function (id) {
    var url = this.url2 + '/' + id;
    return this.http.get(url);
  };
  return OAuth2Client;
}());
exports.OAuth2Client = OAuth2Client;
var AuthenClient = (function () {
  function AuthenClient(http, url) {
    this.http = http;
    this.url = url;
    this.authenticate = this.authenticate.bind(this);
    this.login = this.login.bind(this);
    this.signin = this.signin.bind(this);
  }
  AuthenClient.prototype.login = function (user) {
    return this.authenticate(user);
  };
  AuthenClient.prototype.signin = function (user) {
    return this.authenticate(user);
  };
  AuthenClient.prototype.authenticate = function (user) {
    return this.http.post(this.url, user).then(function (result) {
      var obj = result.user;
      if (obj) {
        try {
          if (obj.passwordExpiredTime) {
            obj.passwordExpiredTime = new Date(obj.passwordExpiredTime);
          }
          if (obj.tokenExpiredTime) {
            obj.tokenExpiredTime = new Date(obj.tokenExpiredTime);
          }
        }
        catch (err) { }
      }
      return result;
    });
  };
  return AuthenClient;
}());
exports.AuthenClient = AuthenClient;
exports.AuthenticationClient = AuthenClient;
exports.LoginClient = AuthenClient;
exports.SigninClient = AuthenClient;
exports.SignInClient = AuthenClient;
exports.Authenticator = AuthenClient;
exports.BaseAuthenticator = AuthenClient;
function isEmpty(str) {
  return (!str || str === '');
}
exports.isEmpty = isEmpty;
function store(user, setUser, setPrivileges) {
  if (!user) {
    if (setUser) {
      setUser(null);
    }
    if (setPrivileges) {
      setPrivileges(null);
    }
  }
  else {
    if (setUser) {
      setUser(user);
    }
    if (setPrivileges) {
      var forms = user.hasOwnProperty('privileges') ? user.privileges : null;
      if (forms && forms.length !== 0) {
        setPrivileges(null);
        setPrivileges(forms);
      }
    }
  }
}
exports.store = store;
function initFromCookie(key, user, cookie, encoder) {
  var str;
  if (typeof cookie === 'function') {
    str = cookie(key);
  }
  else {
    str = cookie.get(key);
  }
  if (str && str.length > 0) {
    try {
      var s2 = void 0;
      if (typeof encoder === 'function') {
        s2 = encoder(str);
      }
      else {
        encoder.decode(str);
      }
      if (s2) {
        var tmp = JSON.parse(s2);
        user.username = tmp.username;
        user.password = tmp.password;
        if (!tmp.remember) {
          return false;
        }
        else {
          return true;
        }
      }
    }
    catch (error) {
      return true;
    }
  }
  return true;
}
exports.initFromCookie = initFromCookie;
function addMinutes(date, number) {
  var d = new Date(date);
  d.setMinutes(d.getMinutes() + number);
  return d;
}
exports.addMinutes = addMinutes;
function dayDiff(start, end) {
  if (!start || !end) {
    return undefined;
  }
  return Math.floor(Math.abs((start.getTime() - end.getTime()) / 86400000));
}
exports.dayDiff = dayDiff;
function handleCookie(key, user, remember, cookie, expiresMinutes, encoder) {
  if (remember === true) {
    var data = {
      username: user.username,
      password: user.password,
      remember: remember
    };
    var expiredDate = addMinutes(new Date(), expiresMinutes);
    var v = void 0;
    if (typeof encoder === 'function') {
      v = encoder(JSON.stringify(data));
    }
    else {
      v = encoder.encode(JSON.stringify(data));
    }
    cookie.set(key, v, expiredDate);
  }
  else {
    cookie.delete(key);
  }
}
exports.handleCookie = handleCookie;
function createError(code, field, message) {
  return { code: code, field: field, message: message };
}
exports.createError = createError;
function validate(user, r, showError) {
  if (showError) {
    if (isEmpty(user.username)) {
      var m1 = r.format(r.value('error_required'), r.value('username'));
      showError(m1, 'username');
      return false;
    }
    else if (isEmpty(user.password)) {
      var m1 = r.format(r.value('error_required'), r.value('password'));
      showError(m1, 'password');
      return false;
    }
    else if (user.step && isEmpty(user.passcode)) {
      var m1 = r.format(r.value('error_required'), r.value('passcode'));
      showError(m1, 'passcode');
      return false;
    }
    return true;
  }
  else {
    var errs = [];
    if (isEmpty(user.username)) {
      var m1 = r.format(r.value('error_required'), r.value('username'));
      var e = createError('required', 'username', m1);
      errs.push(e);
    }
    if (isEmpty(user.password)) {
      var m1 = r.format(r.value('error_required'), r.value('password'));
      var e = createError('required', 'password', m1);
      errs.push(e);
    }
    if (user.step && isEmpty(user.passcode)) {
      var m1 = r.format(r.value('error_required'), r.value('passcode'));
      var e = createError('required', 'passcode', m1);
      errs.push(e);
    }
    return errs;
  }
}
exports.validate = validate;
function getMessage(status, r, map) {
  if (!map) {
    return r['fail_authentication'];
  }
  var k = '' + status;
  var g = map[k];
  if (g) {
    var v = r[g];
    if (v) {
      return v;
    }
  }
  return r['fail_authentication'];
}
exports.getMessage = getMessage;
