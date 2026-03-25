(function () {
  const slides = [
    { href: "index.html", label: "1" },
    { href: "2.html", label: "2" },
    { href: "3.html", label: "3" },
    { href: "4.html", label: "4" },
    { href: "5.html", label: "5" },
    { href: "6.html", label: "6" }
  ];

  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  let currentIndex = slides.findIndex((slide) => slide.href === currentFile);

  if (currentIndex === -1 && /\/$/.test(window.location.pathname)) {
    currentIndex = 0;
  }

  if (currentIndex === -1 || !document.body) {
    return;
  }

  const goTo = (index) => {
    if (index < 0 || index >= slides.length || index === currentIndex) {
      return;
    }

    window.location.href = slides[index].href;
  };

  const isTypingTarget = (target) => {
    if (!target) {
      return false;
    }

    const tagName = target.tagName;
    return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || target.isContentEditable;
  };

  const createLink = ({ label, href, disabled, active, title }) => {
    const element = document.createElement(disabled ? "span" : "a");
    element.className = "slide-nav__link";
    element.textContent = label;

    if (title) {
      element.title = title;
      element.setAttribute("aria-label", title);
    }

    if (active) {
      element.classList.add("is-active");
      element.setAttribute("aria-current", "page");
    }

    if (disabled) {
      element.classList.add("is-disabled");
      element.setAttribute("aria-disabled", "true");
      return element;
    }

    element.href = href;
    return element;
  };

  const nav = document.createElement("nav");
  nav.className = "slide-nav";
  nav.setAttribute("aria-label", "Navigation des slides");

  const previous = createLink({
    label: "Prec.",
    href: slides[Math.max(0, currentIndex - 1)].href,
    disabled: currentIndex === 0,
    title: "Slide precedente"
  });

  const next = createLink({
    label: "Suiv.",
    href: slides[Math.min(slides.length - 1, currentIndex + 1)].href,
    disabled: currentIndex === slides.length - 1,
    title: "Slide suivante"
  });

  const status = document.createElement("span");
  status.className = "slide-nav__status";
  status.textContent = (currentIndex + 1) + "/" + slides.length;
  status.setAttribute("aria-hidden", "true");

  const pages = document.createElement("div");
  pages.className = "slide-nav__pages";

  slides.forEach((slide, index) => {
    pages.appendChild(
      createLink({
        label: slide.label,
        href: slide.href,
        active: index === currentIndex,
        title: "Aller a la slide " + slide.label
      })
    );
  });

  nav.appendChild(previous);
  nav.appendChild(status);
  nav.appendChild(pages);
  nav.appendChild(next);
  document.body.appendChild(nav);

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      goTo(currentIndex + 1);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      goTo(currentIndex - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      goTo(slides.length - 1);
    }
  });
})();
