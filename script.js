/* ============================================================
   Patrick Thompson — Cloud Engineer Portfolio
   Vanilla JavaScript: theme toggle, scroll reveals, nav state,
   back-to-top, and live GitHub repository loading.
   ============================================================ */

(function () {
  "use strict";

  const GITHUB_USER = "Pattson22";
  // Repos already showcased in the curated "Featured Projects" grid.
  const FEATURED = new Set([
    "cloudhub",
    "crypto-api",
    "group-chat-app",
    "simple_shell",
    "pattson22.github.io",
  ]);

  const LANG_COLORS = {
    HCL: "#844fba",
    Python: "#3572A5",
    C: "#555555",
    HTML: "#e34c26",
    JavaScript: "#f1e05a",
    Shell: "#89e051",
    Dockerfile: "#384d54",
    TypeScript: "#3178c6",
  };

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("pt-theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);

  themeToggle.addEventListener("click", function () {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("pt-theme", next);
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Navbar scroll state + back to top ---------- */
  const nav = document.querySelector(".nav");
  const toTop = document.getElementById("toTop");
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 20);
    toTop.classList.toggle("show", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll reveal ---------- */
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 80 + "ms";
    observer.observe(el);
  });

  /* ---------- Live GitHub repositories ---------- */
  const repoGrid = document.getElementById("repoGrid");

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function renderRepos(repos) {
    if (!repos.length) {
      repoGrid.innerHTML =
        '<div class="repo-error"><i data-lucide="info"></i> No additional public repositories found.</div>';
      window.lucide && window.lucide.createIcons();
      return;
    }
    repoGrid.innerHTML = repos
      .map(function (r) {
        const color = LANG_COLORS[r.language] || "#ff9900";
        const desc = r.description
          ? escapeHtml(r.description)
          : "A public repository on my GitHub profile.";
        return (
          '<a class="repo-card" href="' +
          r.html_url +
          '" target="_blank" rel="noopener" data-testid="repo-' +
          escapeHtml(r.name) +
          '">' +
          '<div class="repo-card-top"><i data-lucide="git-branch"></i><h4>' +
          escapeHtml(r.name) +
          "</h4></div>" +
          "<p>" +
          desc +
          "</p>" +
          '<div class="repo-meta">' +
          (r.language
            ? '<span class="repo-lang"><span class="lang-dot" style="background:' +
              color +
              '"></span>' +
              escapeHtml(r.language) +
              "</span>"
            : "") +
          '<span class="repo-lang"><i data-lucide="star" style="width:13px;height:13px"></i>' +
          r.stargazers_count +
          "</span>" +
          "<span>" +
          formatDate(r.updated_at) +
          "</span>" +
          "</div></a>"
        );
      })
      .join("");
    window.lucide && window.lucide.createIcons();
  }

  fetch(
    "https://api.github.com/users/" +
      GITHUB_USER +
      "/repos?sort=updated&per_page=100"
  )
    .then(function (res) {
      if (!res.ok) throw new Error("GitHub API " + res.status);
      return res.json();
    })
    .then(function (data) {
      const repos = data
        .filter(function (r) {
          return !r.fork && !FEATURED.has(r.name.toLowerCase());
        })
        .slice(0, 6);
      renderRepos(repos);
    })
    .catch(function (err) {
      repoGrid.innerHTML =
        '<div class="repo-error"><i data-lucide="alert-triangle"></i> Could not load repositories right now. Visit <a href="https://github.com/' +
        GITHUB_USER +
        '" target="_blank" rel="noopener" style="color:var(--orange);margin-left:4px">github.com/' +
        GITHUB_USER +
        "</a></div>";
      window.lucide && window.lucide.createIcons();
      console.warn("GitHub fetch failed:", err);
    });

  /* ---------- Render icons ---------- */
  window.addEventListener("load", function () {
    window.lucide && window.lucide.createIcons();
  });
  window.lucide && window.lucide.createIcons();
})();
