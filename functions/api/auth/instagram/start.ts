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

  if (!configured.instagram) {
    return redirect(
      buildAuthResultUrl(context.request, returnTo, {
        provider: "instagram",
        auth_error: "config_missing",
      }),
    )
  }

  const state = crypto.randomUUID()
  const redirectUri = `${getOrigin(context.request)}/api/auth/instagram/callback`
  const authUrl = new URL("https://www.instagram.com/oauth/authorize")

  authUrl.searchParams.set("client_id", context.env.INSTAGRAM_CLIENT_ID!)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "instagram_business_basic")
  authUrl.searchParams.set("state", state)

  const stateCookie = await issueAuthStateCookie(context.env, {
    provider: "instagram",
    returnTo,
    state,
  })

  return redirect(authUrl.toString(), [stateCookie])
}
