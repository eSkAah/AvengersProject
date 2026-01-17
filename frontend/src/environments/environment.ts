export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  version: string;
}

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  appName: 'Star-Eyes',
  version: '1.0.0-dev',
};
