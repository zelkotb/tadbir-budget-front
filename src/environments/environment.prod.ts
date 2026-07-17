export const environment = {
    production: true,
    // Relative base → every API call is same-origin and goes through nginx, which
    // reverse-proxies /api to the local backend (127.0.0.1:8080). No CORS, and the
    // HttpOnly refresh cookie is first-party over plain HTTP.
    apiUrl: '/api/v1'
};
