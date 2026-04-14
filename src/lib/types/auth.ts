export interface JwtPayload {
  sub: string;
  rol: "USUARIO" | "ADMIN";
  iat: number;
  exp: number;
}
export interface LoginResponse {
  token: string;
  email: string;
  rol: "USUARIO" | "ADMIN";
  expiresIn: number;
}
