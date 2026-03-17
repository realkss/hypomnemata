type AccessAdminProvider = "google" | "instagram"
type MemberContentStatus = "draft" | "published"

type AccessAdminUser = {
  key: string
  name: string
  provider: AccessAdminProvider
  email?: string
  username?: string
  picture?: string
  blocked: boolean
  verified: boolean
  createdAt?: string
  lastSeenAt?: string
}

type AccessAdminPage = {
  slug: string
  title: string
  access: "restricted" | "owner"
  allowedIdentifiers: string[]
}

type AccessAdminEntry = {
  slug: string
  title: string
  summary: string
  body: string
  status: MemberContentStatus
  authorKey: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

type AccessAdminResponse = {
  ok: boolean
  storage: {
    configured: boolean
  }
  currentUser: {
    key: string
    name: string
    provider: AccessAdminProvider
    email?: string
    username?: string
  }
  users: AccessAdminUser[]
  pages: AccessAdminPage[]
  library?: {
    entries: AccessAdminEntry[]
  }
}

type AdminNotice = {
  tone: "neutral" | "success" | "error"
  message: string
}

function relativePath(slug: string) {
  return slug === "index" ? "/" : `/${slug.replace(/\/index$/, "/")}`
}

function memberLibraryPath(slug?: string) {
  return slug ? `/censorium/${encodeURIComponent(slug)}` : "/censorium"
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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
}

function parseUploadedDocument(rawText: string) {
  const normalized = rawText.replace(/^\uFEFF/, "")
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)

  if (!match) {
    return {
      body: normalized.trim(),
    }
  }

  const fields: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":")
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase()
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "")

    if (key) {
      fields[key] = value
    }
  }

  return {
    title: fields.title,
    summary: fields.summary ?? fields.description,
    slug: fields.slug,
    body: match[2].trim(),
  }
}

function describeUser(user: AccessAdminUser) {
  return user.email ?? (user.username ? `@${user.username}` : user.key)
}

function sortEntries(entries: AccessAdminEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "published" ? -1 : 1
    }

    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  })
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

async function updateUser(key: string, blocked: boolean, verified: boolean) {
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
      verified,
    }),
  })

  if (!response.ok) {
    throw new Error("user_update_failed")
  }
}

async function saveEntry(entry: {
  slug: string
  title: string
  summary: string
  body: string
  status: MemberContentStatus
}) {
  const response = await fetch(new URL("/api/member-content/admin/entries", window.location.origin), {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(entry),
  })

  if (!response.ok) {
    throw new Error("entry_save_failed")
  }
}

async function removeEntry(slug: string) {
  const response = await fetch(new URL("/api/member-content/admin/delete", window.location.origin), {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ slug }),
  })

  if (!response.ok) {
    throw new Error("entry_delete_failed")
  }
}

function renderSummary(root: HTMLElement, state: AccessAdminResponse) {
  const summary = root.querySelector("[data-access-admin-summary]") as HTMLElement | null
  if (!summary) {
    return
  }

  const libraryEntries = state.library?.entries ?? []
  const verifiedCount = state.users.filter((user) => user.verified && !user.blocked).length
  const publishedCount = libraryEntries.filter((entry) => entry.status === "published").length
  const draftCount = libraryEntries.filter((entry) => entry.status === "draft").length

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
      label: "Verified members",
      value: `${verifiedCount}`,
    },
    {
      label: "Restricted pages",
      value: `${state.pages.filter((page) => page.access === "restricted").length}`,
    },
    {
      label: "Member library",
      value: `${publishedCount} published / ${draftCount} draft`,
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
        : user.verified
          ? `${providerText} | ${user.provider} | verified`
          : `${providerText} | ${user.provider} | not verified`

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
  hint.textContent =
    "Signed-in users appear here automatically. Verified members can open the private library at /censorium, and blocked users lose all access."
  container.appendChild(hint)

  const list = document.createElement("div")
  list.className = "access-admin-console__user-list"

  for (const user of state.users) {
    const isOwner = user.key === state.currentUser.key
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
      describeUser(user),
      user.provider,
      `Last seen ${formatDate(user.lastSeenAt)}`,
    ].join(" | ")

    textWrap.append(name, meta)

    const badge = document.createElement("span")
    badge.className = "access-admin-console__badge"
    badge.textContent = isOwner
      ? "owner"
      : user.blocked
        ? "blocked"
        : user.verified
          ? "verified"
          : "pending"

    head.append(textWrap, badge)
    card.appendChild(head)

    const actions = document.createElement("div")
    actions.className = "access-admin-console__actions"

    const blockedToggle = document.createElement("label")
    blockedToggle.className = "access-admin-console__toggle"

    const blockedCheckbox = document.createElement("input")
    blockedCheckbox.type = "checkbox"
    blockedCheckbox.checked = user.blocked
    blockedCheckbox.disabled = isOwner

    const blockedText = document.createElement("span")
    blockedText.textContent = "Blocked"

    blockedToggle.append(blockedCheckbox, blockedText)

    const verifiedToggle = document.createElement("label")
    verifiedToggle.className = "access-admin-console__toggle"

    const verifiedCheckbox = document.createElement("input")
    verifiedCheckbox.type = "checkbox"
    verifiedCheckbox.checked = user.verified
    verifiedCheckbox.disabled = isOwner

    const verifiedText = document.createElement("span")
    verifiedText.textContent = "Verified"

    verifiedToggle.append(verifiedCheckbox, verifiedText)

    const saveButton = document.createElement("button")
    saveButton.className = "access-admin-console__button"
    saveButton.type = "button"
    saveButton.textContent = isOwner
      ? "Owner account"
      : state.storage.configured
        ? "Save user"
        : "KV required to save"
    saveButton.disabled = isOwner || !state.storage.configured

    const inlineStatus = document.createElement("span")
    inlineStatus.className = "access-admin-console__inline-status"
    if (isOwner) {
      inlineStatus.textContent = "Owner access is managed automatically."
    }

    saveButton.addEventListener("click", async () => {
      saveButton.disabled = true
      inlineStatus.textContent = "Saving..."

      try {
        await updateUser(user.key, blockedCheckbox.checked, verifiedCheckbox.checked)
        await setupAccessAdminConsole(root, {
          tone: "success",
          message: `Updated ${user.name}.`,
        })
      } catch {
        inlineStatus.textContent = "Could not save."
        setRootStatus(root, "error", `${user.name} could not be updated.`)
      } finally {
        saveButton.disabled = !state.storage.configured
      }
    })

    actions.append(blockedToggle, verifiedToggle, saveButton, inlineStatus)
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

function renderLibrary(root: HTMLElement, state: AccessAdminResponse, focusEntrySlug?: string) {
  const container = root.querySelector("[data-access-admin-library]") as HTMLElement | null
  if (!container) {
    return
  }

  const entries = sortEntries(state.library?.entries ?? [])
  let activeEntry = entries.find((entry) => entry.slug === focusEntrySlug) ?? null
  let slugManuallyEdited = Boolean(activeEntry)

  container.hidden = false
  container.replaceChildren()

  const title = document.createElement("h3")
  title.className = "access-admin-console__section-title"
  title.textContent = "Member library"
  container.appendChild(title)

  const hint = document.createElement("p")
  hint.className = "access-admin-console__hint"
  hint.textContent =
    "Upload Markdown notes here and publish them to /censorium. Only verified members and the owner can open published notes."
  container.appendChild(hint)

  const editor = document.createElement("div")
  editor.className = "access-admin-console__entry-editor"

  const editorTitle = document.createElement("h4")
  editorTitle.className = "access-admin-console__editor-title"
  editor.appendChild(editorTitle)

  const form = document.createElement("div")
  form.className = "access-admin-console__form"

  const split = document.createElement("div")
  split.className = "access-admin-console__split"

  const titleField = document.createElement("label")
  titleField.className = "access-admin-console__field"
  const titleLabel = document.createElement("strong")
  titleLabel.textContent = "Title"
  const titleInput = document.createElement("input")
  titleInput.className = "access-admin-console__input"
  titleInput.type = "text"
  titleInput.placeholder = "Member note title"
  titleField.append(titleLabel, titleInput)

  const slugField = document.createElement("label")
  slugField.className = "access-admin-console__field"
  const slugLabel = document.createElement("strong")
  slugLabel.textContent = "Slug"
  const slugInput = document.createElement("input")
  slugInput.className = "access-admin-console__input"
  slugInput.type = "text"
  slugInput.placeholder = "member-note-slug"
  slugField.append(slugLabel, slugInput)

  split.append(titleField, slugField)
  form.appendChild(split)

  const summaryField = document.createElement("label")
  summaryField.className = "access-admin-console__field"
  const summaryLabel = document.createElement("strong")
  summaryLabel.textContent = "Summary"
  const summaryInput = document.createElement("textarea")
  summaryInput.className = "access-admin-console__textarea"
  summaryInput.placeholder = "Optional short summary shown in the member library."
  summaryField.append(summaryLabel, summaryInput)
  form.appendChild(summaryField)

  const uploadField = document.createElement("label")
  uploadField.className = "access-admin-console__field"
  const uploadLabel = document.createElement("strong")
  uploadLabel.textContent = "Import Markdown file"
  const uploadInput = document.createElement("input")
  uploadInput.className = "access-admin-console__file"
  uploadInput.type = "file"
  uploadInput.accept = ".md,.markdown,.txt"
  const uploadHelp = document.createElement("span")
  uploadHelp.className = "access-admin-console__file-help"
  uploadHelp.textContent =
    "Frontmatter title, summary, and slug will be picked up automatically when present."
  uploadField.append(uploadLabel, uploadInput, uploadHelp)
  form.appendChild(uploadField)

  const bodyField = document.createElement("label")
  bodyField.className = "access-admin-console__field"
  const bodyLabel = document.createElement("strong")
  bodyLabel.textContent = "Markdown body"
  const bodyTextarea = document.createElement("textarea")
  bodyTextarea.className = "access-admin-console__textarea access-admin-console__textarea--body"
  bodyTextarea.placeholder = "# Title\n\nWrite your private note in Markdown."
  bodyField.append(bodyLabel, bodyTextarea)
  form.appendChild(bodyField)

  const actions = document.createElement("div")
  actions.className = "access-admin-console__actions"

  const draftButton = document.createElement("button")
  draftButton.className = "access-admin-console__button access-admin-console__button--ghost"
  draftButton.type = "button"
  draftButton.textContent = state.storage.configured ? "Save draft" : "KV required to save"
  draftButton.disabled = !state.storage.configured

  const publishButton = document.createElement("button")
  publishButton.className = "access-admin-console__button"
  publishButton.type = "button"
  publishButton.textContent = state.storage.configured ? "Publish now" : "KV required to publish"
  publishButton.disabled = !state.storage.configured

  const resetButton = document.createElement("button")
  resetButton.className = "access-admin-console__button access-admin-console__button--ghost"
  resetButton.type = "button"
  resetButton.textContent = "New note"

  const openLink = document.createElement("a")
  openLink.className = "access-admin-console__button access-admin-console__button--ghost"
  openLink.textContent = "Open note"
  openLink.target = "_blank"
  openLink.rel = "noreferrer"
  openLink.hidden = true

  const deleteButton = document.createElement("button")
  deleteButton.className = "access-admin-console__button access-admin-console__button--danger"
  deleteButton.type = "button"
  deleteButton.textContent = "Delete note"

  const inlineStatus = document.createElement("span")
  inlineStatus.className = "access-admin-console__inline-status"

  actions.append(draftButton, publishButton, resetButton, openLink, deleteButton, inlineStatus)
  form.appendChild(actions)

  editor.appendChild(form)
  container.appendChild(editor)

  const list = document.createElement("div")
  list.className = "access-admin-console__entry-list"
  container.appendChild(list)

  function syncOpenLink() {
    const slug = slugify(slugInput.value || titleInput.value)
    if (!slug) {
      openLink.hidden = true
      openLink.removeAttribute("href")
      return
    }

    openLink.hidden = false
    openLink.href = memberLibraryPath(slug)
  }

  function populateEditor(entry: AccessAdminEntry | null) {
    activeEntry = entry
    slugManuallyEdited = Boolean(entry)

    editorTitle.textContent = entry ? `Editing ${entry.title}` : "Compose a member note"
    titleInput.value = entry?.title ?? ""
    slugInput.value = entry?.slug ?? ""
    summaryInput.value = entry?.summary ?? ""
    bodyTextarea.value = entry?.body ?? ""
    deleteButton.hidden = entry == null
    inlineStatus.textContent = entry
      ? `${entry.status === "published" ? "Published" : "Draft"} | Updated ${formatDate(entry.updatedAt)}`
      : "Create a draft or publish immediately to /censorium."
    syncOpenLink()
  }

  async function persist(status: MemberContentStatus) {
    const slug = slugify(slugInput.value || titleInput.value)
    const title = titleInput.value.trim()
    const summary = summaryInput.value.trim()
    const body = bodyTextarea.value.trim()

    if (!title) {
      inlineStatus.textContent = "Title is required."
      setRootStatus(root, "error", "Please add a title before saving this note.")
      return
    }

    if (!slug) {
      inlineStatus.textContent = "Slug is required."
      setRootStatus(root, "error", "Please provide a slug for this note.")
      return
    }

    if (!body) {
      inlineStatus.textContent = "Body is required."
      setRootStatus(root, "error", "Please add Markdown content before saving this note.")
      return
    }

    draftButton.disabled = true
    publishButton.disabled = true
    deleteButton.disabled = true
    inlineStatus.textContent = status === "published" ? "Publishing..." : "Saving draft..."

    try {
      await saveEntry({ slug, title, summary, body, status })
      await setupAccessAdminConsole(
        root,
        {
          tone: "success",
          message:
            status === "published"
              ? `Published ${title} to ${memberLibraryPath(slug)}.`
              : `Saved ${title} as a draft.`,
        },
        slug,
      )
    } catch {
      draftButton.disabled = !state.storage.configured
      publishButton.disabled = !state.storage.configured
      deleteButton.disabled = activeEntry == null
      inlineStatus.textContent = "Could not save."
      setRootStatus(root, "error", `${title} could not be saved.`)
    }
  }

  titleInput.addEventListener("input", () => {
    if (!slugManuallyEdited) {
      slugInput.value = slugify(titleInput.value)
    }
    syncOpenLink()
  })

  slugInput.addEventListener("input", () => {
    slugManuallyEdited = true
    slugInput.value = slugify(slugInput.value)
    syncOpenLink()
  })

  uploadInput.addEventListener("change", async () => {
    const file = uploadInput.files?.[0]
    if (!file) {
      return
    }

    try {
      const parsed = parseUploadedDocument(await file.text())
      if (!titleInput.value && parsed.title) {
        titleInput.value = parsed.title
      }
      if (!summaryInput.value && parsed.summary) {
        summaryInput.value = parsed.summary
      }
      if (!slugManuallyEdited) {
        slugInput.value = slugify(parsed.slug ?? file.name.replace(/\.[^.]+$/, ""))
      }
      if (parsed.body) {
        bodyTextarea.value = parsed.body
      }
      inlineStatus.textContent = `Loaded ${file.name}.`
      syncOpenLink()
    } catch {
      inlineStatus.textContent = "That file could not be read."
    }
  })

  draftButton.addEventListener("click", async () => persist("draft"))
  publishButton.addEventListener("click", async () => persist("published"))

  resetButton.addEventListener("click", () => {
    uploadInput.value = ""
    populateEditor(null)
  })

  deleteButton.addEventListener("click", async () => {
    if (!activeEntry) {
      return
    }

    const confirmed = window.confirm(`Delete "${activeEntry.title}" from the member library?`)
    if (!confirmed) {
      return
    }

    draftButton.disabled = true
    publishButton.disabled = true
    deleteButton.disabled = true
    inlineStatus.textContent = "Deleting..."

    try {
      await removeEntry(activeEntry.slug)
      await setupAccessAdminConsole(root, {
        tone: "success",
        message: `Deleted ${activeEntry.title}.`,
      })
    } catch {
      draftButton.disabled = !state.storage.configured
      publishButton.disabled = !state.storage.configured
      deleteButton.disabled = false
      inlineStatus.textContent = "Could not delete."
      setRootStatus(root, "error", `${activeEntry.title} could not be deleted.`)
    }
  })

  for (const entry of entries) {
    const card = document.createElement("div")
    card.className = "access-admin-console__entry-card"

    const head = document.createElement("div")
    head.className = "access-admin-console__page-head"

    const textWrap = document.createElement("div")
    const heading = document.createElement("h4")
    heading.textContent = entry.title
    const slug = document.createElement("p")
    slug.className = "access-admin-console__slug"
    slug.textContent = memberLibraryPath(entry.slug)
    textWrap.append(heading, slug)

    const badge = document.createElement("span")
    badge.className = "access-admin-console__badge"
    badge.textContent = entry.status

    head.append(textWrap, badge)
    card.appendChild(head)

    if (entry.summary) {
      const summary = document.createElement("p")
      summary.className = "access-admin-console__entry-summary"
      summary.textContent = entry.summary
      card.appendChild(summary)
    }

    const meta = document.createElement("div")
    meta.className = "access-admin-console__entry-meta"
    meta.textContent = [
      `Updated ${formatDate(entry.updatedAt)}`,
      entry.publishedAt ? `Published ${formatDate(entry.publishedAt)}` : "Not published yet",
    ].join(" | ")
    card.appendChild(meta)

    const cardActions = document.createElement("div")
    cardActions.className = "access-admin-console__actions"

    const editButton = document.createElement("button")
    editButton.className = "access-admin-console__button access-admin-console__button--ghost"
    editButton.type = "button"
    editButton.textContent = "Edit"
    editButton.addEventListener("click", () => populateEditor(entry))

    const openButton = document.createElement("a")
    openButton.className = "access-admin-console__button access-admin-console__button--ghost"
    openButton.href = memberLibraryPath(entry.slug)
    openButton.target = "_blank"
    openButton.rel = "noreferrer"
    openButton.textContent = "Open"

    const deleteCardButton = document.createElement("button")
    deleteCardButton.className = "access-admin-console__button access-admin-console__button--danger"
    deleteCardButton.type = "button"
    deleteCardButton.textContent = "Delete"
    deleteCardButton.addEventListener("click", async () => {
      const confirmed = window.confirm(`Delete "${entry.title}" from the member library?`)
      if (!confirmed) {
        return
      }

      try {
        await removeEntry(entry.slug)
        await setupAccessAdminConsole(root, {
          tone: "success",
          message: `Deleted ${entry.title}.`,
        })
      } catch {
        setRootStatus(root, "error", `${entry.title} could not be deleted.`)
      }
    })

    cardActions.append(editButton, openButton, deleteCardButton)
    card.appendChild(cardActions)
    list.appendChild(card)
  }

  if (entries.length === 0) {
    const empty = document.createElement("p")
    empty.className = "access-admin-console__hint"
    empty.textContent = "No member notes exist yet. Publish one to open the private library."
    list.appendChild(empty)
  }

  populateEditor(activeEntry)
}

async function setupAccessAdminConsole(
  root: HTMLElement,
  notice?: AdminNotice,
  focusEntrySlug?: string,
) {
  setRootStatus(root, "neutral", "Loading access rules and member library...")

  try {
    const state = await fetchAdminState()
    renderSummary(root, state)
    renderPages(root, state)
    renderUsers(root, state)
    renderLibrary(root, state, focusEntrySlug)

    if (notice) {
      setRootStatus(root, notice.tone, notice.message)
      return
    }

    const storageMessage = state.storage.configured
      ? "Owner access console ready."
      : "Owner access console loaded. Bind ACCESS_CONTROL_KV to save page grants and member notes."
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
