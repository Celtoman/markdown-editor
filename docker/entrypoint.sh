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

if [ -f /usr/share/nginx/html/index.html ]; then
  sed -i "s|__SITE_URL__|$SITE_URL|g" /usr/share/nginx/html/index.html
fi

if [ -f /usr/share/nginx/html/sitemap.xml.template ]; then
  sed "s|__SITE_URL__|$SITE_URL|g" /usr/share/nginx/html/sitemap.xml.template > /usr/share/nginx/html/sitemap.xml
  rm -f /usr/share/nginx/html/sitemap.xml.template
fi

if [ -f /usr/share/nginx/html/robots.txt.template ]; then
  sed "s|__SITE_URL__|$SITE_URL|g" /usr/share/nginx/html/robots.txt.template > /usr/share/nginx/html/robots.txt
  rm -f /usr/share/nginx/html/robots.txt.template
fi

exec "$@"
