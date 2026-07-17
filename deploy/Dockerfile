# Runtime-only image: wraps a locally-built Angular bundle in nginx.
# Used by the "build locally → ship artifact → deploy on VM" flow
# (build-and-ship.ps1 + deploy.sh; see README §13). No Node/npm needed on the VM.
#
# Build context must contain ./browser (the Angular output) and ./nginx.conf.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY browser /usr/share/nginx/html
EXPOSE 80
