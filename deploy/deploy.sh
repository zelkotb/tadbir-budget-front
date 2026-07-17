#!/usr/bin/env bash
#
# (Re)build the Tadbir Budget frontend image and start it as a container.
# Run this ON the VM 192.168.1.203, from inside the extracted release/ folder
# (which contains: browser/, nginx.conf, Dockerfile, VERSION, deploy.sh).
# With host networking (the default) nginx binds the host's :80 and the /api proxy
# reaches the local backend on 127.0.0.1:8080.
#
#   tar -xzf tadbir-budget-frontend-<version>.tar.gz && bash deploy.sh
#
# Options (env vars):
#   HOST_NET=1     run with --network host (DEFAULT). nginx binds the host's :80
#                  and proxies /api to the backend on 127.0.0.1:8080 — required
#                  for this single-machine setup.
#   HOST_NET=0     bridge networking + -p PORT:80 instead (only works if nginx.conf
#                  proxies to a host-reachable address, not 127.0.0.1).
#   PORT=80        host port for bridge mode (ignored under host networking).
#
set -euo pipefail

cd "$(dirname "$0")"

# Version stamped into the release by build-and-ship.ps1 (falls back to "latest").
VERSION="$(cat VERSION 2>/dev/null | tr -d '[:space:]')"
[ -n "${VERSION}" ] || VERSION="latest"
IMAGE="tadbir-budget-frontend:${VERSION}"
CONTAINER="tadbir-budget-frontend"
PORT="${PORT:-80}"

echo "▶ Building image ${IMAGE} ..."
docker build -t "${IMAGE}" -t "tadbir-budget-frontend:latest" .

echo "▶ Removing any previous container ..."
docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true

echo "▶ Starting container ${CONTAINER} ..."
if [ "${HOST_NET:-1}" = "1" ]; then
  # Shares the host network: nginx binds host:80 directly and reaches the backend
  # on 127.0.0.1:8080 with no bridge in between (the default for this setup).
  docker run -d --name "${CONTAINER}" --restart unless-stopped --network host "${IMAGE}"
else
  docker run -d --name "${CONTAINER}" --restart unless-stopped -p "${PORT}:80" "${IMAGE}"
fi

echo "▶ Waiting for nginx to come up ..."
sleep 3

echo "── container ─────────────────────────────────────────────"
docker ps --filter "name=${CONTAINER}" --format "  {{.Names}}  {{.Status}}  {{.Ports}}"

echo "── smoke test ────────────────────────────────────────────"
base="http://localhost:${PORT}"
curl -fsS -o /dev/null -w "  GET /                     → %{http_code}\n" "${base}/" \
  || echo "  ✗ SPA not responding"
curl -fsS -o /dev/null -w "  GET /actuator/health      → %{http_code}\n" "${base}/actuator/health" \
  || echo "  ✗ API proxy/backend not reachable — is the backend up on 127.0.0.1:8080?"

echo "──────────────────────────────────────────────────────────"
echo "✔ Done (v${VERSION}).  App:  http://192.168.1.203:${PORT}/"
echo "  Logs:  docker logs -f ${CONTAINER}"
echo "  Stop:  docker rm -f ${CONTAINER}"
