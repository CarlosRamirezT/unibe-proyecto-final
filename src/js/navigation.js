(function () {
  const routes = {
    home: "./index.html",
    features: "./index.html",
    "stock markets": "./markets.html",
    brokers: "./brokers.html",
    "e-learning": "./courses.html",
    elearning: "./courses.html",
    news: "./news.html",
    "q&a": "./qa.html",
    qa: "./qa.html",
    forum: "./forum.html",
    pricing: "./pricing.html",
    login: "./login.html",
    signup: "./signup.html",
    "sign up": "./signup.html",
    "start trading": "./dashboard.html",
    trading: "./dashboard.html",
    "trading copilot": "./copilot.html",
    copilot: "./copilot.html"
  };

  const ctaRoutes = {
    "explore ai features": "./copilot.html",
    "start trading": "./dashboard.html",
    trading: "./dashboard.html",
    login: "./login.html",
    signup: "./signup.html",
    "sign up": "./signup.html",
    "create account": "./signup.html",
    register: "./signup.html",
    "trading copilot": "./copilot.html",
    "try copilot": "./copilot.html",
    "stock markets": "./markets.html",
    brokers: "./brokers.html",
    forum: "./forum.html",
    news: "./news.html",
    pricing: "./pricing.html"
  };

  function normalize(text) {
    return (text || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[\n\r\t]/g, "")
      .trim();
  }

  function toAbsoluteHref(path) {
    return new URL(path, window.location.href).href;
  }

  function routeForText(text, map) {
    const key = normalize(text);
    return map[key] || null;
  }

  function wireAnchors() {
    const anchors = document.querySelectorAll("a");
    anchors.forEach((anchor) => {
      const href = anchor.getAttribute("href");
      const text = normalize(anchor.textContent);
      const mapped = routeForText(text, routes);

      if (anchor.closest("#header") && (href === "#" || href === "" || href == null) && mapped) {
        anchor.setAttribute("href", mapped);
      }

      if (anchor.closest("#header") && (href === "#" || href === "" || href == null) && !text) {
        anchor.setAttribute("href", "./index.html");
      }
    });
  }

  function wireButtons() {
    const buttons = document.querySelectorAll("button, a");
    buttons.forEach((el) => {
      const text = normalize(el.textContent);
      const mapped = routeForText(text, ctaRoutes);
      if (!mapped) {
        return;
      }

      if (el.tagName === "A") {
        const href = el.getAttribute("href");
        if (href === "#" || href === "" || href == null) {
          el.setAttribute("href", mapped);
        }
        return;
      }

      if (el.tagName === "BUTTON") {
        const type = (el.getAttribute("type") || "button").toLowerCase();
        if (type === "submit") {
          return;
        }
        if (!el.dataset.navBound) {
          el.dataset.navBound = "1";
          el.addEventListener("click", function () {
            window.location.href = mapped;
          });
        }
      }
    });
  }

  function markActiveNav() {
    const current = window.location.pathname.split("/").pop() || "index.html";
    const currentAbs = toAbsoluteHref("./" + current);
    document.querySelectorAll("#header nav a").forEach((anchor) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") {
        return;
      }
      const isCurrent = toAbsoluteHref(href) === currentAbs;
      if (isCurrent) {
        anchor.classList.remove("text-textSecondary");
        anchor.classList.add("text-accent", "font-medium");
        if (!anchor.classList.contains("border-b-2")) {
          anchor.classList.add("border-b-2", "border-accent", "pb-1");
        }
      }
    });
  }

  wireAnchors();
  wireButtons();
  markActiveNav();
})();
