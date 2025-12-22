export interface AuthProvider {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export const AUTH_PROVIDERS: AuthProvider[] = [
  { id: 'google', name: 'Google', icon: 'G', enabled: true },
  { id: 'facebook', name: 'Facebook', icon: 'f', enabled: true },
  // Future providers:
  // { id: 'apple', name: 'Apple', icon: '', enabled: false },
  // { id: 'microsoft', name: 'Microsoft', icon: '', enabled: false },
];

export function getEnabledProviders(): AuthProvider[] {
  return AUTH_PROVIDERS.filter(provider => provider.enabled);
}

export function getProviderById(id: string): AuthProvider | undefined {
  return AUTH_PROVIDERS.find(provider => provider.id === id);
}