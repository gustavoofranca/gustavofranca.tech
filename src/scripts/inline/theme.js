(function () {
  let stored = null;
  try {
    stored = localStorage.getItem("gf-theme");
  } catch {
    // Storage bloqueado: segue o sistema.
  }
  const dark =
    stored === "dark" ||
    (stored !== "light" &&
      (!window.matchMedia ||
        matchMedia("(prefers-color-scheme: dark)").matches));
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
})();
