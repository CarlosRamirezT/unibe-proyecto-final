(function () {
  const routes = {
    home: "./index.html",
    features: "./index.html",
    "quantum chart": "./index.html",
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
    "help center": "./qa.html",
    "contact us": "./qa.html",
    support: "./qa.html",
    "privacy policy": "./qa.html",
    "terms of service": "./qa.html",
    "cookie policy": "./qa.html",
    disclaimer: "./qa.html",
    "market analysis": "./markets.html",
    "portfolio tracking": "./dashboard.html",
    "mis acciones": "./my-stocks.html",
    "my stocks": "./my-stocks.html",
    "seleccionar acciones": "./select-stocks.html",
    "select stocks": "./select-stocks.html",
    "api access": "./pricing.html",
    subscribe: "./news.html",
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
    if (normalized.includes("mis acciones") || normalized.includes("my stocks")) {
      return "./my-stocks.html";
    }
    if (normalized.includes("seleccionar acciones") || normalized.includes("select stocks")) {
      return "./select-stocks.html";
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
      const iconMapped = inferSocialHref(anchor);

      if (hasPlaceholderHref && mapped) {
        anchor.setAttribute("href", mapped);
      }

      if (hasPlaceholderHref && iconMapped) {
        anchor.setAttribute("href", iconMapped);
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noreferrer noopener");
      }

      if (hasPlaceholderHref && !text && anchor.closest("#header")) {
        anchor.setAttribute("href", "./index.html");
      }

      if (hasPlaceholderHref && anchor.closest("#footer") && !anchor.getAttribute("href")) {
        anchor.setAttribute("href", "./index.html#footer");
      }

      if ((anchor.getAttribute("href") === "#" || anchor.getAttribute("href") === "") && anchor.closest("#footer")) {
        anchor.setAttribute("href", "./index.html#footer");
      }
    });
  }

  function inferSocialHref(anchor) {
    const icon = anchor.querySelector("i");
    if (!icon) {
      return null;
    }
    const classes = icon.className;
    if (classes.includes("fa-facebook")) {
      return "https://facebook.com";
    }
    if (classes.includes("fa-twitter")) {
      return "https://x.com";
    }
    if (classes.includes("fa-instagram")) {
      return "https://instagram.com";
    }
    if (classes.includes("fa-linkedin")) {
      return "https://linkedin.com";
    }
    if (classes.includes("fa-youtube")) {
      return "https://youtube.com";
    }
    return null;
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
    document.querySelectorAll("#header nav a, .qc-mobile-nav-link").forEach((anchor) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") {
        return;
      }
      const isCurrent = toAbsoluteHref(href) === currentAbs;
      if (isCurrent) {
        if (anchor.classList.contains("qc-mobile-nav-link")) {
          anchor.classList.add("is-active");
        } else {
          anchor.classList.remove("text-textSecondary");
          anchor.classList.add("text-accent", "font-medium");
          if (!anchor.classList.contains("border-b-2")) {
            anchor.classList.add("border-b-2", "border-accent", "pb-1");
          }
        }
      }
    });
  }

  function buildMobileNav() {
    const header = document.querySelector("#header");
    if (!header || document.querySelector(".qc-mobile-nav-toggle")) {
      return;
    }

    const nav = header.querySelector("nav");
    if (!nav) {
      return;
    }

    const desktopAnchors = Array.from(nav.querySelectorAll("a"));
    if (!desktopAnchors.length) {
      return;
    }

    const rightSection = header.querySelector(".flex.items-center.space-x-4");
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "qc-mobile-nav-toggle";
    toggle.setAttribute("aria-label", "Open navigation menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';

    if (rightSection) {
      rightSection.insertBefore(toggle, rightSection.firstChild);
    } else {
      header.appendChild(toggle);
    }

    const backdrop = document.createElement("div");
    backdrop.className = "qc-mobile-nav-backdrop";

    const drawer = document.createElement("aside");
    drawer.className = "qc-mobile-nav-drawer";
    drawer.setAttribute("aria-hidden", "true");

    const closeLabel =
      (header.querySelector(".text-2xl.font-bold") && header.querySelector(".text-2xl.font-bold").textContent.trim()) ||
      "Menu";

    const linksHtml = desktopAnchors
      .map((a) => {
        const href = a.getAttribute("href") || "./index.html";
        const label = a.textContent.replace(/\s+/g, " ").trim();
        return '<a class="qc-mobile-nav-link" href="' + href + '">' + label + "</a>";
      })
      .join("");

    drawer.innerHTML =
      '<div class="qc-mobile-nav-head">' +
      '<span class="qc-mobile-nav-title">' + closeLabel + "</span>" +
      '<button type="button" class="qc-mobile-nav-close" aria-label="Close navigation menu">' +
      '<i class="fa-solid fa-xmark"></i>' +
      "</button>" +
      "</div>" +
      '<div class="qc-mobile-nav-links">' +
      linksHtml +
      "</div>";

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    const closeBtn = drawer.querySelector(".qc-mobile-nav-close");

    function openMenu() {
      document.body.classList.add("qc-mobile-nav-open");
      toggle.setAttribute("aria-expanded", "true");
      drawer.setAttribute("aria-hidden", "false");
    }

    function closeMenu() {
      document.body.classList.remove("qc-mobile-nav-open");
      toggle.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
    }

    toggle.addEventListener("click", function () {
      if (document.body.classList.contains("qc-mobile-nav-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    closeBtn.addEventListener("click", closeMenu);
    backdrop.addEventListener("click", closeMenu);

    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) {
        closeMenu();
      }
    });
  }

  function applyAuthState() {
    const token = localStorage.getItem('qc_auth_token');
    const header = document.querySelector('#header');
    if (!header) return;

    // Find the Login anchor in the header right section
    const loginAnchor = Array.from(header.querySelectorAll('a')).find(function (a) {
      return a.textContent.replace(/\s+/g, ' ').trim().toLowerCase() === 'login';
    });

    if (token) {
      // Hide Login link
      if (loginAnchor) {
        loginAnchor.style.display = 'none';
      }

      // Get user initials from stored user data
      let initial = 'U';
      try {
        const userData = JSON.parse(localStorage.getItem('qc_auth_user') || '{}');
        const email = userData.email || userData.Email || '';
        if (email) {
          initial = email.charAt(0).toUpperCase();
        }
      } catch (_) {}

      // Avoid inserting twice
      if (header.querySelector('.qc-user-avatar-btn')) return;

      // Build avatar button + dropdown
      const rightSection = loginAnchor
        ? loginAnchor.parentElement
        : header.querySelector('.flex.items-center.space-x-4');
      if (!rightSection) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'qc-avatar-wrapper';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'qc-user-avatar-btn';
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = initial;

      const dropdown = document.createElement('div');
      dropdown.className = 'qc-avatar-dropdown';
      dropdown.setAttribute('role', 'menu');
      dropdown.innerHTML =
        '<button type="button" class="qc-avatar-menu-item" disabled>Perfil</button>' +
        '<button type="button" class="qc-avatar-menu-item" disabled>Configuraci\u00f3n</button>' +
        '<hr class="qc-avatar-menu-divider">' +
        '<button type="button" class="qc-avatar-menu-item qc-logout-btn">Log Out</button>';

      wrapper.appendChild(btn);
      wrapper.appendChild(dropdown);

      // Insert before the first button sibling or append
      const firstBtn = rightSection.querySelector('button');
      if (firstBtn) {
        rightSection.insertBefore(wrapper, firstBtn);
      } else {
        rightSection.appendChild(wrapper);
      }

      // Toggle dropdown visibility
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('qc-avatar-dropdown--open');
        dropdown.classList.toggle('qc-avatar-dropdown--open', !isOpen);
        btn.setAttribute('aria-expanded', String(!isOpen));
      });

      document.addEventListener('click', function () {
        dropdown.classList.remove('qc-avatar-dropdown--open');
        btn.setAttribute('aria-expanded', 'false');
      });

      dropdown.querySelector('.qc-logout-btn').addEventListener('click', function () {
        localStorage.removeItem('qc_auth_token');
        localStorage.removeItem('qc_auth_user');
        localStorage.removeItem('qc_terms_modal_pending');
        window.location.href = './login.html';
      });
    } else {
      // Ensure Login is visible when not authenticated
      if (loginAnchor) {
        loginAnchor.style.display = '';
      }
    }
  }

  wireAnchors();
  wireButtons();
  buildMobileNav();
  markActiveNav();
  applyAuthState();
})();
