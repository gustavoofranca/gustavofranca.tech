(function () {
  const path = location.pathname;
  const locale = /^\/en(\/|$)/.test(path) ? "en" : "pt";
  document.documentElement.lang = locale === "en" ? "en" : "pt-BR";
  document.querySelectorAll("[data-locale]").forEach(function (block) {
    if (block.getAttribute("data-locale") === locale) {
      block.hidden = false;
    } else {
      block.remove();
    }
  });
  document.querySelectorAll("[data-path]").forEach(function (el) {
    el.textContent = path;
  });
})();
