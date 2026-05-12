export type UserRole = "citizen" | "brgy_official" | "admin";

export interface User {
  id: string;
  firebase_uid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  location_id: number;
}

export interface RegisterUser {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}
