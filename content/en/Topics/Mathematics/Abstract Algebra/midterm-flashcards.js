const deckRoot = document.querySelector("[data-deck]");

if (deckRoot) {
  const cards = Array.from(deckRoot.querySelectorAll("[data-card]"));
  const searchInput = document.getElementById("flashcardSearch");
  const chapterFilter = document.getElementById("chapterFilter");
  const typeFilter = document.getElementById("typeFilter");
  const visibleCount = document.getElementById("visibleCount");
  const totalCount = document.getElementById("totalCount");
  const focusLabel = document.getElementById("focusLabel");
  const resultsSummary = document.getElementById("resultsSummary");
  const emptyState = document.getElementById("emptyState");
  const presetButtons = Array.from(deckRoot.querySelectorAll("[data-preset]"));
  const showAllButton = document.getElementById("showAllCards");
  const flipVisibleButton = document.getElementById("flipVisibleCards");
  const resetCardsButton = document.getElementById("resetCards");
  const typeLabels = {
    Terminology: "Terminology",
    Definition: "Definitions",
    Theorem: "Theorems",
    "Proof Sketch": "Proof sketches",
    Example: "Examples",
    Counterexample: "Counterexamples",
  };

  const uniqueChapters = [...new Set(cards.map((card) => card.dataset.chapter ?? ""))]
    .filter(Boolean)
    .sort((left, right) => Number(left) - Number(right));

  const chapterLabels = new Map(
    uniqueChapters.map((chapter) => [chapter, `Chapter ${chapter.padStart(2, "0")}`]),
  );

  if (typeof window.renderMathInElement === "function") {
    window.renderMathInElement(deckRoot, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      throwOnError: false,
    });
  }

  const searchText = new Map(
    cards.map((card) => [
      card,
      (card.dataset.search ?? card.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase(),
    ]),
  );

  for (const chapter of uniqueChapters) {
    const option = document.createElement("option");
    option.value = chapter;
    option.textContent = chapterLabels.get(chapter) ?? chapter;
    chapterFilter?.append(option);
  }

  const setCardFlipState = (card, isFlipped) => {
    card.classList.toggle("is-flipped", isFlipped);
    const button = card.querySelector(".flashcard__button");
    button?.setAttribute("aria-pressed", String(isFlipped));
  };

  const describeFocus = () => {
    const chapter = chapterFilter?.value ?? "all";
    const type = typeFilter?.value ?? "all";

    if (chapter !== "all" && type !== "all") {
      return `${chapterLabels.get(chapter)} / ${type}`;
    }

    if (chapter !== "all") {
      return chapterLabels.get(chapter);
    }

    if (type !== "all") {
      return typeLabels[type] ?? type;
    }

    return "Show all";
  };

  const updatePresetState = () => {
    const activeType = typeFilter?.value ?? "all";

    for (const button of presetButtons) {
      const matches = (button.dataset.preset ?? "all") === activeType;
      button.classList.toggle("is-active", matches);
      button.setAttribute("aria-pressed", String(matches));
    }
  };

  const applyFilters = () => {
    const query = searchInput?.value.trim().toLowerCase() ?? "";
    const chapter = chapterFilter?.value ?? "all";
    const type = typeFilter?.value ?? "all";
    let visible = 0;

    for (const card of cards) {
      const matchesQuery = !query || (searchText.get(card) ?? "").includes(query);
      const matchesChapter = chapter === "all" || card.dataset.chapter === chapter;
      const matchesType = type === "all" || card.dataset.type === type;
      const isVisible = matchesQuery && matchesChapter && matchesType;
      card.hidden = !isVisible;
      visible += isVisible ? 1 : 0;
    }

    if (visibleCount) {
      visibleCount.textContent = String(visible);
    }

    if (totalCount) {
      totalCount.textContent = String(cards.length);
    }

    if (focusLabel) {
      focusLabel.textContent = describeFocus();
    }

    if (resultsSummary) {
      resultsSummary.textContent =
        visible === cards.length
          ? `${cards.length} cards spanning Chapters ${uniqueChapters[0]} through ${uniqueChapters.at(-1)}.`
          : `${visible} card${visible === 1 ? "" : "s"} match the current search and filter settings.`;
    }

    if (emptyState) {
      emptyState.hidden = visible !== 0;
    }

    updatePresetState();
  };

  for (const card of cards) {
    const button = card.querySelector(".flashcard__button");

    button?.addEventListener("click", () => {
      setCardFlipState(card, !card.classList.contains("is-flipped"));
    });
  }

  searchInput?.addEventListener("input", applyFilters);
  chapterFilter?.addEventListener("change", applyFilters);
  typeFilter?.addEventListener("change", applyFilters);

  for (const button of presetButtons) {
    button.addEventListener("click", () => {
      const preset = button.dataset.preset ?? "all";

      if (typeFilter) {
        typeFilter.value = preset;
      }

      applyFilters();
    });
  }

  showAllButton?.addEventListener("click", () => {
    if (searchInput) {
      searchInput.value = "";
    }

    if (chapterFilter) {
      chapterFilter.value = "all";
    }

    if (typeFilter) {
      typeFilter.value = "all";
    }

    applyFilters();
  });

  flipVisibleButton?.addEventListener("click", () => {
    for (const card of cards) {
      if (!card.hidden) {
        setCardFlipState(card, true);
      }
    }
  });

  resetCardsButton?.addEventListener("click", () => {
    for (const card of cards) {
      setCardFlipState(card, false);
    }
  });

  applyFilters();
}
