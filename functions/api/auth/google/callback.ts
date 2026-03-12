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

type GoogleTokenResponse = {
  access_token?: string
}

type GoogleUserInfo = {
  sub?: string
  name?: string
  email?: string
  picture?: string
}

function failureRedirect(context: PagesContext, returnTo: string, reason: string) {
  return redirect(
    buildAuthResultUrl(context.request, returnTo, {
      provider: "google",
      auth_error: reason,
    }),
    [clearAuthStateCookie()],
  )
}

export async function onRequestGet(context: PagesContext) {
  const configured = getProviderAvailability(context.env)
  const requestUrl = new URL(context.request.url)
  const fallbackReturnTo = "/"

  if (!configured.google) {
    return failureRedirect(context, fallbackReturnTo, "config_missing")
  }

  const oauthState = await readAuthState(context.request, context.env)
  const returnTo = oauthState?.returnTo ?? fallbackReturnTo

  if (!oauthState || oauthState.provider !== "google") {
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

  const redirectUri = `${getOrigin(context.request)}/api/auth/google/callback`
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({
      client_id: context.env.GOOGLE_CLIENT_ID!,
      client_secret: context.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenResponse.ok) {
    return failureRedirect(context, returnTo, "code_exchange_failed")
  }

  const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse
  if (!tokenPayload.access_token) {
    return failureRedirect(context, returnTo, "missing_access_token")
  }

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      authorization: `Bearer ${tokenPayload.access_token}`,
    },
  })

  if (!profileResponse.ok) {
    return failureRedirect(context, returnTo, "profile_fetch_failed")
  }

  const profile = (await profileResponse.json()) as GoogleUserInfo
  if (!profile.sub) {
    return failureRedirect(context, returnTo, "profile_incomplete")
  }

  const user: AuthUser = {
    provider: "google",
    sub: profile.sub,
    name: profile.name || profile.email || "Google user",
    email: profile.email,
    picture: profile.picture,
  }

  const sessionCookie = await issueSessionCookie(context.env, user)

  return redirect(
    buildAuthResultUrl(context.request, returnTo, {
      provider: "google",
      auth: "success",
    }),
    [clearAuthStateCookie(), sessionCookie],
  )
}
