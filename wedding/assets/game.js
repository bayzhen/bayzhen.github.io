(function () {
  function createEffects(canvas) {
    var context = canvas.getContext("2d");
    var particles = [];
    var frame = 0;
    var width = 0;
    var height = 0;
    var ratio = 1;

    function resize() {
      var rect = canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function drawStar(particle) {
      var outer = particle.size;
      var inner = outer * 0.28;
      var index;
      var angle;
      var radius;

      context.beginPath();
      for (index = 0; index < 8; index += 1) {
        angle = Math.PI / 4 * index - Math.PI / 2;
        radius = index % 2 === 0 ? outer : inner;
        if (index === 0) {
          context.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        } else {
          context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
      }
      context.closePath();
      context.fill();
    }

    function animate() {
      var next = [];

      context.clearRect(0, 0, width, height);
      particles.forEach(function (particle) {
        particle.life -= 1;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.rotation += particle.spin;

        if (particle.life <= 0) {
          return;
        }

        context.save();
        context.globalAlpha = Math.min(1, particle.life / 18);
        context.fillStyle = particle.color;
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);

        if (particle.kind === "petal") {
          context.beginPath();
          context.ellipse(0, 0, particle.size * 1.5, particle.size * 0.65, 0, 0, Math.PI * 2);
          context.fill();
        } else {
          drawStar(particle);
        }

        context.restore();
        next.push(particle);
      });

      particles = next;
      if (particles.length) {
        frame = window.requestAnimationFrame(animate);
      } else {
        frame = 0;
      }
    }

    function burst(clientX, clientY, kind, count) {
      var rect = canvas.getBoundingClientRect();
      var colors = kind === "petal"
        ? ["#f4c4c1", "#e89f9b", "#f3ddd2", "#c45d65"]
        : ["#ffe7a8", "#d8bd7d", "#fff7dc", "#c7a86b"];
      var amount = count || 24;
      var index;
      var angle;
      var speed;

      for (index = 0; index < amount; index += 1) {
        angle = Math.random() * Math.PI * 2;
        speed = 0.9 + Math.random() * 3.1;
        particles.push({
          x: clientX - rect.left,
          y: clientY - rect.top,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (kind === "petal" ? 1.2 : 0),
          gravity: kind === "petal" ? 0.055 : 0.025,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.2,
          size: 2.2 + Math.random() * 3.8,
          life: 34 + Math.random() * 32,
          color: colors[Math.floor(Math.random() * colors.length)],
          kind: kind
        });
      }

      if (!frame) {
        frame = window.requestAnimationFrame(animate);
      }
    }

    function shower() {
      var index;

      for (index = 0; index < 76; index += 1) {
        window.setTimeout(function () {
          burst(
            width * (0.12 + Math.random() * 0.76),
            height * (0.12 + Math.random() * 0.34),
            Math.random() > 0.45 ? "petal" : "star",
            3
          );
        }, index * 16);
      }
    }

    resize();
    window.addEventListener("resize", resize);

    return {
      burst: burst,
      shower: shower,
      resize: resize
    };
  }

  function initializeWeddingGame() {
    var shell = document.querySelector("[data-tree-game]");
    var viewport = document.querySelector("[data-tree-viewport]");
    var seed = document.querySelector("[data-seed]");
    var bloomButtons = Array.prototype.slice.call(document.querySelectorAll("[data-bloom]"));
    var stars = Array.prototype.slice.call(document.querySelectorAll("[data-hidden-star]"));
    var skip = document.querySelector("[data-skip-game]");
    var openButton = document.querySelector("[data-open-invitation]");
    var closeButtons = Array.prototype.slice.call(document.querySelectorAll("[data-close-invitation]"));
    var replay = document.querySelector("[data-replay-game]");
    var dialog = document.querySelector("[data-invitation-dialog]");
    var prompt = document.querySelector("[data-stage-prompt]");
    var stageLabel = document.querySelector("[data-stage-label]");
    var memory = document.querySelector("[data-tree-memory]");
    var progressLabel = document.querySelector("[data-progress-label]");
    var progressDots = Array.prototype.slice.call(document.querySelectorAll(".tree-progress i"));
    var dragHint = document.querySelector("[data-drag-hint]");
    var announcement = document.querySelector("[data-game-announcement]");
    var canvas = document.querySelector("[data-effect-canvas]");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var effects;
    var stage = "seed";
    var bloomCount = 0;
    var starCount = 0;
    var viewAngle = 0;
    var dragging = false;
    var dragMoved = false;
    var dragStartX = 0;
    var dragStartAngle = 0;
    var invitationTimer = 0;
    var transitionTimer = 0;
    var lastFocus = null;
    var memories = {
      left: "相遇 · 故事从一束光开始",
      crown: "相知 · 平凡日子有了共同方向",
      right: "相守 · 从此共赴岁岁年年"
    };

    if (!shell || !viewport || !seed || !dialog || !canvas) {
      return;
    }

    effects = createEffects(canvas);

    function vibrate(duration) {
      if (navigator.vibrate) {
        navigator.vibrate(duration || 18);
      }
    }

    function setProgress(index, text) {
      progressLabel.textContent = "0" + index + " / 04";
      progressDots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex < index);
      });
      if (text) {
        announcement.textContent = text;
      }
    }

    function setStage(nextStage) {
      stage = nextStage;
      shell.setAttribute("data-stage", nextStage);
    }

    function setPrompt(label, text) {
      stageLabel.textContent = label;
      prompt.innerHTML = text;
    }

    function buttonCenter(button) {
      var rect = button.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }

    function updateStarVisibility() {
      stars.forEach(function (star) {
        var target = Number(star.getAttribute("data-angle"));
        var visible = Math.abs(viewAngle - target) < 0.3;

        if (star.classList.contains("is-found")) {
          star.hidden = false;
          star.classList.add("is-visible");
          star.tabIndex = -1;
          return;
        }

        star.hidden = false;
        star.classList.toggle("is-visible", visible);
        star.tabIndex = visible ? 0 : -1;
      });
    }

    function setViewAngle(value) {
      viewAngle = Math.max(-1, Math.min(1, value));
      shell.style.setProperty("--tree-turn", (viewAngle * 15).toFixed(2) + "deg");
      shell.style.setProperty("--tree-shift", (viewAngle * 20).toFixed(2) + "px");
      updateStarVisibility();
    }

    function beginSearch() {
      setStage("search");
      setProgress(3, "花树已经盛开，请转动视角寻找三颗星");
      setPrompt("叁 · 寻星", "左右拖动花树，<br><em>寻找相遇、相知与相守</em>");
      memory.textContent = "";
      dragHint.hidden = false;
      setViewAngle(0);
      viewport.focus({ preventScroll: true });
    }

    function bloomBranch(button) {
      var cluster = button.getAttribute("data-bloom");
      var center;

      if (button.classList.contains("is-complete") || stage !== "bloom") {
        return;
      }

      button.classList.add("is-complete");
      button.setAttribute("aria-pressed", "true");
      shell.classList.add("has-bloom-" + cluster);
      bloomCount += 1;
      center = buttonCenter(button);
      effects.burst(center.x, center.y, "petal", 32);
      vibrate(22);
      memory.textContent = memories[cluster];
      announcement.textContent = memories[cluster] + "，枝头已经开花";
      setPrompt("贰 · 花开", "轻触三处花苞，<br><em>让枝叶依次苏醒 · " + bloomCount + " / 3</em>");

      if (bloomCount === bloomButtons.length) {
        transitionTimer = window.setTimeout(beginSearch, reduceMotion ? 120 : 900);
      }
    }

    function beginGrowth() {
      var center = buttonCenter(seed);

      if (stage !== "seed") {
        return;
      }

      setStage("growing");
      seed.hidden = true;
      setProgress(1, "种子已经落下，爱情树正在生长");
      setPrompt("壹 · 生长", "种子已经醒来，<br><em>请看它向着星光生长</em>");
      effects.burst(center.x, center.y, "star", 30);
      vibrate(28);

      transitionTimer = window.setTimeout(function () {
        setStage("bloom");
        setProgress(2, "树干已经长成，请唤醒三处花苞");
        setPrompt("贰 · 花开", "轻触三处花苞，<br><em>让枝叶依次苏醒 · 0 / 3</em>");
        bloomButtons.forEach(function (button) {
          button.hidden = false;
          button.setAttribute("aria-pressed", "false");
        });
      }, reduceMotion ? 180 : 2600);
    }

    function openInvitation() {
      window.clearTimeout(invitationTimer);
      lastFocus = document.activeElement;
      shell.classList.add("is-invitation-open");
      dialog.hidden = false;
      skip.tabIndex = -1;
      openButton.tabIndex = -1;

      window.requestAnimationFrame(function () {
        dialog.classList.add("is-visible");
        document.getElementById("invitation-title").focus({ preventScroll: true });
      });
    }

    function closeInvitation(immediate) {
      dialog.classList.remove("is-visible");
      shell.classList.remove("is-invitation-open");
      skip.tabIndex = 0;
      openButton.tabIndex = 0;

      window.setTimeout(function () {
        dialog.hidden = true;
        if (!immediate && lastFocus && typeof lastFocus.focus === "function") {
          lastFocus.focus({ preventScroll: true });
        } else if (!immediate) {
          openButton.focus({ preventScroll: true });
        }
      }, immediate || reduceMotion ? 20 : 420);
    }

    function completeGame(openNow) {
      window.clearTimeout(transitionTimer);
      setStage("complete");
      setProgress(4, "爱情树与三颗星已经全部点亮");
      setPrompt("肆 · 礼成", "星光已经集齐，<br><em>我们的邀请为你开启</em>");
      dragHint.hidden = true;
      openButton.hidden = false;
      seed.hidden = true;
      shell.classList.add("has-bloom-left", "has-bloom-crown", "has-bloom-right");

      bloomButtons.forEach(function (button) {
        button.hidden = true;
        button.classList.add("is-complete");
      });

      stars.forEach(function (star) {
        star.hidden = false;
        star.classList.add("is-found", "is-visible");
        star.tabIndex = -1;
      });

      memory.textContent = "相遇 · 相知 · 相守";
      effects.shower();
      vibrate([24, 45, 30]);
      invitationTimer = window.setTimeout(openInvitation, openNow || reduceMotion ? 160 : 1500);
    }

    function findStar(star) {
      var center;
      var word;

      if (stage !== "search" || !star.classList.contains("is-visible") || star.classList.contains("is-found")) {
        return;
      }

      word = star.getAttribute("data-word");
      star.classList.add("is-found");
      star.setAttribute("aria-pressed", "true");
      star.setAttribute("aria-label", word + "之星已点亮");
      starCount += 1;
      center = buttonCenter(star);
      effects.burst(center.x, center.y, "star", 38);
      vibrate(25);
      memory.textContent = word + "之星已点亮 · " + starCount + " / 3";
      announcement.textContent = word + "之星已点亮";

      if (starCount === stars.length) {
        window.setTimeout(function () {
          completeGame(false);
        }, reduceMotion ? 100 : 620);
      } else {
        setPrompt("叁 · 寻星", "已找到 " + starCount + " 颗星，<br><em>继续左右拖动花树</em>");
      }
    }

    function resetGame() {
      window.clearTimeout(invitationTimer);
      window.clearTimeout(transitionTimer);
      closeInvitation(true);
      bloomCount = 0;
      starCount = 0;
      viewAngle = 0;
      shell.className = "tree-shell";
      shell.setAttribute("data-tree-game", "");
      shell.setAttribute("data-stage", "seed");
      shell.style.setProperty("--tree-turn", "0deg");
      shell.style.setProperty("--tree-shift", "0px");
      stage = "seed";
      seed.hidden = false;
      dragHint.hidden = true;
      openButton.hidden = true;
      memory.textContent = "";
      setProgress(1, "小游戏已经重新开始");
      setPrompt("壹 · 播种", "轻触种子，<br><em>种下一棵关于我们的树</em>");

      bloomButtons.forEach(function (button) {
        button.hidden = true;
        button.classList.remove("is-complete");
        button.setAttribute("aria-pressed", "false");
      });

      stars.forEach(function (star) {
        star.hidden = true;
        star.classList.remove("is-visible", "is-found");
        star.setAttribute("aria-pressed", "false");
        star.tabIndex = -1;
      });

      seed.focus({ preventScroll: true });
    }

    seed.addEventListener("click", beginGrowth);
    bloomButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        bloomBranch(button);
      });
    });
    stars.forEach(function (star) {
      star.addEventListener("click", function () {
        findStar(star);
      });
    });

    viewport.addEventListener("pointerdown", function (event) {
      if (stage !== "search" || event.target.closest("button")) {
        return;
      }

      dragging = true;
      dragMoved = false;
      dragStartX = event.clientX;
      dragStartAngle = viewAngle;
      viewport.setPointerCapture(event.pointerId);
      shell.classList.add("is-dragging");
    });

    viewport.addEventListener("pointermove", function (event) {
      var difference;

      if (!dragging) {
        return;
      }

      difference = event.clientX - dragStartX;
      dragMoved = dragMoved || Math.abs(difference) > 8;
      setViewAngle(dragStartAngle + difference / Math.max(130, viewport.clientWidth * 0.42));
    });

    function endDrag(event) {
      if (!dragging) {
        return;
      }

      dragging = false;
      shell.classList.remove("is-dragging");
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
      if (dragMoved) {
        announcement.textContent = "花树视角已经转动";
      }
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("keydown", function (event) {
      if (stage !== "search" || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
        return;
      }

      event.preventDefault();
      setViewAngle(viewAngle + (event.key === "ArrowLeft" ? -0.18 : 0.18));
    });

    viewport.addEventListener("click", function (event) {
      if (event.target.closest("button") || dragMoved || stage === "seed") {
        dragMoved = false;
        return;
      }
      effects.burst(event.clientX, event.clientY, "star", 8);
    });

    skip.addEventListener("click", function () {
      if (stage === "complete") {
        openInvitation();
      } else {
        completeGame(true);
      }
    });
    openButton.addEventListener("click", openInvitation);
    closeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        closeInvitation(false);
      });
    });
    replay.addEventListener("click", resetGame);
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        closeInvitation(false);
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !dialog.hidden) {
        closeInvitation(false);
      }
    });

    setProgress(1);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWeddingGame);
  } else {
    initializeWeddingGame();
  }
})();
