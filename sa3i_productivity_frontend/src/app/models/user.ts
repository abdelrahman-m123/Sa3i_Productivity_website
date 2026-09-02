export class UserModel {
  constructor(
    public name: string,
    public email: string,
    private _token: string,
    private _expiresIn: Date,
    public photo: string = 'profile.png',
    public role: 'user' | 'admin' | 'premium' = 'user'
  ) {}

  get token(): string | null {
    if (!this._expiresIn || this._expiresIn < new Date()) {
      return null;
    }
    return this._token;
  }
}