document.addEventListener("nav", () => {
  const hamburger = document.querySelector(".site-masthead__hamburger") as HTMLButtonElement | null
  const drawer = document.getElementById("masthead-mobile-menu")
  if (!hamburger || !drawer) return

  const toggle = () => {
    const expanded = hamburger.getAttribute("aria-expanded") === "true"
    hamburger.setAttribute("aria-expanded", String(!expanded))
    drawer.setAttribute("aria-hidden", String(expanded))
    hamburger.classList.toggle("is-open", !expanded)
  }

  const close = () => {
    hamburger.setAttribute("aria-expanded", "false")
    drawer.setAttribute("aria-hidden", "true")
    hamburger.classList.remove("is-open")
  }

  hamburger.addEventListener("click", toggle)

  // Close drawer when a link inside is clicked
  for (const link of drawer.querySelectorAll("a")) {
    link.addEventListener("click", close)
  }

  // Close on Escape
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && hamburger.getAttribute("aria-expanded") === "true") {
      close()
      hamburger.focus()
    }
  }
  document.addEventListener("keydown", handleEscape)

  window.addCleanup(() => {
    hamburger.removeEventListener("click", toggle)
    document.removeEventListener("keydown", handleEscape)
  })
})
