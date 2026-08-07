export interface GoogleProfile {
  id?: string;
  displayName?: string;
  emails?: Array<{ value?: string }>;
  photos?: Array<{ value?: string }>;
  _json?: { email_verified?: boolean };
}
