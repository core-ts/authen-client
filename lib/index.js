"use strict";
var __awaiter=(this && this.__awaiter) || function(thisArg, _arguments, P, generator){
  function adopt(value){ return value instanceof P ? value : new P(function(resolve){ resolve(value); }); }
  return new (P || (P=Promise))(function(resolve, reject){
    function fulfilled(value){ try { step(generator.next(value)); } catch (e){ reject(e); } }
    function rejected(value){ try { step(generator["throw"](value)); } catch (e){ reject(e); } }
    function step(result){ result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator=generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator=(this && this.__generator) || function(thisArg, body){
  var _={ label: 0, sent: function(){ if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
  return g={ next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol==="function" && (g[Symbol.iterator]=function(){ return this; }), g;
  function verb(n){ return function(v){ return step([n, v]); }; }
  function step(op){
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f=1, y && (t=op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t=y["return"]) && t.call(y), 0) : y.next) && !(t=t.call(y, op[1])).done) return t;
      if (y=0, t) op=[op[0] & 2, t.value];
      switch (op[0]){
        case 0: case 1: t=op; break;
        case 4: _.label++; return { value: op[1], done: false };
        case 5: _.label++; y=op[1]; op=[0]; continue;
        case 7: op=_.ops.pop(); _.trys.pop(); continue;
        default:
          if (!(t=_.trys, t=t.length > 0 && t[t.length - 1]) && (op[0]===6 || op[0]===2)){ _=0; continue; }
          if (op[0]===3 && (!t || (op[1] > t[0] && op[1] < t[3]))){ _.label=op[1]; break; }
          if (op[0]===6 && _.label < t[1]){ _.label=t[1]; t=op; break; }
          if (t && _.label < t[2]){ _.label=t[2]; _.ops.push(op); break; }
          if (t[2]) _.ops.pop();
          _.trys.pop(); continue;
      }
      op=body.call(thisArg, _);
    } catch (e){ op=[6, e]; y=0; } finally { f=t=0; }
    if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Gender;
(function(Gender){
  Gender["Male"]="M";
  Gender["Female"]="F";
  Gender["Unknown"]="U";
})(Gender=exports.Gender || (exports.Gender={}));
var AuthStatus;
(function(AuthStatus){
  AuthStatus[AuthStatus["Success"]=0]="Success";
  AuthStatus[AuthStatus["SuccessAndReactivated"]=1]="SuccessAndReactivated";
  AuthStatus[AuthStatus["TwoFactorRequired"]=2]="TwoFactorRequired";
  AuthStatus[AuthStatus["Fail"]=3]="Fail";
  AuthStatus[AuthStatus["WrongPassword"]=4]="WrongPassword";
  AuthStatus[AuthStatus["PasswordExpired"]=5]="PasswordExpired";
  AuthStatus[AuthStatus["AccessTimeLocked"]=6]="AccessTimeLocked";
  AuthStatus[AuthStatus["Locked"]=7]="Locked";
  AuthStatus[AuthStatus["Suspended"]=8]="Suspended";
  AuthStatus[AuthStatus["Disabled"]=9]="Disabled";
  AuthStatus[AuthStatus["SystemError"]=10]="SystemError";
})(AuthStatus=exports.AuthStatus || (exports.AuthStatus={}));
var OAuth2WebClient=(function(){
  function OAuth2WebClient(http, url1, url2){
    this.http=http;
    this.url1=url1;
    this.url2=url2;
    this.authenticate=this.authenticate.bind(this);
    this.configurations=this.configurations.bind(this);
    this.configuration=this.configuration.bind(this);
  }
  OAuth2WebClient.prototype.authenticate=function(auth){
    return this.http.post(this.url1, auth);
  };
  OAuth2WebClient.prototype.configurations=function(){
    return this.http.get(this.url2);
  };
  OAuth2WebClient.prototype.configuration=function(sourceType){
    var url=this.url2 + '/' + sourceType;
    return this.http.get(url);
  };
  return OAuth2WebClient;
}());
exports.OAuth2WebClient=OAuth2WebClient;
var AuthenticationWebClient=(function(){
  function AuthenticationWebClient(http, url){
    this.http=http;
    this.url=url;
    this.authenticate=this.authenticate.bind(this);
  }
  AuthenticationWebClient.prototype.authenticate=function(user){
    return __awaiter(this, void 0, void 0, function(){
      var result, obj;
      return __generator(this, function(_a){
        switch (_a.label){
          case 0: return [4, this.http.post(this.url, user)];
          case 1:
            result=_a.sent();
            obj=result.user;
            if (obj){
              try {
                if (obj.passwordExpiredTime){
                  obj.passwordExpiredTime=new Date(obj.passwordExpiredTime);
                }
                if (obj.tokenExpiredTime){
                  obj.tokenExpiredTime=new Date(obj.tokenExpiredTime);
                }
              }
              catch (err){ }
            }
            return [2, result];
        }
      });
    });
  };
  return AuthenticationWebClient;
}());
exports.AuthenticationWebClient=AuthenticationWebClient;
function isEmpty(str){
  return (!str || str==='');
}
exports.isEmpty=isEmpty;
function store(user, userStorage, formsStorage){
  if (!user){
    userStorage.setUser(null);
    formsStorage.setForms(null);
  }
  else {
    userStorage.setUser(user);
    var forms=user.hasOwnProperty('privileges') ? user.privileges : null;
    if (forms !== null && forms.length !== 0){
      formsStorage.setForms(null);
      formsStorage.setForms(forms);
    }
  }
}
exports.store=store;
function initFromCookie(key, user, cookie, encoder){
  var str=cookie.get(key);
  if (str && str.length > 0){
    try {
      var tmp=JSON.parse(encoder.decode(str));
      user.username=tmp.username;
      user.password=tmp.password;
      if (!tmp.remember){
        return false;
      }
      else {
        return true;
      }
    }
    catch (error){
      return true;
    }
  }
  return true;
}
exports.initFromCookie=initFromCookie;
function addMinutes(date, number){
  var newDate=new Date(date);
  newDate.setMinutes(newDate.getMinutes() + number);
  return newDate;
}
exports.addMinutes=addMinutes;
function dayDiff(start, end){
  if (!start || !end){
    return null;
  }
  return Math.floor(Math.abs((start.getTime() - end.getTime()) / 86400000));
}
exports.dayDiff=dayDiff;
function handleCookie(key, user, remember, cookie, expiresMinutes, encoder){
  if (remember===true){
    var data={
      username: user.username,
      password: user.password,
      remember: remember
    };
    var expiredDate=addMinutes(new Date(), expiresMinutes);
    var v=encoder.encode(JSON.stringify(data));
    cookie.set(key, v, expiredDate);
  }
  else {
    cookie.delete(key);
  }
}
exports.handleCookie=handleCookie;
function createError(code, field, message){
  return { code: code, field: field, message: message };
}
exports.createError=createError;
function validate(user, r, showError){
  if (showError){
    if (isEmpty(user.username)){
      var msg=r.format(r.value('error_required'), r.value('username'));
      showError(msg, 'username');
      return false;
    }
    else if (isEmpty(user.password)){
      var msg=r.format(r.value('error_required'), r.value('password'));
      showError(msg, 'password');
      return false;
    }
    else if (user.step && isEmpty(user.passcode)){
      var msg=r.format(r.value('error_required'), r.value('passcode'));
      showError(msg, 'passcode');
      return false;
    }
    return true;
  }
  else {
    var errs=[];
    if (isEmpty(user.username)){
      var msg=r.format(r.value('error_required'), r.value('username'));
      var e=createError('required', 'username', msg);
      errs.push(e);
    }
    if (isEmpty(user.password)){
      var msg=r.format(r.value('error_required'), r.value('password'));
      var e=createError('required', 'password', msg);
      errs.push(e);
    }
    if (user.step && isEmpty(user.passcode)){
      var msg=r.format(r.value('error_required'), r.value('passcode'));
      var e=createError('required', 'passcode', msg);
      errs.push(e);
    }
    return errs;
  }
}
exports.validate=validate;
function getMessage(status, r){
  switch (status){
    case AuthStatus.Fail:
      return r.value('fail_authentication');
    case AuthStatus.WrongPassword:
      return r.value('fail_wrong_password');
    case AuthStatus.AccessTimeLocked:
      return r.value('fail_access_time_locked');
    case AuthStatus.PasswordExpired:
      return r.value('fail_expired_password');
    case AuthStatus.Suspended:
      return r.value('fail_suspended_account');
    case AuthStatus.Locked:
      return r.value('fail_locked_account');
    case AuthStatus.Disabled:
      return r.value('fail_disabled_account');
    default:
      return r.value('fail_authentication');
  }
}
exports.getMessage=getMessage;
function getErrorMessage(err, r){
  var title=r.value('error');
  var msg=r.value('error_internal');
  if (err){
    var status=err.status;
    if (status===500){
      msg=r.value('error_internal');
    }
    else if (status===503){
      msg=r.value('error_service_unavailable');
    }
  }
  var m={
    title: title,
    message: msg
  };
  return m;
}
exports.getErrorMessage=getErrorMessage;
