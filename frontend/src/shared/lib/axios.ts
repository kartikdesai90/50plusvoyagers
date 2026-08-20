import axios from 'axios';

/**
 * Shared HTTP client. Point every request at this instance so that base URL,
 * credentials and interceptors stay defined in exactly one place.
 */
export const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
    },
    withCredentials: true,
    withXSRFToken: true,
});

export default http;
