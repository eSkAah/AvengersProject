export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  version: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: '/api',
  appName: 'Avengers Project',
  version: '1.0.0',
};
