(function () {
  document.documentElement.classList.add("js");

  var playWeddingMusic = null;

  document.addEventListener(
    "WeixinJSBridgeReady",
    function () {
      if (playWeddingMusic) {
        playWeddingMusic();
      }
    },
    false
  );

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

  function initializeMusic() {
    var music = document.createElement("audio");
    var toggle = document.createElement("button");
    var entry = document.createElement("button");
    var userPaused = false;
    var unlockEvents = ["pointerdown", "touchstart", "keydown"];

    music.className = "wedding-music";
    music.src = "/wedding/assets/audio/shortcut-to-heaven.mp3";
    music.loop = true;
    music.autoplay = true;
    music.preload = "auto";
    music.volume = 0.46;
    music.setAttribute("playsinline", "");
    music.setAttribute("webkit-playsinline", "");

    toggle.className = "music-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "播放背景音乐");
    toggle.setAttribute("aria-pressed", "false");
    toggle.innerHTML = '<span class="music-toggle__disc" aria-hidden="true">♪</span>';

    entry.className = "music-entry";
    entry.type = "button";
    entry.hidden = true;
    entry.setAttribute("aria-label", "开启婚礼邀请函并播放背景音乐");
    entry.innerHTML =
      '<span class="music-entry__kicker">Wedding invitation</span>' +
      '<span class="music-entry__monogram">陈 &amp; 任</span>' +
      '<span class="music-entry__action">开启邀请函</span>' +
      '<span class="music-entry__hint">轻触开启音乐</span>';

    document.body.appendChild(music);
    document.body.appendChild(toggle);
    document.body.appendChild(entry);

    function showEntry() {
      if (userPaused || !entry.hidden) {
        return;
      }

      entry.hidden = false;
      document.documentElement.classList.add("music-entry-open");
    }

    function hideEntry() {
      entry.hidden = true;
      document.documentElement.classList.remove("music-entry-open");
    }

    function syncToggle() {
      var isPlaying = !music.paused;

      toggle.classList.toggle("is-playing", isPlaying);
      toggle.setAttribute("aria-pressed", String(isPlaying));
      toggle.setAttribute("aria-label", isPlaying ? "暂停背景音乐" : "播放背景音乐");
    }

    function requestPlayback() {
      var playback;

      if (userPaused) {
        return;
      }

      playback = music.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(function (error) {
          syncToggle();
          if (!error || error.name === "NotAllowedError") {
            showEntry();
          }
        });
      }
    }

    function removeUnlockListeners() {
      unlockEvents.forEach(function (eventName) {
        document.removeEventListener(eventName, unlockMusic, true);
      });
    }

    function unlockMusic(event) {
      if (toggle.contains(event.target)) {
        return;
      }

      requestPlayback();
      removeUnlockListeners();
    }

    toggle.addEventListener("click", function () {
      if (music.paused) {
        userPaused = false;
        requestPlayback();
      } else {
        userPaused = true;
        music.pause();
      }
    });

    entry.addEventListener("click", function () {
      userPaused = false;
      requestPlayback();
    });

    music.addEventListener("play", function () {
      syncToggle();
      hideEntry();
      removeUnlockListeners();
    });
    music.addEventListener("pause", syncToggle);
    music.addEventListener("error", function () {
      syncToggle();
      hideEntry();
    });

    unlockEvents.forEach(function (eventName) {
      document.addEventListener(eventName, unlockMusic, true);
    });

    playWeddingMusic = requestPlayback;
    requestPlayback();

    if (window.WeixinJSBridge && typeof window.WeixinJSBridge.invoke === "function") {
      window.WeixinJSBridge.invoke("getNetworkType", {}, requestPlayback);
    }
  }

  function initializePage() {
    initializeReveal();
    initializeConceptNav();
    initializeMusic();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage);
  } else {
    initializePage();
  }
})();
