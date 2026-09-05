import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { catchError, map, BehaviorSubject, throwError } from "rxjs";
import { jwtDecode } from "jwt-decode";
import { injectApiBaseUrl } from "./api-config";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private URL = injectApiBaseUrl();
  private loggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedIn.asObservable(); // observable for components

  user = new BehaviorSubject<any>(null);

  constructor() {
    this.restoreUser();
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.URL}/users/login`, { email, password }).pipe(
      map((response) => this.startSession(response)),
      catchError(this.handleError)
    );
  }

  loginDemo() {
    return this.http.post<any>(`${this.URL}/users/demo`, {}).pipe(
      map((response) => this.startSession(response)),
      catchError(this.handleError)
    );
  }

  autoLogin() {
    this.restoreUser();
  }

  isAuthenticated(): boolean {
    const currentUser = this.user.value;
    const expirationDate = new Date(currentUser?.expirationDate);

    if (
      !currentUser?._token ||
      Number.isNaN(expirationDate.getTime()) ||
      expirationDate <= new Date()
    ) {
      if (currentUser) {
        this.logout();
      }
      return false;
    }

    return true;
  }

  isDemoMode(): boolean {
    return this.user.value?.isDemo === true;
  }

  getProfile() {
    return this.http.get<any>(`${this.URL}/users/profile`, { headers: this.getAuthHeaders() }).pipe(
      map((response) => {
        const currentUser = this.user.value;
        const updatedUser = {
          ...currentUser,
          ...response.data.user,
          id: response.data.user._id || currentUser?.id,
          _token: currentUser?._token,
          expirationDate: currentUser?.expirationDate,
          loggedIn: true,
        };

        if (currentUser?._token) {
          this.setSession(updatedUser);
        }

        return response.data.user;
      }),
      catchError(this.handleError)
    );
  }

  updateProfile(profileData: FormData) {
    return this.http.patch<any>(`${this.URL}/users/profile`, profileData, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map((response) => {
        const currentUser = this.user.value;
        const updatedUser = {
          ...currentUser,
          ...response.data.user,
          id: response.data.user._id || currentUser?.id,
          _token: currentUser?._token,
          expirationDate: currentUser?.expirationDate,
          loggedIn: true,
        };

        this.setSession(updatedUser);

        return response.data.user;
      }),
      catchError(this.handleError)
    );
  }

// Called in any component
  logout() {
    this.user.next(null);
    this.loggedIn.next(false);

    if (this.isBrowser()) {
      localStorage.removeItem("userData");
    }
  }

  private handleError(error: any) {
    let errorResponse = {
      status: "fail",
      message: "An unknown error has occurred",
    };

    if (error.error && error.error.status && error.error.message) {
      errorResponse = {
        status: error.error.status,
        message: error.error.message,
      };
    }

    return throwError(() => errorResponse);
  }

  signup(newUser: any) {
    return this.http.post<any>(`${this.URL}/users/signup`, newUser).pipe(
      map((response) => this.startSession(response)),
      catchError(this.handleError)
    );
  }

  private setSession(user: any) {
    this.user.next(user);
    this.loggedIn.next(true);

    if (this.isBrowser()) {
      localStorage.setItem("userData", JSON.stringify(user));
    }
  }

  private startSession(response: any) {
    if (!response.token) {
      throw new Error("Token not found in response");
    }

    const decoded = jwtDecode<any>(response.token);
    const loggedInUser = {
      loggedIn: true,
      email: response.data.user.email,
      id: decoded.id,
      _token: response.token,
      expirationDate: new Date(decoded.exp * 1000),
      photo: response.data.user.photo,
      name: response.data.user.name,
      role: response.data.user.role,
      isDemo: response.data.user.isDemo === true,
    };

    this.setSession(loggedInUser);
    return response.data.user;
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: this.user.value?._token ? `Bearer ${this.user.value._token}` : '',
    });
  }

  private restoreUser() {
    if (!this.isBrowser()) {
      return;
    }

    const userDataString = localStorage.getItem("userData");

    if (!userDataString) {
      this.user.next(null);
      this.loggedIn.next(false);
      return;
    }

    try {
      const userData = JSON.parse(userDataString);
      const expirationDate = new Date(userData.expirationDate);

      if (!userData._token || Number.isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
        this.logout();
        return;
      }

      this.user.next({ ...userData, loggedIn: true, expirationDate });
      this.loggedIn.next(true);
    } catch {
      this.logout();
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
