import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, map, BehaviorSubject, throwError } from "rxjs";
import { UserModel } from "../models/user";
import { jwtDecode } from "jwt-decode";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private http = inject(HttpClient);
  private URL = "http://localhost:3000";
  private loggedIn = new BehaviorSubject<boolean>(false); // initial state
  isLoggedIn$ = this.loggedIn.asObservable(); // observable for components

  user = new BehaviorSubject<any>(null);

  login(email: string, password: string) {
    return this.http.post<any>(`${this.URL}/users/login`, { email, password }).pipe(
      map((response) => {
        if (response.token) {
          const decoded = jwtDecode<any>(response.token);
          const expirationDate = new Date(decoded.exp * 1000);

          const loggedInUser = {
            loggedIn: true,
            email:response.data.user.email,
            id: decoded.id,
            _token: response.token,
            expirationDate: expirationDate,
            photo: response.data.user.photo,
            name: response.data.user.name
          };
          localStorage.setItem("userData", JSON.stringify(loggedInUser));
          this.user.next(loggedInUser);
          console.log(localStorage.getItem("userData"));
          
          return response.data.user;
        } else {
          throw new Error("Token not found in response");
        }
      }),
      catchError(this.handleError)
    );
  }

// Called from AppComponent ngOnInit to restore logged-in user from localStorage on app start
  autoLogin() { 
    const userDataString = localStorage.getItem("userData");
    if (!userDataString) return;

    const userData = JSON.parse(userDataString);
    const loadedUser = new UserModel(
      userData.email,
      userData.id,
      userData._token,
      new Date(userData._expiresIn)
    );

    if (loadedUser.token) {
      this.user.next(loadedUser);
    }
  }

// Called in any component
  logout() {
    this.user.next(null);
    localStorage.removeItem("userData");
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
    map((response) => {
      if (response.token) {
        const decoded = jwtDecode<any>(response.token);
        const expirationDate = new Date(decoded.exp * 1000);
        const loggedInUser = {
            email:response.data.user.email,
            id: decoded.id,
            _token: response.token,
            expirationDate: expirationDate,
            photo: response.data.user.photo,
            name: response.data.user.name
          };
        this.user.next(loggedInUser);
        localStorage.setItem("userData", JSON.stringify(loggedInUser));

        return response.data.user;
      } else {
        throw new Error('Token not found in response');
      }
    }),
    catchError(this.handleError)
  );
}
}