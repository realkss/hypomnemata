import {
  AuthEnv,
  AuthUser,
  buildAuthResultUrl,
  clearAuthStateCookie,
  getOrigin,
  getProviderAvailability,
  issueSessionCookie,
  readAuthState,
  redirect,
} from "../_lib"

type PagesContext = {
  request: Request
  env: AuthEnv
}

type InstagramTokenResponse = {
  access_token?: string
}

type InstagramProfile = {
  id?: string
  username?: string
}

function failureRedirect(context: PagesContext, returnTo: string, reason: string) {
  return redirect(
    buildAuthResultUrl(context.request, returnTo, {
      provider: "instagram",
      auth_error: reason,
    }),
    [clearAuthStateCookie()],
  )
}

export async function onRequestGet(context: PagesContext) {
  const configured = getProviderAvailability(context.env)
  const requestUrl = new URL(context.request.url)
  const fallbackReturnTo = "/"

  if (!configured.instagram) {
    return failureRedirect(context, fallbackReturnTo, "config_missing")
  }

  const oauthState = await readAuthState(context.request, context.env)
  const returnTo = oauthState?.returnTo ?? fallbackReturnTo

  if (!oauthState || oauthState.provider !== "instagram") {
    return failureRedirect(context, returnTo, "state_mismatch")
  }

  const returnedState = requestUrl.searchParams.get("state")
  if (!returnedState || returnedState !== oauthState.state) {
    return failureRedirect(context, returnTo, "state_mismatch")
  }

  const providerError = requestUrl.searchParams.get("error")
  if (providerError) {
    return failureRedirect(context, returnTo, providerError)
  }

  const code = requestUrl.searchParams.get("code")
  if (!code) {
    return failureRedirect(context, returnTo, "missing_code")
  }

  const redirectUri = `${getOrigin(context.request)}/api/auth/instagram/callback`
  const tokenBody = new FormData()
  tokenBody.set("client_id", context.env.INSTAGRAM_CLIENT_ID!)
  tokenBody.set("client_secret", context.env.INSTAGRAM_CLIENT_SECRET!)
  tokenBody.set("grant_type", "authorization_code")
  tokenBody.set("redirect_uri", redirectUri)
  tokenBody.set("code", code)

  const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: tokenBody,
  })

  if (!tokenResponse.ok) {
    return failureRedirect(context, returnTo, "code_exchange_failed")
  }

  const tokenPayload = (await tokenResponse.json()) as InstagramTokenResponse
  if (!tokenPayload.access_token) {
    return failureRedirect(context, returnTo, "missing_access_token")
  }

  const profileUrl = new URL("https://graph.instagram.com/me")
  profileUrl.searchParams.set("fields", "id,username")
  profileUrl.searchParams.set("access_token", tokenPayload.access_token)

  const profileResponse = await fetch(profileUrl.toString())
  if (!profileResponse.ok) {
    return failureRedirect(context, returnTo, "profile_fetch_failed")
  }

  const profile = (await profileResponse.json()) as InstagramProfile
  if (!profile.id || !profile.username) {
    return failureRedirect(context, returnTo, "profile_incomplete")
  }

  const user: AuthUser = {
    provider: "instagram",
    sub: profile.id,
    name: `@${profile.username}`,
    username: profile.username,
  }

  const sessionCookie = await issueSessionCookie(context.env, user)

  return redirect(
    buildAuthResultUrl(context.request, returnTo, {
      provider: "instagram",
      auth: "success",
    }),
    [clearAuthStateCookie(), sessionCookie],
  )
}
