export interface Status {
  fail?: number|string;
  success?: number|string;
  success_and_reactivated?: number|string;
  password_expired?: number|string;
  two_factor_required?: number|string;
  wrong_password?: number|string;
  locked?: number|string;
  suspended?: number|string;
  disabled?: number|string;
  error?: number|string;
}
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
  ip?: string;
  device?: string;
}
export interface AuthResult {
  status: number|string;
  user?: UserAccount;
  message?: string;
}
export interface UserAccount {
  id?: string;
  username?: string;
  contact?: string;
  email?: string;
  phone?: string;
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
  gender?: string;
  imageURL?: string;
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
export interface Authenticator<T extends AuthInfo> {
  authenticate(user: T): Promise<AuthResult>;
}
interface Headers {
  [key: string]: any;
}
export interface HttpRequest {
  get<T>(url: string, options?: {headers?: Headers}): Promise<T>;
  post<T>(url: string, obj: any, options?: {headers?: Headers}): Promise<T>;
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
  configuration(id: string): Promise<Configuration>;
  authenticate(auth: OAuth2Info): Promise<AuthResult>;
}
export class OAuth2Client implements OAuth2Service {
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
  configuration(id: string): Promise<Configuration> {
    const url = this.url2  + '/' + id;
    return this.http.get<Configuration>(url);
  }
}

export class AuthenticationClient<T extends AuthInfo> implements Authenticator<T> {
  constructor(protected http: HttpRequest, protected url: string) {
    this.authenticate = this.authenticate.bind(this);
  }
  authenticate(user: T): Promise<AuthResult> {
    return this.http.post<AuthResult>(this.url, user).then(result => {
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
    });
  }
}

export interface Cookie {
  set(key: string, data: string, expires: number|Date): void;
  get(key: string): string;
  delete(key: string): void;
}
export interface ResourceService {
  value(key: string, param?: any): string;
  format(f: string, ...args: any[]): string;
}
export interface Encoder {
  encode(v: string): string;
  decode(v: string): string;
}
export function isEmpty(str?: string): boolean {
  return (!str || str === '');
}
export function store(user?: UserAccount|null, setUser?: (u: UserAccount|null|undefined) => void, setPrivileges?: (p: Privilege[]|null|undefined) => void): void {
  if (!user) {
    if (setUser) {
      setUser(null);
    }
    if (setPrivileges) {
      setPrivileges(null);
    }
  } else {
    if (setUser) {
      setUser(user);
    }
    const forms = user.hasOwnProperty('privileges') ? user.privileges : null;
    if (forms && forms.length !== 0 && setPrivileges) {
      setPrivileges(null);
      setPrivileges(forms);
    }
  }
}

export function initFromCookie<T extends AuthInfo>(key: string, user: T, cookie: Cookie|((k: string) => string), encoder: Encoder|((v2: string) => string)): boolean {
  let str: string;
  if (typeof cookie === 'function') {
    str = cookie(key);
  } else {
    str = cookie.get(key);
  }
  if (str && str.length > 0) {
    try {
      let s2: string|undefined;
      if (typeof encoder === 'function') {
        s2 = encoder(str);
      } else {
        encoder.decode(str);
      }
      if (s2) {
        const tmp: any = JSON.parse(s2);
        user.username = tmp.username;
        user.password = tmp.password;
        if (!tmp.remember) {
          return false;
        } else {
          return true;
        }
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
export function dayDiff(start?: Date, end?: Date): number|undefined {
  if (!start || !end) {
    return undefined;
  }
  return Math.floor(Math.abs((start.getTime() - end.getTime()) / 86400000));
}
export function handleCookie<T extends AuthInfo>(key: string, user: T, remember: boolean, cookie: Cookie, expiresMinutes: number, encoder: Encoder|((v2: string) => string)) {
  if (remember === true) {
    const data: any = {
      username: user.username,
      password: user.password,
      remember
    };
    const expiredDate = addMinutes(new Date(), expiresMinutes);
    let v: string;
    if (typeof encoder === 'function') {
      v = encoder(JSON.stringify(data));
    } else {
      v = encoder.encode(JSON.stringify(data));
    }
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
      const m1 = r.format(r.value('error_required'), r.value('username'));
      showError(m1, 'username');
      return false;
    } else if (isEmpty(user.password)) {
      const m1 = r.format(r.value('error_required'), r.value('password'));
      showError(m1, 'password');
      return false;
    } else if (user.step && isEmpty(user.passcode)) {
      const m1 = r.format(r.value('error_required'), r.value('passcode'));
      showError(m1, 'passcode');
      return false;
    }
    return true;
  } else {
    const errs: ErrorMessage[] = [];
    if (isEmpty(user.username)) {
      const m1 = r.format(r.value('error_required'), r.value('username'));
      const e = createError('required', 'username', m1);
      errs.push(e);
    }
    if (isEmpty(user.password)) {
      const m1 = r.format(r.value('error_required'), r.value('password'));
      const e = createError('required', 'password', m1);
      errs.push(e);
    }
    if (user.step && isEmpty(user.passcode)) {
      const m1 = r.format(r.value('error_required'), r.value('passcode'));
      const e = createError('required', 'passcode', m1);
      errs.push(e);
    }
    return errs;
  }
}
export interface MessageMap {
  [key: string]: string;
}
export function getMessage(status: number|string, r: MessageMap, map?: MessageMap): string {
  if (!map) {
    return r['fail_authentication'];
  }
  const k = '' + status;
  const g = map[k];
  if (g) {
    const v = r[g];
    if (v) {
      return v;
    }
  }
  return r['fail_authentication'];
}
