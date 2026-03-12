import {
  AuthEnv,
  buildAuthResultUrl,
  getOrigin,
  getProviderAvailability,
  getReturnTo,
  issueAuthStateCookie,
  redirect,
} from "../_lib"

type PagesContext = {
  request: Request
  env: AuthEnv
}

export async function onRequestGet(context: PagesContext) {
  const requestUrl = new URL(context.request.url)
  const returnTo = getReturnTo(context.request, requestUrl.searchParams.get("returnTo"))
  const configured = getProviderAvailability(context.env)

  if (!configured.google) {
    return redirect(
      buildAuthResultUrl(context.request, returnTo, {
        provider: "google",
        auth_error: "config_missing",
      }),
    )
  }

  const state = crypto.randomUUID()
  const redirectUri = `${getOrigin(context.request)}/api/auth/google/callback`
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")

  authUrl.searchParams.set("client_id", context.env.GOOGLE_CLIENT_ID!)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("include_granted_scopes", "true")
  authUrl.searchParams.set("prompt", "select_account")

  const stateCookie = await issueAuthStateCookie(context.env, {
    provider: "google",
    returnTo,
    state,
  })

  return redirect(authUrl.toString(), [stateCookie])
}
