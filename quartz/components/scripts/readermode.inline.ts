let isReaderMode = false

const emitReaderModeChangeEvent = (mode: "on" | "off") => {
  const event: CustomEventMap["readermodechange"] = new CustomEvent("readermodechange", {
    detail: { mode },
  })
  document.dispatchEvent(event)
}

document.addEventListener("nav", () => {
  const switchReaderMode = () => {
    isReaderMode = !isReaderMode
    const newMode = isReaderMode ? "on" : "off"
    document.documentElement.setAttribute("reader-mode", newMode)
    emitReaderModeChangeEvent(newMode)
  }

  for (const readerModeButton of document.getElementsByClassName("readermode")) {
    readerModeButton.addEventListener("click", switchReaderMode)
    window.addCleanup(() => readerModeButton.removeEventListener("click", switchReaderMode))
  }

  // Keyboard shortcut: Alt+R to toggle reader mode
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.altKey && e.key === "r") {
      e.preventDefault()
      switchReaderMode()
    }
  }
  document.addEventListener("keydown", handleKeydown)
  window.addCleanup(() => document.removeEventListener("keydown", handleKeydown))

  // Set initial state
  document.documentElement.setAttribute("reader-mode", isReaderMode ? "on" : "off")
})
