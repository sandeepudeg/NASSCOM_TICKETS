# Security Notes

- **PII scrubbing**: enabled by default; do not set `DISABLE_PII_SCRUBBING=true` in production builds (Dockerfile guard).
- **Auth**: OAuth2/OIDC via Keycloak/Authentik. Configure `AUTH_SERVICE_URL`, `TOKEN_EXPIRY_MINUTES`, `REFRESH_TOKEN_EXPIRY_HOURS`.
- **RBAC**: enforce on APIs; rate limits: `RATE_LIMIT_STANDARD`, `RATE_LIMIT_SERVICE_ACCOUNT`.
- **Webhooks**: verify target TLS; retries with backoff; monitor `escalation_webhook_*` metrics; consider HMAC signing of payloads.
- **Database**: enable RLS for `audit_log` (see `db/audit_rls.sql`); audit table is append-only—no updates/deletes.
- **Transport**: terminate TLS at Traefik; enforce TLS 1.2+.
- **Secrets**: load from `.env`; never bake secrets into images; prefer Docker/K8s secrets.
- **mTLS (recommended)**: between API ↔ DB/MinIO/Ollama when running in production.
- **Dependencies**: pin versions in `requirements.txt`; run `pip install --upgrade --dry-run` in CI periodically.
