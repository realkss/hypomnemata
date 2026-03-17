type AuthPanelProvider = "google" | "instagram"

type AuthUser = {
  provider: AuthPanelProvider
  name: string
  email?: string
  username?: string
  picture?: string
}

type SessionResponse = {
  configured: Record<AuthPanelProvider, boolean>
  user: AuthUser | null
}

const authMessages: Record<string, string> = {
  access_denied: "Sign-in was cancelled.",
  auth_required: "Sign in is required to view that page.",
  code_exchange_failed: "The sign-in could not be completed.",
  config_missing: "This provider is not configured yet.",
  member_verification_required: "This page is only available to verified members.",
  missing_access_token: "The provider did not return an access token.",
  missing_code: "The provider did not return a login code.",
  not_authorized: "Your account does not have access to that page.",
  profile_fetch_failed: "The profile could not be loaded.",
  profile_incomplete: "The provider did not return enough profile information.",
  state_mismatch: "This sign-in attempt expired.",
}

function getAuthNotice() {
  const currentUrl = new URL(window.location.toString())
  const provider = currentUrl.searchParams.get("auth_provider")
  const error = currentUrl.searchParams.get("auth_error")
  const auth = currentUrl.searchParams.get("auth")

  if (!provider && !error && !auth) {
    return null
  }

  const cleanUrl = new URL(currentUrl.toString())
  cleanUrl.searchParams.delete("auth_provider")
  cleanUrl.searchParams.delete("auth_error")
  cleanUrl.searchParams.delete("auth")
  history.replaceState(history.state, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`)

  if (auth === "success" && provider) {
    return {
      tone: "success" as const,
      message: `Signed in with ${provider === "google" ? "Google" : "Instagram"}.`,
    }
  }

  if (error) {
    return {
      tone: "error" as const,
      message: authMessages[error] ?? "Sign-in could not be completed. Please try again.",
    }
  }

  return null
}

function buildReturnTo() {
  const currentUrl = new URL(window.location.toString())
  const requestedReturnTo = currentUrl.searchParams.get("returnTo")

  if (requestedReturnTo) {
    try {
      const target = new URL(requestedReturnTo, window.location.origin)
      if (target.origin === window.location.origin) {
        return `${target.pathname}${target.search}${target.hash}`
      }
    } catch {
      // fall back to the current page if the provided returnTo is malformed
    }
  }

  currentUrl.searchParams.delete("auth_provider")
  currentUrl.searchParams.delete("auth_error")
  currentUrl.searchParams.delete("auth")
  return `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
}

function providerLabel(provider: AuthPanelProvider) {
  return provider === "google" ? "Google" : "Instagram"
}

function setStatus(panel: HTMLElement, tone: "neutral" | "success" | "error", message: string) {
  const status = panel.querySelector("[data-auth-status]") as HTMLElement | null
  if (!status) {
    return
  }

  status.hidden = message.trim().length === 0
  status.dataset.tone = tone
  status.textContent = message
}

function setHelpText(panel: HTMLElement, message: string) {
  const help = panel.querySelector("[data-auth-help]") as HTMLElement | null
  if (!help) {
    return
  }

  help.textContent = message
}

function setButtonAvailability(panel: HTMLElement, configured: Record<AuthPanelProvider, boolean>) {
  const buttons = Array.from(panel.querySelectorAll("[data-auth-start]"))

  for (const buttonNode of buttons) {
    const button = buttonNode as HTMLButtonElement
    const provider = button.dataset.provider as AuthPanelProvider | undefined
    if (!provider) {
      continue
    }

    const enabled = configured[provider]
    button.disabled = !enabled
    button.title = enabled
      ? `Continue with ${providerLabel(provider)}`
      : `${providerLabel(provider)} sign-in is not configured yet`
  }
}

function setSignedInState(panel: HTMLElement, user: AuthUser) {
  const signedOut = panel.querySelector("[data-auth-signed-out]") as HTMLElement | null
  const signedIn = panel.querySelector("[data-auth-signed-in]") as HTMLElement | null
  const name = panel.querySelector("[data-auth-name]") as HTMLElement | null
  const provider = panel.querySelector("[data-auth-provider]") as HTMLElement | null
  const detail = panel.querySelector("[data-auth-detail]") as HTMLElement | null
  const avatarImage = panel.querySelector("[data-auth-avatar-image]") as HTMLImageElement | null
  const avatarFallback = panel.querySelector("[data-auth-avatar-fallback]") as HTMLElement | null

  if (signedOut) {
    signedOut.hidden = true
  }

  if (signedIn) {
    signedIn.hidden = false
  }

  if (name) {
    name.textContent = user.name
  }

  if (provider) {
    provider.textContent = `Signed in with ${providerLabel(user.provider)}`
  }

  if (detail) {
    if (user.email) {
      detail.textContent = user.email
    } else if (user.username) {
      detail.textContent = `@${user.username}`
    } else {
      detail.textContent = ""
    }
    detail.hidden = detail.textContent.trim().length === 0
  }

  if (avatarFallback) {
    avatarFallback.textContent = user.name.trim().charAt(0).toUpperCase() || "H"
  }

  if (avatarImage) {
    if (user.picture) {
      avatarImage.src = user.picture
      avatarImage.hidden = false
      if (avatarFallback) {
        avatarFallback.hidden = true
      }
    } else {
      avatarImage.hidden = true
      avatarImage.removeAttribute("src")
      if (avatarFallback) {
        avatarFallback.hidden = false
      }
    }
  }

  setHelpText(
    panel,
    "Signed in. Verified-only archives still require account verification and a page-specific grant.",
  )
}

function setSignedOutState(panel: HTMLElement) {
  const signedOut = panel.querySelector("[data-auth-signed-out]") as HTMLElement | null
  const signedIn = panel.querySelector("[data-auth-signed-in]") as HTMLElement | null

  if (signedOut) {
    signedOut.hidden = false
  }

  if (signedIn) {
    signedIn.hidden = true
  }

  setHelpText(
    panel,
    "Use Google or Instagram here, then return to the archive after your account has been verified and granted access.",
  )
}

async function loadSession(): Promise<SessionResponse> {
  const response = await fetch(new URL("/api/auth/session", window.location.origin), {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("session_fetch_failed")
  }

  return (await response.json()) as SessionResponse
}

async function renderPanel(panel: HTMLElement) {
  const notice = getAuthNotice()
  const session = await loadSession()

  setButtonAvailability(panel, session.configured)

  if (session.user) {
    setSignedInState(panel, session.user)
    setStatus(
      panel,
      notice?.tone === "error" ? "error" : "success",
      notice?.message ?? "",
    )
    return
  }

  setSignedOutState(panel)

  const configuredProviders = Object.entries(session.configured)
    .filter(([, enabled]) => enabled)
    .map(([provider]) => providerLabel(provider as AuthPanelProvider))

  if (notice) {
    setStatus(panel, notice.tone, notice.message)
  } else if (configuredProviders.length === 0) {
    setStatus(panel, "neutral", "No providers configured yet.")
  } else {
    setStatus(panel, "neutral", `${configuredProviders.join(" and ")} ready.`)
  }
}

async function setupPanel(panel: HTMLElement) {
  try {
    await renderPanel(panel)
  } catch {
    setSignedOutState(panel)
    setStatus(panel, "error", "Sign-in status could not be loaded.")
  }

  const loginButtons = Array.from(panel.querySelectorAll("[data-auth-start]"))
  for (const buttonNode of loginButtons) {
    const button = buttonNode as HTMLButtonElement
    const provider = button.dataset.provider as AuthPanelProvider | undefined
    if (!provider) {
      continue
    }

    const clickHandler = () => {
      if (button.disabled) {
        return
      }

      const targetUrl = new URL(`/api/auth/${provider}/start`, window.location.origin)
      targetUrl.searchParams.set("returnTo", buildReturnTo())
      window.location.assign(targetUrl.toString())
    }

    button.addEventListener("click", clickHandler)
    window.addCleanup(() => button.removeEventListener("click", clickHandler))
  }

  const logoutButton = panel.querySelector("[data-auth-logout]") as HTMLButtonElement | null
  if (logoutButton) {
    const logoutHandler = async () => {
      logoutButton.disabled = true

      try {
        await fetch(new URL("/api/auth/logout", window.location.origin), {
          method: "POST",
          cache: "no-store",
          headers: {
            accept: "application/json",
          },
        })
      } finally {
        logoutButton.disabled = false
        await renderPanel(panel)
      }
    }

    logoutButton.addEventListener("click", logoutHandler)
    window.addCleanup(() => logoutButton.removeEventListener("click", logoutHandler))
  }
}

document.addEventListener("nav", async () => {
  const panels = Array.from(document.querySelectorAll("[data-auth-panel]"))

  for (const panel of panels) {
    await setupPanel(panel as HTMLElement)
  }
})
