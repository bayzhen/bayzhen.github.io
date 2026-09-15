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
        } else if (particle.kind === "leaf") {
          context.beginPath();
          context.ellipse(0, 0, particle.size * 1.7, particle.size * 0.72, 0, 0, Math.PI * 2);
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
      var palettes = {
        petal: ["#f4c4c1", "#e89f9b", "#f3ddd2", "#c45d65"],
        leaf: ["#a2ad82", "#758a70", "#4c6757", "#c1bd86"],
        star: ["#ffe7a8", "#d8bd7d", "#fff7dc", "#c7a86b"]
      };
      var colors = palettes[kind] || palettes.star;
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
          vy: Math.sin(angle) * speed - (kind === "star" ? 0 : 1.2),
          gravity: kind === "star" ? 0.025 : 0.055,
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

    function scatter(kind, count, top, bottom) {
      var index;

      for (index = 0; index < count; index += 1) {
        window.setTimeout(function () {
          burst(
            width * (0.14 + Math.random() * 0.72),
            height * (top + Math.random() * (bottom - top)),
            kind,
            3
          );
        }, index * 18);
      }
    }

    function shower() {
      scatter("petal", 54, 0.12, 0.44);
      scatter("star", 26, 0.1, 0.38);
    }

    resize();
    window.addEventListener("resize", resize);

    return {
      burst: burst,
      scatter: scatter,
      shower: shower,
      resize: resize
    };
  }

  function initializeWeddingGame() {
    var shell = document.querySelector("[data-tree-game]");
    var viewport = document.querySelector("[data-tree-viewport]");
    var seed = document.querySelector("[data-seed]");
    var growCue = document.querySelector("[data-grow-canopy]");
    var shakeCue = document.querySelector("[data-shake-tree]");
    var bloomButtons = Array.prototype.slice.call(document.querySelectorAll("[data-bloom]"));
    var stars = Array.prototype.slice.call(document.querySelectorAll("[data-fallen-star]"));
    var frames = Array.prototype.slice.call(document.querySelectorAll("[data-memory-frame]"));
    var memoryViewer = document.querySelector("[data-memory-viewer]");
    var memoryMedia = document.querySelector("[data-memory-media]");
    var memoryPictures = Array.prototype.slice.call(document.querySelectorAll("[data-memory-picture]"));
    var memoryKicker = document.querySelector("[data-memory-kicker]");
    var memoryTitle = document.querySelector("[data-memory-title]");
    var memoryCaption = document.querySelector("[data-memory-caption]");
    var memoryFlip = document.querySelector("[data-flip-memory]");
    var memoryClose = document.querySelector("[data-close-memory]");
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
    var announcement = document.querySelector("[data-game-announcement]");
    var canvas = document.querySelector("[data-effect-canvas]");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var effects;
    var stage = "seed";
    var bloomIndex = 0;
    var starCount = 0;
    var canopyStarted = false;
    var shakeStarted = false;
    var pointerActive = false;
    var pointerStage = "";
    var pointerStartX = 0;
    var pointerStartY = 0;
    var pointerMoved = false;
    var gestureHandled = false;
    var invitationTimer = 0;
    var closeTimer = 0;
    var memoryAutoTimer = 0;
    var memoryHideTimer = 0;
    var flowTimers = [];
    var lastFocus = null;
    var photoWarmupCache = [];
    var activeMemoryFrame = null;
    var activeMemorySide = "front";
    var memoryReviewMode = false;
    var memories = {
      left: "相遇 · 故事从一束光开始",
      crown: "相知 · 平凡日子有了共同方向",
      right: "相守 · 从此共赴岁岁年年"
    };
    var highResolutionPhotos = [
      "/wedding/assets/photos/orange-playful.webp",
      "/wedding/assets/photos/veil-closeup.webp",
      "/wedding/assets/photos/traditional-closeup.webp",
      "/wedding/assets/photos/black-gown-couple.webp",
      "/wedding/assets/photos/orange-portrait.webp",
      "/wedding/assets/photos/starlight-bride.webp",
      "/wedding/assets/photos/black-suit-groom.webp",
      "/wedding/assets/photos/traditional-portrait.webp",
      "/wedding/assets/photos/starlight-couple.webp"
    ];
    var memoryStories = {
      left: {
        front: {
          kicker: "第一帧 · 相遇",
          title: "遇见你时，笑意先抵达",
          caption: "从一个顽皮的手势开始，故事有了两个人。",
          layout: "portrait",
          photos: [
            {
              small: "/wedding/assets/photos/orange-playful-small.webp",
              full: "/wedding/assets/photos/orange-playful.webp",
              smallWidth: 640,
              fullWidth: 960,
              width: 960,
              height: 1440,
              alt: "新郎为新娘比出爱心的暖橙色婚纱照"
            }
          ]
        },
        back: {
          kicker: "星光面 · 相遇",
          title: "并肩以后，每天都有新鲜的光",
          caption: "把明亮、认真和一点可爱，都放进往后的日子。",
          layout: "portrait",
          photos: [
            {
              small: "/wedding/assets/photos/orange-portrait-small.webp",
              full: "/wedding/assets/photos/orange-portrait.webp",
              smallWidth: 640,
              fullWidth: 1280,
              width: 1280,
              height: 1919,
              alt: "新郎新娘在暖橙色背景前的正式合照"
            }
          ]
        }
      },
      crown: {
        front: {
          kicker: "第二帧 · 相知",
          title: "靠近一点，听见彼此的心跳",
          caption: "世界很大，而我们刚好愿意停在彼此身边。",
          layout: "landscape",
          photos: [
            {
              small: "/wedding/assets/photos/veil-closeup-small.webp",
              full: "/wedding/assets/photos/veil-closeup.webp",
              smallWidth: 800,
              fullWidth: 1919,
              width: 1919,
              height: 1280,
              alt: "新郎新娘在头纱下相互靠近"
            }
          ]
        },
        back: {
          kicker: "星光面 · 相知",
          title: "你与我，成为我们",
          caption: "各自闪耀，也从此共享同一束星光。",
          layout: "diptych",
          photos: [
            {
              small: "/wedding/assets/photos/starlight-bride-small.webp",
              full: "/wedding/assets/photos/starlight-bride.webp",
              smallWidth: 640,
              fullWidth: 1280,
              width: 1280,
              height: 1919,
              alt: "新娘身着白色婚纱站在星光背景前"
            },
            {
              small: "/wedding/assets/photos/black-suit-groom-small.webp",
              full: "/wedding/assets/photos/black-suit-groom.webp",
              smallWidth: 640,
              fullWidth: 960,
              width: 960,
              height: 1440,
              alt: "新郎身着黑色礼服的肖像"
            }
          ]
        }
      },
      right: {
        front: {
          kicker: "第三帧 · 相守",
          title: "古老的祝愿，写进我们的以后",
          caption: "一礼一诺，从今朝走向岁岁年年。",
          layout: "landscape",
          photos: [
            {
              small: "/wedding/assets/photos/traditional-closeup-small.webp",
              full: "/wedding/assets/photos/traditional-closeup.webp",
              smallWidth: 800,
              fullWidth: 1919,
              width: 1919,
              height: 1280,
              alt: "身着明制婚服的新郎新娘相视而笑"
            }
          ]
        },
        back: {
          kicker: "星光面 · 相守",
          title: "从此有喜，也有朝朝暮暮",
          caption: "愿每一次回望，都还能看见今天的欢喜。",
          layout: "portrait",
          photos: [
            {
              small: "/wedding/assets/photos/traditional-portrait-small.webp",
              full: "/wedding/assets/photos/traditional-portrait.webp",
              smallWidth: 640,
              fullWidth: 1280,
              width: 1280,
              height: 1919,
              alt: "身着明制婚服的新郎新娘手持囍字"
            }
          ]
        }
      }
    };

    if (!shell || !viewport || !seed || !growCue || !shakeCue || !dialog || !canvas || !memoryViewer || frames.length !== 3) {
      return;
    }

    effects = createEffects(canvas);

    function preloadHighResolutionPhotos() {
      var nextIndex = 0;
      var activeRequests = 0;
      var settledRequests = 0;
      var concurrency = 2;

      if (shell.getAttribute("data-photo-preload") === "warming" || shell.getAttribute("data-photo-preload") === "ready") {
        return;
      }

      shell.setAttribute("data-photo-preload", "warming");

      function loadNext() {
        while (activeRequests < concurrency && nextIndex < highResolutionPhotos.length) {
          (function (source) {
            var image = new Image();

            activeRequests += 1;
            nextIndex += 1;
            photoWarmupCache.push(image);
            image.decoding = "async";
            image.fetchPriority = "low";
            image.onload = image.onerror = function () {
              activeRequests -= 1;
              settledRequests += 1;
              image.onload = null;
              image.onerror = null;

              if (settledRequests === highResolutionPhotos.length) {
                shell.setAttribute("data-photo-preload", "ready");
                return;
              }

              loadNext();
            };
            image.src = source;
          })(highResolutionPhotos[nextIndex]);
        }
      }

      loadNext();
    }

    function schedulePhotoWarmup() {
      function startWhenIdle() {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(preloadHighResolutionPhotos, { timeout: 900 });
        } else {
          window.setTimeout(preloadHighResolutionPhotos, 350);
        }
      }

      shell.setAttribute("data-photo-preload", "waiting");
      if (document.readyState === "complete") {
        startWhenIdle();
      } else {
        window.addEventListener("load", startWhenIdle, { once: true });
      }
    }

    schedulePhotoWarmup();

    function vibrate(duration) {
      if (navigator.vibrate) {
        navigator.vibrate(duration || 18);
      }
    }

    function schedule(callback, delay) {
      var timer = window.setTimeout(callback, delay);
      flowTimers.push(timer);
      return timer;
    }

    function clearFlowTimers() {
      flowTimers.forEach(window.clearTimeout);
      flowTimers = [];
      window.clearTimeout(invitationTimer);
    }

    function setProgress(index, text) {
      progressLabel.textContent = "0" + index + " / 05";
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

    function frameForKey(key) {
      return frames.filter(function (frame) {
        return frame.getAttribute("data-memory-frame") === key;
      })[0];
    }

    function storyFor(frame, side) {
      var key = frame.getAttribute("data-memory-frame");
      return memoryStories[key][side];
    }

    function loadFrameSide(frame, side) {
      var story = storyFor(frame, side);
      var thumbNames = side === "front" ? ["front"] : ["back", "back-secondary"];

      story.photos.forEach(function (photo, index) {
        var image = frame.querySelector('[data-frame-thumb="' + thumbNames[index] + '"]');
        if (image && !image.getAttribute("src")) {
          image.src = image.getAttribute("data-src");
          image.decoding = "async";
        }
      });
    }

    function clearMemoryPicture(picture) {
      var source = picture.querySelector("[data-memory-source]");
      var image = picture.querySelector("[data-memory-image]");

      picture.hidden = true;
      source.removeAttribute("srcset");
      source.removeAttribute("sizes");
      image.removeAttribute("src");
      image.removeAttribute("width");
      image.removeAttribute("height");
      image.alt = "";
    }

    function fillMemoryPicture(picture, photo) {
      var source = picture.querySelector("[data-memory-source]");
      var image = picture.querySelector("[data-memory-image]");

      source.srcset = photo.small + " " + photo.smallWidth + "w, " + photo.full + " " + photo.fullWidth + "w";
      source.sizes = "(max-width: 600px) 82vw, 430px";
      image.src = photo.small;
      image.width = photo.width;
      image.height = photo.height;
      image.alt = photo.alt;
      image.decoding = "async";
      picture.hidden = false;
    }

    function renderMemory(frame, side) {
      var story = storyFor(frame, side);

      memoryKicker.textContent = story.kicker;
      memoryTitle.textContent = story.title;
      memoryCaption.textContent = story.caption;
      memoryMedia.className = "memory-viewer__media is-" + story.layout;
      memoryPictures.forEach(clearMemoryPicture);
      story.photos.forEach(function (photo, index) {
        fillMemoryPicture(memoryPictures[index], photo);
      });
      memoryFlip.textContent = side === "front" ? "翻看星光一面" : "翻看花开一面";
    }

    function closeMemory(immediate) {
      var returnFocus = memoryReviewMode ? activeMemoryFrame : null;

      window.clearTimeout(memoryAutoTimer);
      window.clearTimeout(memoryHideTimer);
      memoryViewer.classList.remove("is-visible", "is-review");
      memoryReviewMode = false;
      memoryHideTimer = window.setTimeout(function () {
        memoryViewer.hidden = true;
        if (!immediate && returnFocus && typeof returnFocus.focus === "function") {
          returnFocus.focus({ preventScroll: true });
        }
      }, immediate || reduceMotion ? 20 : 300);
    }

    function openMemory(frame, side, reviewMode) {
      window.clearTimeout(memoryAutoTimer);
      window.clearTimeout(memoryHideTimer);
      activeMemoryFrame = frame;
      activeMemorySide = side;
      memoryReviewMode = reviewMode;
      loadFrameSide(frame, side);
      renderMemory(frame, side);
      memoryFlip.hidden = !reviewMode;
      memoryViewer.classList.toggle("is-review", reviewMode);
      memoryViewer.hidden = false;

      window.requestAnimationFrame(function () {
        memoryViewer.classList.add("is-visible");
      });

      if (reviewMode) {
        memoryClose.focus({ preventScroll: true });
      } else {
        memoryAutoTimer = window.setTimeout(function () {
          closeMemory(false);
        }, reduceMotion ? 260 : 2200);
      }
    }

    function plantFrame(key) {
      var frame = frameForKey(key);

      loadFrameSide(frame, "front");
      frame.hidden = false;
      window.requestAnimationFrame(function () {
        frame.classList.add("is-planted");
      });
      openMemory(frame, "front", false);
    }

    function flipFrame(key) {
      var frame = frameForKey(key);

      loadFrameSide(frame, "back");
      frame.hidden = false;
      frame.classList.add("is-planted", "is-flipped");
      openMemory(frame, "back", false);
    }

    function prepareAllFrames() {
      frames.forEach(function (frame) {
        loadFrameSide(frame, "front");
        loadFrameSide(frame, "back");
        frame.hidden = false;
        frame.disabled = false;
        frame.tabIndex = 0;
        frame.classList.add("is-planted", "is-flipped");
      });
      shell.classList.add("frame-review-ready");
    }

    function resetFrames() {
      closeMemory(true);
      activeMemoryFrame = null;
      activeMemorySide = "front";
      frames.forEach(function (frame) {
        frame.hidden = true;
        frame.disabled = true;
        frame.tabIndex = -1;
        frame.classList.remove("is-planted", "is-flipped");
        Array.prototype.slice.call(frame.querySelectorAll("[data-frame-thumb]")).forEach(function (image) {
          image.removeAttribute("src");
        });
      });
      memoryPictures.forEach(clearMemoryPicture);
    }

    function activateBloom(index) {
      bloomButtons.forEach(function (button, buttonIndex) {
        var active = buttonIndex === index;
        button.classList.toggle("is-active", active);
        button.disabled = !active;
        button.tabIndex = active ? 0 : -1;
      });
    }

    function beginBloom() {
      if (stage !== "canopy") {
        return;
      }

      setStage("bloom");
      setProgress(3, "树冠已经长成，请依次唤醒三处花苞");
      setPrompt("叁 · 花开", "依次轻触三处花苞，<br><em>让相遇、相知与相守盛放 · 0 / 3</em>");
      memory.textContent = "第一处花苞正在发光";
      bloomButtons.forEach(function (button) {
        button.hidden = false;
        button.classList.remove("is-complete", "is-active");
        button.setAttribute("aria-pressed", "false");
      });
      activateBloom(0);
    }

    function growCanopy() {
      var rect;

      if (stage !== "canopy" || canopyStarted) {
        return;
      }

      canopyStarted = true;
      growCue.hidden = true;
      shell.classList.add("has-canopy");
      rect = viewport.getBoundingClientRect();
      effects.burst(rect.left + rect.width / 2, rect.top + rect.height * 0.58, "leaf", 42);
      setPrompt("贰 · 生长", "月光落进枝头，<br><em>三层树冠正在舒展</em>");
      memory.textContent = "一片叶，一阵风，一场漫长的相伴";
      announcement.textContent = "向上滑动完成，三层树冠正在生长";
      vibrate(24);
      schedule(beginBloom, reduceMotion ? 140 : 1550);
    }

    function beginCanopy() {
      if (stage !== "trunk") {
        return;
      }

      setStage("canopy");
      setProgress(2, "枝干已经长成，请向上滑动展开树冠");
      setPrompt("贰 · 添叶", "沿着树干向上轻扫，<br><em>让月光长成层层枝叶</em>");
      growCue.hidden = false;
      memory.textContent = "向上滑动，或轻触下方按钮";
      viewport.focus({ preventScroll: true });
    }

    function beginGrowth() {
      var center = buttonCenter(seed);

      if (stage !== "seed") {
        return;
      }

      setStage("trunk");
      seed.hidden = true;
      setProgress(1, "种子已经落下，枝干正在生长");
      setPrompt("壹 · 生长", "种子已经醒来，<br><em>请看它向着月光生长</em>");
      effects.burst(center.x, center.y, "star", 30);
      vibrate(28);
      schedule(beginCanopy, reduceMotion ? 180 : 2200);
    }

    function beginShake() {
      if (stage !== "bloom") {
        return;
      }

      setStage("shake");
      setProgress(4, "花树已经盛放，请左右轻划让星光落下");
      setPrompt("肆 · 摇曳", "左右轻划花树，<br><em>让三颗星从枝头落下</em>");
      memory.textContent = "左右轻划，或轻触下方按钮";
      shakeCue.hidden = false;
      bloomButtons.forEach(function (button) {
        button.hidden = true;
      });
      viewport.focus({ preventScroll: true });
    }

    function bloomBranch(button) {
      var buttonIndex = bloomButtons.indexOf(button);
      var cluster = button.getAttribute("data-bloom");
      var center;

      if (stage !== "bloom" || buttonIndex !== bloomIndex || button.classList.contains("is-complete")) {
        return;
      }

      button.classList.remove("is-active");
      button.classList.add("is-complete");
      button.setAttribute("aria-pressed", "true");
      button.disabled = true;
      shell.classList.add("has-bloom-" + cluster);
      center = buttonCenter(button);
      bloomIndex += 1;
      effects.burst(center.x, center.y, "petal", 34);
      plantFrame(cluster);
      vibrate(22);
      memory.textContent = memories[cluster];
      announcement.textContent = memories[cluster] + "，枝头已经开花";
      setPrompt("叁 · 花开", "依次轻触三处花苞，<br><em>让相遇、相知与相守盛放 · " + bloomIndex + " / 3</em>");

      if (bloomIndex < bloomButtons.length) {
        activateBloom(bloomIndex);
      } else {
        schedule(beginShake, reduceMotion ? 130 : 900);
      }
    }

    function revealStars() {
      if (stage !== "shake") {
        return;
      }

      setStage("stars");
      shakeStarted = false;
      shakeCue.hidden = true;
      stars.forEach(function (star) {
        star.hidden = false;
        star.classList.remove("is-found");
        star.setAttribute("aria-pressed", "false");
        star.tabIndex = -1;
      });
      setPrompt("肆 · 星落", "星光已经落下，<br><em>轻触相遇、相知与相守</em>");
      memory.textContent = "三颗星会停在这里，慢慢点亮就好";

      schedule(function () {
        if (stage !== "stars") {
          return;
        }
        shell.classList.add("stars-ready");
        stars.forEach(function (star) {
          star.tabIndex = 0;
        });
        announcement.textContent = "三颗星已经落下，可以依次点亮";
      }, reduceMotion ? 40 : 1250);
    }

    function shakeTree() {
      var rect;

      if (stage !== "shake" || shakeStarted) {
        return;
      }

      shakeStarted = true;
      shakeCue.hidden = true;
      shell.classList.add("is-tree-shaking");
      rect = viewport.getBoundingClientRect();
      effects.scatter("petal", 28, 0.22, 0.52);
      effects.burst(rect.left + rect.width / 2, rect.top + rect.height * 0.42, "star", 22);
      setPrompt("肆 · 摇曳", "花树轻轻摇曳，<br><em>请接住正在落下的星光</em>");
      memory.textContent = "星光正从花间落下";
      announcement.textContent = "花树正在摇曳，三颗星即将落下";
      vibrate([20, 38, 20]);
      schedule(function () {
        shell.classList.remove("is-tree-shaking");
        revealStars();
      }, reduceMotion ? 100 : 850);
    }

    function openInvitation() {
      window.clearTimeout(invitationTimer);
      window.clearTimeout(closeTimer);
      closeMemory(true);
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
      window.clearTimeout(closeTimer);
      dialog.classList.remove("is-visible");
      shell.classList.remove("is-invitation-open");
      skip.tabIndex = 0;
      openButton.tabIndex = 0;

      closeTimer = window.setTimeout(function () {
        dialog.hidden = true;
        if (!immediate && lastFocus && typeof lastFocus.focus === "function") {
          lastFocus.focus({ preventScroll: true });
        } else if (!immediate) {
          openButton.focus({ preventScroll: true });
        }
      }, immediate || reduceMotion ? 20 : 420);
    }

    function completeGame(openNow) {
      clearFlowTimers();
      closeMemory(true);
      setStage("complete");
      setProgress(5, "月光花树与三颗星已经全部点亮");
      setPrompt("伍 · 礼成", "花与星光已经集齐，<br><em>我们的邀请为你开启</em>");
      seed.hidden = true;
      growCue.hidden = true;
      shakeCue.hidden = true;
      openButton.hidden = false;
      shell.classList.remove("is-tree-shaking");
      shell.classList.add("has-canopy", "has-bloom-left", "has-bloom-crown", "has-bloom-right", "stars-ready");
      prepareAllFrames();

      bloomButtons.forEach(function (button) {
        button.hidden = true;
        button.classList.remove("is-active");
        button.classList.add("is-complete");
        button.disabled = true;
      });

      stars.forEach(function (star) {
        star.hidden = false;
        star.classList.add("is-found");
        star.setAttribute("aria-pressed", "true");
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
      var starIndex;
      var frameKey;

      if (stage !== "stars" || !shell.classList.contains("stars-ready") || star.classList.contains("is-found")) {
        return;
      }

      word = star.getAttribute("data-word");
      star.classList.add("is-found");
      star.setAttribute("aria-pressed", "true");
      star.setAttribute("aria-label", word + "之星已点亮");
      star.tabIndex = -1;
      starCount += 1;
      starIndex = stars.indexOf(star);
      frameKey = frames[starIndex].getAttribute("data-memory-frame");
      flipFrame(frameKey);
      center = buttonCenter(star);
      effects.burst(center.x, center.y, "star", 38);
      vibrate(25);
      memory.textContent = word + "之星已点亮 · " + starCount + " / 3";
      announcement.textContent = word + "之星已点亮";

      if (starCount === stars.length) {
        schedule(function () {
          completeGame(false);
        }, reduceMotion ? 260 : 2100);
      } else {
        setPrompt("肆 · 星落", "已点亮 " + starCount + " 颗星，<br><em>其余星光会一直等你</em>");
      }
    }

    function resetGame() {
      clearFlowTimers();
      window.clearTimeout(closeTimer);
      closeInvitation(true);
      bloomIndex = 0;
      starCount = 0;
      canopyStarted = false;
      shakeStarted = false;
      pointerActive = false;
      pointerMoved = false;
      gestureHandled = false;
      resetFrames();
      shell.className = "tree-shell";
      shell.setAttribute("data-tree-game", "");
      shell.setAttribute("data-stage", "seed");
      stage = "seed";
      seed.hidden = false;
      growCue.hidden = true;
      shakeCue.hidden = true;
      openButton.hidden = true;
      memory.textContent = "";
      setProgress(1, "月光花树小游戏已经重新开始");
      setPrompt("壹 · 播种", "轻触种子，<br><em>种下一棵关于我们的树</em>");

      bloomButtons.forEach(function (button) {
        button.hidden = true;
        button.disabled = true;
        button.classList.remove("is-complete", "is-active");
        button.setAttribute("aria-pressed", "false");
        button.tabIndex = -1;
      });

      stars.forEach(function (star) {
        star.hidden = true;
        star.classList.remove("is-found");
        star.setAttribute("aria-pressed", "false");
        star.setAttribute("aria-label", "点亮" + star.getAttribute("data-word") + "之星");
        star.tabIndex = -1;
      });

      seed.focus({ preventScroll: true });
    }

    function beginPointer(event) {
      if ((stage !== "canopy" && stage !== "shake") || event.target.closest("button")) {
        return;
      }

      pointerActive = true;
      pointerStage = stage;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerMoved = false;
      gestureHandled = false;
      viewport.setPointerCapture(event.pointerId);
      shell.classList.add("is-gesturing");
    }

    function movePointer(event) {
      if (!pointerActive) {
        return;
      }

      if (Math.abs(event.clientX - pointerStartX) > 8 || Math.abs(event.clientY - pointerStartY) > 8) {
        pointerMoved = true;
      }
    }

    function endPointer(event) {
      var differenceX;
      var differenceY;

      if (!pointerActive) {
        return;
      }

      differenceX = event.clientX - pointerStartX;
      differenceY = event.clientY - pointerStartY;
      pointerActive = false;
      shell.classList.remove("is-gesturing");
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }

      if (pointerStage === "canopy" && differenceY < -42 && Math.abs(differenceY) > Math.abs(differenceX) * 1.05) {
        gestureHandled = true;
        growCanopy();
      } else if (pointerStage === "shake" && Math.abs(differenceX) > 44 && Math.abs(differenceX) > Math.abs(differenceY) * 1.05) {
        gestureHandled = true;
        shakeTree();
      }

      if (pointerMoved && !gestureHandled) {
        announcement.textContent = pointerStage === "canopy" ? "请再明显地向上滑动一次" : "请再明显地左右轻划一次";
      }
    }

    seed.addEventListener("click", beginGrowth);
    growCue.addEventListener("click", growCanopy);
    shakeCue.addEventListener("click", shakeTree);

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

    frames.forEach(function (frame) {
      frame.addEventListener("click", function () {
        var side;
        if (stage !== "complete" || !dialog.hidden) {
          return;
        }
        side = frame.classList.contains("is-flipped") ? "back" : "front";
        openMemory(frame, side, true);
      });
    });

    memoryClose.addEventListener("click", function () {
      closeMemory(false);
    });
    memoryFlip.addEventListener("click", function () {
      if (!memoryReviewMode || !activeMemoryFrame) {
        return;
      }
      activeMemorySide = activeMemorySide === "front" ? "back" : "front";
      activeMemoryFrame.classList.toggle("is-flipped", activeMemorySide === "back");
      loadFrameSide(activeMemoryFrame, activeMemorySide);
      renderMemory(activeMemoryFrame, activeMemorySide);
      announcement.textContent = "相框已经翻到" + (activeMemorySide === "front" ? "花开" : "星光") + "一面";
    });
    memoryViewer.addEventListener("click", function (event) {
      if (event.target === memoryViewer) {
        closeMemory(false);
      }
    });

    viewport.addEventListener("pointerdown", beginPointer);
    viewport.addEventListener("pointermove", movePointer);
    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);
    viewport.addEventListener("keydown", function (event) {
      if (stage === "canopy" && event.key === "ArrowUp") {
        event.preventDefault();
        growCanopy();
      } else if (stage === "shake" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        shakeTree();
      }
    });

    viewport.addEventListener("click", function (event) {
      if (event.target.closest("button") || gestureHandled || pointerMoved || stage === "seed") {
        gestureHandled = false;
        pointerMoved = false;
        return;
      }
      effects.burst(event.clientX, event.clientY, stage === "bloom" ? "petal" : "star", 8);
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
      if (event.key !== "Escape") {
        return;
      }
      if (!memoryViewer.hidden) {
        closeMemory(false);
      } else if (!dialog.hidden) {
        closeInvitation(false);
      }
    });

    bloomButtons.forEach(function (button) {
      button.disabled = true;
      button.tabIndex = -1;
    });
    frames.forEach(function (frame) {
      frame.tabIndex = -1;
    });
    setProgress(1);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWeddingGame);
  } else {
    initializeWeddingGame();
  }
})();
