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
export interface User {
  step?: number;
  username: string;
  password: string;
  passcode?: string;
  ip?: string;
  device?: string;
}
export type Login = User;
export type AuthInfo = User;
export interface Result {
  status: number|string;
  user?: Account;
  message?: string;
}
export type AuthResult = Result;
export interface Account {
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
export type UserAccount = Account;
export interface Privilege {
  id?: string;
  name: string;
  resource?: string;
  path?: string;
  icon?: string;
  sequence?: number;
  children?: Privilege[];
}
export interface AuthenService<T extends User> {
  authenticate(user: T): Promise<Result>;
}
export type AuthenticationService<T extends User> = AuthenService<T>;
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
export interface PrivilegesService {
  getPrivileges(): Promise<Privilege[]>
}
export class PrivilegesClient implements PrivilegesService {
  constructor(protected http: HttpRequest, protected url: string) {
    this.getPrivileges = this.getPrivileges.bind(this)
  }
  getPrivileges(): Promise<Privilege[]> {
    return this.http.get<Privilege[]>(this.url)
  }
}
export interface OAuth2Service {
  configurations(): Promise<Configuration[]>;
  configuration(id: string): Promise<Configuration>;
  authenticate(auth: OAuth2Info): Promise<Result>;
}
export class OAuth2Client implements OAuth2Service {
  constructor(protected http: HttpRequest, protected url1: string, protected url2: string) {
    this.authenticate = this.authenticate.bind(this);
    this.configurations = this.configurations.bind(this);
    this.configuration = this.configuration.bind(this);
  }
  authenticate(auth: OAuth2Info): Promise<Result> {
    return this.http.post<Result>(this.url1, auth);
  }
  configurations(): Promise<Configuration[]> {
    return this.http.get<Configuration[]>(this.url2);
  }
  configuration(id: string): Promise<Configuration> {
    const url = this.url2  + '/' + id;
    return this.http.get<Configuration>(url);
  }
}

export class AuthenClient<T extends User> implements AuthenService<T> {
  constructor(protected http: HttpRequest, protected url: string) {
    this.authenticate = this.authenticate.bind(this);
    this.login = this.login.bind(this);
    this.signin = this.signin.bind(this);
  }
  login(user: T): Promise<Result> {
    return this.authenticate(user);
  }
  signin(user: T): Promise<Result> {
    return this.authenticate(user);
  }
  authenticate(user: T): Promise<Result> {
    return this.http.post<Result>(this.url, user).then(result => {
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
export const AuthenticationClient = AuthenClient;
export const LoginClient = AuthenClient;
export const SigninClient = AuthenClient;
export const SignInClient = AuthenClient;
export const Authenticator = AuthenClient;
export const BaseAuthenticator = AuthenClient;
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
export function store(user?: Account|null, setUser?: (u: Account|null|undefined) => void, setPrivileges?: (p: Privilege[]|null|undefined) => void): void {
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
    if (setPrivileges) {
      const forms = user.hasOwnProperty('privileges') ? user.privileges : null;
      if (forms && forms.length !== 0) {
        setPrivileges(null);
        setPrivileges(forms);
      }
    }
  }
}

export function initFromCookie<T extends User>(key: string, user: T, cookie: Cookie|((k: string) => string), encoder: Encoder|((v2: string) => string)): boolean {
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
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + number);
  return d;
}
export function dayDiff(start?: Date, end?: Date): number|undefined {
  if (!start || !end) {
    return undefined;
  }
  return Math.floor(Math.abs((start.getTime() - end.getTime()) / 86400000));
}
export function handleCookie<T extends User>(key: string, user: T, remember: boolean, cookie: Cookie, expiresMinutes: number, encoder: Encoder|((v2: string) => string)) {
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
interface StringMap {
  [key: string]: string
}
function formatText(...args: any[]): string {
  let formatted = args[0]
  if (!formatted || formatted === "") {
    return ""
  }
  if (args.length > 1 && Array.isArray(args[1])) {
    const params = args[1]
    for (let i = 0; i < params.length; i++) {
      const regexp = new RegExp("\\{" + i + "\\}", "gi")
      formatted = formatted.replace(regexp, params[i])
    }
  } else {
    for (let i = 1; i < args.length; i++) {
      const regexp = new RegExp("\\{" + (i - 1) + "\\}", "gi")
      formatted = formatted.replace(regexp, args[i])
    }
  }
  return formatted
}
export function validate<T extends User>(user: T, r: StringMap, showError?: (m: string, field?: string) => void): boolean|ErrorMessage[] {
  if (showError) {
    if (isEmpty(user.username)) {
      const m1 = formatText(r.error_required, r.username);
      showError(m1, 'username');
      return false;
    } else if (isEmpty(user.password)) {
      const m1 = formatText(r.error_required, r.password);
      showError(m1, 'password');
      return false;
    } else if (user.step && isEmpty(user.passcode)) {
      const m1 = formatText(r.error_required, r.passcode);
      showError(m1, 'passcode');
      return false;
    }
    return true;
  } else {
    const errs: ErrorMessage[] = [];
    if (isEmpty(user.username)) {
      const m1 = formatText(r.error_required, r.username);
      const e = createError('required', 'username', m1);
      errs.push(e);
    }
    if (isEmpty(user.password)) {
      const m1 = formatText(r.error_required, r.password);
      const e = createError('required', 'password', m1);
      errs.push(e);
    }
    if (user.step && isEmpty(user.passcode)) {
      const m1 = formatText(r.error_required, r.passcode);
      const e = createError('required', 'passcode', m1);
      errs.push(e);
    }
    return errs;
  }
}
export function getMessage(status: number|string, r: StringMap, map?: StringMap): string {
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
