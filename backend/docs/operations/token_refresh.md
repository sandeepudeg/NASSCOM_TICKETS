# Token Refresh Flow

- **Lifetimes**: `TOKEN_EXPIRY_MINUTES` (access), `REFRESH_TOKEN_EXPIRY_HOURS` (refresh).
- **Endpoint**: `POST /auth/refresh` (to implement) accepts httpOnly refresh token; returns rotated access+refresh.
- **Rotation**: single-use refresh tokens; revoke old on success; store JTI/exp in DB or cache.
- **Client behavior**:
  - Refresh at 80% of access token lifetime.
  - On 401 with `token_expired`, attempt one refresh then retry original request.
  - Logout if refresh fails.
- **Rate limiting**: 10 refresh calls/min/user.
- **Security**: httpOnly + SameSite=Lax cookies; bind refresh token to user agent + IP hash when feasible.
