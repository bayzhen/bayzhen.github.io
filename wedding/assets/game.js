(function () {
  function initializeWeddingGame() {
    var shell = document.querySelector("[data-game-shell]");
    var game = document.querySelector("[data-star-game]");
    var invitation = document.querySelector("[data-game-invitation]");
    var status = document.querySelector("[data-game-status]");
    var announcement = document.querySelector("[data-game-announcement]");
    var stars = Array.prototype.slice.call(document.querySelectorAll(".game-star"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-progress-dot]"));
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var litCount = 0;

    if (!shell || !game || !invitation || !status || stars.length === 0) {
      return;
    }

    function revealInvitation() {
      shell.classList.add("is-complete");
      game.setAttribute("aria-hidden", "true");
      invitation.hidden = false;

      window.requestAnimationFrame(function () {
        invitation.classList.add("is-visible");
        document.getElementById("invitation-title").focus({ preventScroll: true });
      });
    }

    stars.forEach(function (star) {
      star.addEventListener("click", function () {
        var word;

        if (star.classList.contains("is-lit")) {
          return;
        }

        word = star.getAttribute("data-word");
        litCount += 1;
        star.classList.add("is-lit");
        star.setAttribute("aria-pressed", "true");
        star.setAttribute("aria-label", word + "之星已点亮");
        dots[litCount - 1].classList.add("is-lit");
        status.textContent = "已点亮 " + litCount + " / " + stars.length;
        announcement.textContent = word + "之星已点亮";

        if (litCount === stars.length) {
          status.textContent = "星光已集齐";
          announcement.textContent = "三颗星已全部点亮，婚礼邀请已开启";
          window.setTimeout(revealInvitation, reduceMotion ? 80 : 620);
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWeddingGame);
  } else {
    initializeWeddingGame();
  }
})();
