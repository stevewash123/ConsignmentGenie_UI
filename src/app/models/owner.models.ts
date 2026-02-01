export interface OwnerContact {
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string;
  phone: string | null;
}

export interface OwnerAddress {
  shopAddress1: string | null;
  shopAddress2: string | null;
  shopCity: string | null;
  shopState: string | null;
  shopZip: string | null;
  shopCountry: string;
}