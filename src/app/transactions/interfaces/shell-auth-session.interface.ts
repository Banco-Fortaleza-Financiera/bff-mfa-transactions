export interface ShellAuthSession {
  authenticated?: boolean;
  accessToken?: string;
  tokenType?: string;
  expiresAt?: string;
  sessionId?: string;
  deviceIp?: string;
}
