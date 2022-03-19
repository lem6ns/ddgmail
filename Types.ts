export interface AddressResponse {
    address: string;
}

export interface DashboardResponse {
    invites: any[];
    stats:   Stats;
    user:    User;
}

export interface Stats {
    addresses_generated: number;
}

export interface User {
    access_token: string;
    cohort:       string;
    email:        string;
    username:     string;
}

export interface AuthenticationResponse {
    status: string;
    token:  string;
    user:   string;
}