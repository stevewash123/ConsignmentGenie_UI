export interface AuthProvider {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export const AUTH_consignors: AuthProvider[] = [
  { id: 'google', name: 'Google', icon: 'G', enabled: true },
  { id: 'facebook', name: 'Facebook', icon: 'f', enabled: true },
  // Future consignors:
  // { id: 'apple', name: 'Apple', icon: '', enabled: false },
  // { id: 'microsoft', name: 'Microsoft', icon: '', enabled: false },
];

export function getEnabledconsignors(): AuthProvider[] {
  return AUTH_consignors.filter(consignor => consignor.enabled);
}

export function getProviderById(id: string): AuthProvider | undefined {
  return AUTH_consignors.find(consignor => consignor.id === id);
}