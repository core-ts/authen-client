export interface ErrorMessage {
  field: string;
  code: string;
  param?: string|number|Date;
  message?: string;
}
export interface AuthInfo {
  step?: number;
  username: string;
  password: string;
  passcode?: string;
}
export interface AuthResult {
  status: AuthStatus;
  user?: UserAccount;
  message?: string;
}
export interface UserAccount {
  userId?: string;
  username?: string;
  contact?: string;
  displayName?: string;
  passwordExpiredTime?: Date;
  token?: string;
  tokenExpiredTime?: Date;
  newUser?: boolean;
  userType?: string;
  roles?: string[];
  privileges?: Privilege[];
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  gender?: Gender;
  imageUrl?: string;
}
export enum Gender {
  Male = 'M',
  Female = 'F',
  Unknown = 'U',
}
export interface Privilege {
  id?: string;
  name: string;
  resource?: string;
  path?: string;
  icon?: string;
  sequence?: number;
  children?: Privilege[];
}
export enum AuthStatus {
  Success = 0,
  SuccessAndReactivated = 1,
  TwoFactorRequired,
  Fail = 3,
  WrongPassword = 4,
  PasswordExpired = 5,
  AccessTimeLocked = 6,
  Locked = 7,
  Suspended = 8,
  Disabled = 9,
  SystemError = 10,
}

export interface Authenticator<T extends AuthInfo> {
  authenticate(user: T): Promise<AuthResult>;
}

interface Headers {
  [key: string]: any;
}
export interface HttpRequest {
  get<T>(url: string, options?: {headers?: Headers}): Promise<T>;
  delete<T>(url: string, options?: {headers?: Headers}): Promise<T>;
  post<T>(url: string, obj: any, options?: {headers?: Headers}): Promise<T>;
  put<T>(url: string, obj: any, options?: {headers?: Headers}): Promise<T>;
  patch<T>(url: string, obj: any, options?: {headers?: Headers}): Promise<T>;
}

export interface Configuration {
  id: string;
  link: string;
  clientId: string;
  scope: string;
  redirectUri: string;
  accessTokenLink: string;
  clientSecret: string;
}
export interface OAuth2Info {
  id: string;
  code: string;
  redirectUri: string;
  invitationMail?: string;
  link?: boolean;
}
export interface OAuth2Service {
  configurations(): Promise<Configuration[]>;
  configuration(sourceType: string): Promise<Configuration>;
  authenticate(auth: OAuth2Info): Promise<AuthResult>;
}
export class OAuth2WebClient implements OAuth2Service {
  constructor(protected http: HttpRequest, protected url1: string, protected url2: string) {
    this.authenticate = this.authenticate.bind(this);
    this.configurations = this.configurations.bind(this);
    this.configuration = this.configuration.bind(this);
  }
  authenticate(auth: OAuth2Info): Promise<AuthResult> {
    return this.http.post<AuthResult>(this.url1, auth);
  }
  configurations(): Promise<Configuration[]> {
    return this.http.get<Configuration[]>(this.url2);
  }
  configuration(sourceType: string): Promise<Configuration> {
    const url = this.url2  + '/' + sourceType;
    return this.http.get<Configuration>(url);
  }
}

export class AuthenticationWebClient<T extends AuthInfo> implements Authenticator<T> {
  constructor(protected http: HttpRequest, protected url: string) {
    this.authenticate = this.authenticate.bind(this);
  }
  async authenticate(user: T): Promise<AuthResult> {
    const result = await this.http.post<AuthResult>(this.url, user);
    const obj = result.user;
    if (obj) {
      try {
        if (obj.passwordExpiredTime) {
          obj.passwordExpiredTime = new Date(obj.passwordExpiredTime);
        }
        if (obj.tokenExpiredTime) {
          obj.tokenExpiredTime = new Date(obj.tokenExpiredTime);
        }
      } catch (err) {}
    }
    return result;
  }
}

export interface UserStorage {
  setUser(user: UserAccount): void;
}
export interface FormsStorage {
  setForms(privileges: Privilege[]): void;
}

export interface Cookie {
  set(key: string, data: string, expires: number|Date): void;
  get(key: string): string;
  delete(key: string): void;
}
export interface ResourceService {
  resource(): any;
  value(key: string, param?: any): string;
  format(...args: any[]): string;
}
export interface Encoder {
  encode(v: string): string;
  decode(v: string): string;
}
export function isEmpty(str: string): boolean {
  return (!str || str === '');
}
export function store(user: UserAccount, userStorage: UserStorage, formsStorage: FormsStorage): void {
  if (!user) {
    userStorage.setUser(null);
    formsStorage.setForms(null);
  } else {
    userStorage.setUser(user);
    const forms = user.hasOwnProperty('privileges') ? user.privileges : null;
    if (forms !== null && forms.length !== 0) {
      formsStorage.setForms(null);
      formsStorage.setForms(forms);
    }
  }
}

export function initFromCookie<T extends AuthInfo>(key: string, user: T, cookie: Cookie, encoder: Encoder): boolean {
  const str = cookie.get(key);
  if (str && str.length > 0) {
    try {
      const tmp: any = JSON.parse(encoder.decode(str));
      user.username = tmp.username;
      user.password = tmp.password;
      if (!tmp.remember) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      return true;
    }
  }
  return true;
}
export function addMinutes(date: Date, number: number): Date {
  const newDate = new Date(date);
  newDate.setMinutes(newDate.getMinutes() + number);
  return newDate;
}
export function dayDiff(start: Date, end: Date): number {
  if (!start || !end) {
    return null;
  }
  return Math.floor(Math.abs((start.getTime() - end.getTime()) / 86400000));
}
export function handleCookie<T extends AuthInfo>(key: string, user: T, remember: boolean, cookie: Cookie, expiresMinutes: number, encoder: Encoder) {
  if (remember === true) {
    const data: any = {
      username: user.username,
      password: user.password,
      remember
    };
    const expiredDate = addMinutes(new Date(), expiresMinutes);
    const v = encoder.encode(JSON.stringify(data));
    cookie.set(key, v, expiredDate);
  } else {
    cookie.delete(key);
  }
}
export function createError(code: string, field: string, message: string): ErrorMessage {
  return { code, field, message };
}
export function validate<T extends AuthInfo>(user: T, r: ResourceService, showError?: (m: string, field?: string) => void): boolean|ErrorMessage[] {
  if (showError) {
    if (isEmpty(user.username)) {
      const msg = r.format(r.value('error_required'), r.value('username'));
      showError(msg, 'username');
      return false;
    } else if (isEmpty(user.password)) {
      const msg = r.format(r.value('error_required'), r.value('password'));
      showError(msg, 'password');
      return false;
    } else if (user.step && isEmpty(user.passcode)) {
      const msg = r.format(r.value('error_required'), r.value('passcode'));
      showError(msg, 'passcode');
      return false;
    }
    return true;
  } else {
    const errs: ErrorMessage[] = [];
    if (isEmpty(user.username)) {
      const msg = r.format(r.value('error_required'), r.value('username'));
      const e = createError('required', 'username', msg);
      errs.push(e);
    }
    if (isEmpty(user.password)) {
      const msg = r.format(r.value('error_required'), r.value('password'));
      const e = createError('required', 'password', msg);
      errs.push(e);
    }
    if (user.step && isEmpty(user.passcode)) {
      const msg = r.format(r.value('error_required'), r.value('passcode'));
      const e = createError('required', 'passcode', msg);
      errs.push(e);
    }
    return errs;
  }
}

export function getMessage(status: AuthStatus, r: ResourceService): string {
  switch (status) {
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

export interface Message {
  message: string;
  title?: string;
}
export function getErrorMessage(err: any, r: ResourceService): Message {
  const title = r.value('error');
  let msg = r.value('error_internal');
  if (err) {
    const status = err.status;
    if (status === 500) {
      msg = r.value('error_internal');
    } else if (status === 503) {
      msg = r.value('error_service_unavailable');
    }
  }
  const m: Message = {
    title,
    message: msg
  };
  return m;
}
