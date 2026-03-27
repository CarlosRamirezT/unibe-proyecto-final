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
    "q&a platform": "./qa.html",
    qa: "./qa.html",
    forum: "./forum.html",
    "trading forum": "./forum.html",
    pricing: "./pricing.html",
    "premium plans": "./pricing.html",
    login: "./login.html",
    signup: "./signup.html",
    "sign up": "./signup.html",
    "create account": "./signup.html",
    "start trading": "./dashboard.html",
    "start trading dr": "./dashboard.html",
    trading: "./dashboard.html",
    "trading copilot": "./copilot.html",
    copilot: "./copilot.html"
  };

  const ctaRoutes = {
    "explore ai features": "./copilot.html",
    "start trading": "./dashboard.html",
    "start trading dr": "./dashboard.html",
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

  const mergedRoutes = Object.assign({}, routes, ctaRoutes);

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

  function inferRouteFromText(text) {
    const normalized = normalize(text);
    if (!normalized) {
      return null;
    }

    if (mergedRoutes[normalized]) {
      return mergedRoutes[normalized];
    }

    if (normalized.includes("trading copilot")) {
      return "./copilot.html";
    }
    if (normalized.includes("stock market")) {
      return "./markets.html";
    }
    if (normalized.includes("broker")) {
      return "./brokers.html";
    }
    if (normalized.includes("e-learning") || normalized.includes("elearning") || normalized.includes("course")) {
      return "./courses.html";
    }
    if (normalized.includes("news")) {
      return "./news.html";
    }
    if (normalized.includes("q&a") || normalized.includes("qa")) {
      return "./qa.html";
    }
    if (normalized.includes("forum")) {
      return "./forum.html";
    }
    if (normalized.includes("pricing") || normalized.includes("plan")) {
      return "./pricing.html";
    }
    if (normalized.includes("login") || normalized.includes("sign in")) {
      return "./login.html";
    }
    if (normalized.includes("sign up") || normalized.includes("signup") || normalized.includes("register")) {
      return "./signup.html";
    }
    if (normalized.includes("start trading") || normalized === "trading") {
      return "./dashboard.html";
    }
    if (normalized === "home") {
      return "./index.html";
    }

    return null;
  }

  function wireAnchors() {
    const anchors = document.querySelectorAll("a");
    anchors.forEach((anchor) => {
      const href = anchor.getAttribute("href");
      const text = normalize(anchor.textContent);
      const mapped = routeForText(text, mergedRoutes) || inferRouteFromText(text);
      const hasPlaceholderHref = href === "#" || href === "" || href == null;

      if (hasPlaceholderHref && mapped) {
        anchor.setAttribute("href", mapped);
      }

      if (hasPlaceholderHref && !text && anchor.closest("#header")) {
        anchor.setAttribute("href", "./index.html");
      }
    });
  }

  function wireButtons() {
    const buttons = document.querySelectorAll("button, a");
    buttons.forEach((el) => {
      const text = normalize(el.textContent);
      const mapped = routeForText(text, ctaRoutes) || inferRouteFromText(text);
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
