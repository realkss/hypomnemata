type AccessAdminProvider = "google" | "instagram"

type AccessAdminUser = {
  key: string
  name: string
  provider: AccessAdminProvider
  email?: string
  username?: string
  picture?: string
  blocked: boolean
  createdAt?: string
  lastSeenAt?: string
}

type AccessAdminPage = {
  slug: string
  title: string
  access: "restricted" | "owner"
  allowedIdentifiers: string[]
}

type AccessAdminResponse = {
  ok: boolean
  storage: {
    configured: boolean
  }
  currentUser: {
    name: string
    provider: AccessAdminProvider
    email?: string
    username?: string
  }
  users: AccessAdminUser[]
  pages: AccessAdminPage[]
}

function relativePath(slug: string) {
  return slug === "index" ? "/" : `/${slug.replace(/\/index$/, "/")}`
}

function formatDate(value?: string) {
  if (!value) {
    return "Never"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Never"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function parseIdentifiers(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(/[\n,]/g)
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  )
}

function setRootStatus(
  root: HTMLElement,
  tone: "neutral" | "success" | "error",
  message: string,
) {
  const status = root.querySelector("[data-access-admin-status]") as HTMLElement | null
  if (!status) {
    return
  }

  status.dataset.tone = tone
  status.textContent = message
}

async function fetchAdminState() {
  const response = await fetch(new URL("/api/access/admin", window.location.origin), {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("admin_state_failed")
  }

  return (await response.json()) as AccessAdminResponse
}

async function updateRule(slug: string, allowedIdentifiers: string[]) {
  const response = await fetch(new URL("/api/access/admin/rules", window.location.origin), {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      slug,
      allowedIdentifiers,
    }),
  })

  if (!response.ok) {
    throw new Error("rule_update_failed")
  }
}

async function updateUser(key: string, blocked: boolean) {
  const response = await fetch(new URL("/api/access/admin/users", window.location.origin), {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      key,
      blocked,
    }),
  })

  if (!response.ok) {
    throw new Error("user_update_failed")
  }
}

function renderSummary(root: HTMLElement, state: AccessAdminResponse) {
  const summary = root.querySelector("[data-access-admin-summary]") as HTMLElement | null
  if (!summary) {
    return
  }

  summary.hidden = false
  summary.replaceChildren()

  const title = document.createElement("h3")
  title.className = "access-admin-console__section-title"
  title.textContent = "Overview"
  summary.appendChild(title)

  const grid = document.createElement("div")
  grid.className = "access-admin-console__summary-grid"

  const cards = [
    {
      label: "Current owner",
      value:
        state.currentUser.email ??
        (state.currentUser.username ? `@${state.currentUser.username}` : state.currentUser.name),
    },
    {
      label: "Restricted pages",
      value: `${state.pages.filter((page) => page.access === "restricted").length}`,
    },
    {
      label: "Known users",
      value: `${state.users.length}`,
    },
    {
      label: "Storage",
      value: state.storage.configured ? "KV connected" : "KV not configured",
    },
  ]

  for (const cardData of cards) {
    const card = document.createElement("div")
    card.className = "access-admin-console__summary-card"

    const strong = document.createElement("strong")
    strong.textContent = cardData.label

    const span = document.createElement("span")
    span.textContent = cardData.value

    card.append(strong, document.createElement("br"), span)
    grid.appendChild(card)
  }

  summary.appendChild(grid)
}

function renderPages(root: HTMLElement, state: AccessAdminResponse) {
  const container = root.querySelector("[data-access-admin-pages]") as HTMLElement | null
  if (!container) {
    return
  }

  container.hidden = false
  container.replaceChildren()

  const title = document.createElement("h3")
  title.className = "access-admin-console__section-title"
  title.textContent = "Page access"
  container.appendChild(title)

  const hint = document.createElement("p")
  hint.className = "access-admin-console__hint"
  hint.textContent =
    "Known users can be toggled directly. Additional identifiers can be emails or provider keys, one per line."
  container.appendChild(hint)

  const stack = document.createElement("div")
  stack.className = "access-admin-console__stack"

  const knownUserKeys = new Set(state.users.map((user) => user.key))

  for (const page of state.pages) {
    const card = document.createElement("div")
    card.className = "access-admin-console__page-card"

    const head = document.createElement("div")
    head.className = "access-admin-console__page-head"

    const textWrap = document.createElement("div")
    const heading = document.createElement("h4")
    heading.textContent = page.title
    const slug = document.createElement("p")
    slug.className = "access-admin-console__slug"
    slug.textContent = relativePath(page.slug)
    textWrap.append(heading, slug)

    const badge = document.createElement("span")
    badge.className = "access-admin-console__badge"
    badge.textContent = page.access

    head.append(textWrap, badge)
    card.appendChild(head)

    if (page.access === "owner") {
      const ownerOnly = document.createElement("p")
      ownerOnly.className = "access-admin-console__hint"
      ownerOnly.textContent = "This page is owner-only and does not accept shared grants."
      card.appendChild(ownerOnly)
      stack.appendChild(card)
      continue
    }

    const chooser = document.createElement("div")
    chooser.className = "access-admin-console__chooser"

    const knownUsersLabel = document.createElement("strong")
    knownUsersLabel.textContent = "Known users"
    chooser.appendChild(knownUsersLabel)

    const checkboxes = document.createElement("div")
    checkboxes.className = "access-admin-console__checkboxes"

    for (const user of state.users) {
      const label = document.createElement("label")
      label.className = "access-admin-console__checkbox"
      label.dataset.blocked = user.blocked ? "true" : "false"

      const input = document.createElement("input")
      input.type = "checkbox"
      input.value = user.key
      input.checked = page.allowedIdentifiers.includes(user.key)

      const meta = document.createElement("span")
      meta.className = "access-admin-console__checkbox-meta"

      const name = document.createElement("strong")
      name.textContent = user.name

      const detail = document.createElement("span")
      const providerText = user.email ?? (user.username ? `@${user.username}` : user.key)
      detail.textContent = user.blocked
        ? `${providerText} | blocked`
        : `${providerText} | ${user.provider}`

      meta.append(name, detail)
      label.append(input, meta)
      checkboxes.appendChild(label)
    }

    chooser.appendChild(checkboxes)

    const customLabel = document.createElement("strong")
    customLabel.textContent = "Additional identifiers"
    chooser.appendChild(customLabel)

    const textarea = document.createElement("textarea")
    textarea.className = "access-admin-console__textarea"
    textarea.placeholder = "person@example.com\ngoogle:sub:123...\ninstagram:someuser"
    textarea.value = page.allowedIdentifiers
      .filter((value) => !knownUserKeys.has(value))
      .join("\n")
    chooser.appendChild(textarea)

    const actions = document.createElement("div")
    actions.className = "access-admin-console__actions"

    const saveButton = document.createElement("button")
    saveButton.className = "access-admin-console__button"
    saveButton.type = "button"
    saveButton.textContent = state.storage.configured ? "Save access" : "KV required to save"
    saveButton.disabled = !state.storage.configured

    const inlineStatus = document.createElement("span")
    inlineStatus.className = "access-admin-console__inline-status"

    actions.append(saveButton, inlineStatus)
    chooser.appendChild(actions)

    saveButton.addEventListener("click", async () => {
      saveButton.disabled = true
      inlineStatus.textContent = "Saving..."

      try {
        const selectedKnownUsers = Array.from(
          checkboxes.querySelectorAll<HTMLInputElement>("input[type='checkbox']:checked"),
        ).map((input) => input.value)
        const customIdentifiers = parseIdentifiers(textarea.value)
        await updateRule(page.slug, [...selectedKnownUsers, ...customIdentifiers])
        inlineStatus.textContent = "Saved."
        setRootStatus(root, "success", `Updated access for ${page.title}.`)
      } catch {
        inlineStatus.textContent = "Could not save."
        setRootStatus(root, "error", `Access for ${page.title} could not be saved.`)
      } finally {
        saveButton.disabled = !state.storage.configured
      }
    })

    card.appendChild(chooser)
    stack.appendChild(card)
  }

  if (state.pages.length === 0) {
    const empty = document.createElement("p")
    empty.className = "access-admin-console__hint"
    empty.textContent =
      "No restricted pages are published yet. Add `access: restricted` or `access: owner` to a page frontmatter block first."
    stack.appendChild(empty)
  }

  container.appendChild(stack)
}

function renderUsers(root: HTMLElement, state: AccessAdminResponse) {
  const container = root.querySelector("[data-access-admin-users]") as HTMLElement | null
  if (!container) {
    return
  }

  container.hidden = false
  container.replaceChildren()

  const title = document.createElement("h3")
  title.className = "access-admin-console__section-title"
  title.textContent = "Known users"
  container.appendChild(title)

  const hint = document.createElement("p")
  hint.className = "access-admin-console__hint"
  hint.textContent = "Signed-in users appear here automatically. Blocking a user revokes all restricted-page access."
  container.appendChild(hint)

  const list = document.createElement("div")
  list.className = "access-admin-console__user-list"

  for (const user of state.users) {
    const card = document.createElement("div")
    card.className = "access-admin-console__user-card"

    const head = document.createElement("div")
    head.className = "access-admin-console__user-head"

    const textWrap = document.createElement("div")
    const name = document.createElement("div")
    name.className = "access-admin-console__user-name"
    name.textContent = user.name

    const meta = document.createElement("div")
    meta.className = "access-admin-console__user-meta"
    meta.textContent = [
      user.email ?? (user.username ? `@${user.username}` : user.key),
      user.provider,
      `Last seen ${formatDate(user.lastSeenAt)}`,
    ].join(" | ")

    textWrap.append(name, meta)

    const badge = document.createElement("span")
    badge.className = "access-admin-console__badge"
    badge.textContent = user.blocked ? "blocked" : "active"

    head.append(textWrap, badge)
    card.appendChild(head)

    const actions = document.createElement("div")
    actions.className = "access-admin-console__actions"

    const toggle = document.createElement("label")
    toggle.className = "access-admin-console__toggle"

    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.checked = user.blocked

    const toggleText = document.createElement("span")
    toggleText.textContent = "Blocked"

    toggle.append(checkbox, toggleText)

    const saveButton = document.createElement("button")
    saveButton.className = "access-admin-console__button"
    saveButton.type = "button"
    saveButton.textContent = state.storage.configured ? "Save user" : "KV required to save"
    saveButton.disabled = !state.storage.configured

    const inlineStatus = document.createElement("span")
    inlineStatus.className = "access-admin-console__inline-status"

    saveButton.addEventListener("click", async () => {
      saveButton.disabled = true
      inlineStatus.textContent = "Saving..."

      try {
        await updateUser(user.key, checkbox.checked)
        badge.textContent = checkbox.checked ? "blocked" : "active"
        inlineStatus.textContent = "Saved."
        setRootStatus(root, "success", `Updated ${user.name}.`)
      } catch {
        inlineStatus.textContent = "Could not save."
        setRootStatus(root, "error", `${user.name} could not be updated.`)
      } finally {
        saveButton.disabled = !state.storage.configured
      }
    })

    actions.append(toggle, saveButton, inlineStatus)
    card.appendChild(actions)
    list.appendChild(card)
  }

  if (state.users.length === 0) {
    const empty = document.createElement("p")
    empty.className = "access-admin-console__hint"
    empty.textContent = "No users have signed in yet."
    list.appendChild(empty)
  }

  container.appendChild(list)
}

async function setupAccessAdminConsole(root: HTMLElement) {
  setRootStatus(root, "neutral", "Loading access rules...")

  try {
    const state = await fetchAdminState()
    renderSummary(root, state)
    renderPages(root, state)
    renderUsers(root, state)

    const storageMessage = state.storage.configured
      ? "Owner access console ready."
      : "Owner access console loaded. Bind ACCESS_CONTROL_KV to save page grants."
    setRootStatus(root, "success", storageMessage)
  } catch {
    setRootStatus(root, "error", "Access control data could not be loaded.")
  }
}

document.addEventListener("nav", async () => {
  const consoles = Array.from(document.querySelectorAll("[data-access-admin-console]"))
  for (const consoleNode of consoles) {
    await setupAccessAdminConsole(consoleNode as HTMLElement)
  }
})
