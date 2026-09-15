(function () {
  document.documentElement.classList.add("js");

  function initializeReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initializeConceptNav() {
    var nav = document.querySelector(".concept-nav");
    var narrowScreen = window.matchMedia("(max-width: 540px)");

    if (!nav) {
      return;
    }

    var lastScrollY = window.scrollY;

    function showNav() {
      nav.classList.remove("is-hidden");
    }

    function updateNav() {
      var currentScrollY = window.scrollY;
      var delta = currentScrollY - lastScrollY;

      if (!narrowScreen.matches || currentScrollY < 96 || nav.contains(document.activeElement)) {
        showNav();
      } else if (delta > 8) {
        nav.classList.add("is-hidden");
      } else if (delta < -8) {
        showNav();
      }

      lastScrollY = currentScrollY;
    }

    window.addEventListener("scroll", updateNav, { passive: true });

    nav.addEventListener("focusin", showNav);
    narrowScreen.addEventListener("change", showNav);
  }

  function initializePage() {
    initializeReveal();
    initializeConceptNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage);
  } else {
    initializePage();
  }
})();
