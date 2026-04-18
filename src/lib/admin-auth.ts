const ADMIN_PASSWORD = 'jaydendelivers2503'
const ADMIN_SESSION_COOKIE = 'payjayden_admin_session'
const ADMIN_SESSION_VALUE = 'granted'
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}
  return cookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const index = part.indexOf('=')
      if (index === -1) return acc
      const key = decodeURIComponent(part.slice(0, index).trim())
      const value = decodeURIComponent(part.slice(index + 1).trim())
      acc[key] = value
      return acc
    }, {})
}

export function isValidAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

export function hasAdminSessionFromRequest(request: Request): boolean {
  const cookies = parseCookies(request.headers.get('cookie'))
  return cookies[ADMIN_SESSION_COOKIE] === ADMIN_SESSION_VALUE
}

export function buildAdminSessionCookie(): string {
  return `${ADMIN_SESSION_COOKIE}=${ADMIN_SESSION_VALUE}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_SESSION_MAX_AGE}`
}

export function clearAdminSessionCookie(): string {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
