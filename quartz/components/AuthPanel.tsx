import { QuartzComponent, QuartzComponentConstructor } from "./types"
import style from "./styles/authPanel.scss"
// @ts-ignore
import script from "./scripts/authPanel.inline"

const AuthPanel: QuartzComponent = () => {
  return (
    <section id="session-access" class="auth-panel" data-auth-panel aria-live="polite">
      <div class="auth-panel__heading">
        <p class="auth-panel__eyebrow">Session</p>
        <p class="auth-panel__caption">Notebook access</p>
      </div>

      <div class="auth-panel__actions" data-auth-signed-out>
        <button
          class="auth-provider auth-provider--google"
          type="button"
          data-auth-start
          data-provider="google"
          aria-label="Continue with Google"
        >
          <span class="auth-provider__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.2 1.2-1.5 3.6-5.4 3.6-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.8 3.1 14.6 2 12 2 6.8 2 2.6 6.2 2.6 11.4S6.8 20.8 12 20.8c6.1 0 9.1-4.3 9.1-6.5 0-.4 0-.8-.1-1.1z"
              />
              <path
                fill="#34A853"
                d="M3.7 7.3l3.2 2.3c.9-1.8 2.8-3 5.1-3 1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.8 3.1 14.6 2 12 2 8.3 2 5.1 4.1 3.7 7.3z"
              />
              <path
                fill="#FBBC05"
                d="M12 20.8c2.5 0 4.7-.8 6.2-2.3l-3-2.4c-.8.6-1.9 1-3.2 1-2.3 0-4.2-1.5-4.9-3.7l-3.3 2.5c1.4 3.3 4.6 4.9 8.2 4.9z"
              />
              <path
                fill="#4285F4"
                d="M3.7 16l3.3-2.5c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.7 7c-.6 1.2-1.1 2.7-1.1 4.4S3 14.8 3.7 16z"
              />
            </svg>
          </span>
          <span class="auth-provider__label">Google</span>
        </button>
        <button
          class="auth-provider auth-provider--instagram"
          type="button"
          data-auth-start
          data-provider="instagram"
          aria-label="Continue with Instagram"
        >
          <span class="auth-provider__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <defs>
                <linearGradient id="auth-instagram-gradient" x1="0%" x2="100%" y1="100%" y2="0%">
                  <stop offset="0%" stopColor="#F58529" />
                  <stop offset="35%" stopColor="#FEDA77" />
                  <stop offset="65%" stopColor="#DD2A7B" />
                  <stop offset="100%" stopColor="#515BD4" />
                </linearGradient>
              </defs>
              <rect
                x="2.25"
                y="2.25"
                width="19.5"
                height="19.5"
                rx="5.8"
                fill="url(#auth-instagram-gradient)"
              />
              <circle
                cx="12"
                cy="12"
                r="4"
                fill="none"
                stroke="#fff"
                strokeWidth="1.8"
              />
              <rect
                x="6.7"
                y="6.7"
                width="10.6"
                height="10.6"
                rx="3.2"
                fill="none"
                stroke="#fff"
                strokeWidth="1.8"
              />
              <circle cx="17.05" cy="6.95" r="1.15" fill="#fff" />
            </svg>
          </span>
          <span class="auth-provider__label">Instagram</span>
        </button>
      </div>

      <div class="auth-panel__session" data-auth-signed-in hidden>
        <div class="auth-panel__identity">
          <div class="auth-panel__avatar" aria-hidden="true">
            <img class="auth-panel__avatar-image" data-auth-avatar-image alt="" hidden />
            <span data-auth-avatar-fallback>H</span>
          </div>
          <div class="auth-panel__identity-copy">
            <strong data-auth-name>Hypomnemata reader</strong>
            <span class="auth-panel__identity-provider" data-auth-provider>
              Signed in with Google
            </span>
            <span class="auth-panel__identity-detail" data-auth-detail></span>
          </div>
        </div>
        <button class="auth-panel__logout" type="button" data-auth-logout>
          Sign out
        </button>
      </div>

      <p class="auth-panel__help" data-auth-help>
        Use this panel to sign in before opening verified-only archives.
      </p>

      <p class="auth-panel__status" data-auth-status data-tone="neutral">
        Checking sign-in status...
      </p>
    </section>
  )
}

AuthPanel.css = style
AuthPanel.afterDOMLoaded = script

export default (() => AuthPanel) satisfies QuartzComponentConstructor
