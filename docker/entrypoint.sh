#!/bin/sh
set -eu

normalize_url() {
  raw_url="$1"

  case "$raw_url" in
    http://*|https://*) printf "%s" "${raw_url%/}" ;;
    *) printf "https://%s" "${raw_url%/}" ;;
  esac
}

SITE_URL="${SITE_URL:-}"

if [ -z "$SITE_URL" ] && [ -n "${COOLIFY_FQDN:-}" ]; then
  COOLIFY_DOMAIN="$(printf "%s" "$COOLIFY_FQDN" | cut -d',' -f1 | tr -d ' ')"
  SITE_URL="$(normalize_url "$COOLIFY_DOMAIN")"
fi

if [ -z "$SITE_URL" ]; then
  SITE_URL="http://localhost"
fi

SITE_URL="$(normalize_url "$SITE_URL")"
export SITE_URL

find /usr/share/nginx/html -type f -name "*.template" | while read -r template; do
  target="${template%.template}"
  sed "s|__SITE_URL__|$SITE_URL|g" "$template" > "$target"
  rm -f "$template"
done

find /usr/share/nginx/html -type f -name "*.html" -exec sed -i "s|__SITE_URL__|$SITE_URL|g" {} +

exec "$@"
