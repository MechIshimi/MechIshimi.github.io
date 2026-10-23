/* Motion, all skipped when prefers-reduced-motion: reduce.
   Fine-pointer only: hero crosshair, soft orange glow, grid drift, magnetic buttons.
   Section fade-in only hides nodes JS has marked, skips anything already near the
   viewport, and reveals the rest after 1.5s if the observer never fires.
   Count-up covers the two real figures. Nav and the gallery run regardless. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var btn = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (btn && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Close" : "Menu";
    };
    btn.addEventListener("click", function () {
      var open = !nav.classList.contains("is-open");
      setOpen(open);
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        btn.focus();
      }
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
  }

  document.querySelectorAll("[data-gallery]").forEach(function (gallery) {
    var main = gallery.querySelector("[data-main]");
    var cap = gallery.querySelector("[data-caption]");
    var thumbs = gallery.querySelectorAll("[data-thumb]");
    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var img = thumb.querySelector("img");
        if (!img || !main) return;
        main.src = img.src;
        main.alt = img.alt;
        if (cap) cap.textContent = img.alt;
        thumbs.forEach(function (t) { t.setAttribute("aria-pressed", "false"); });
        thumb.setAttribute("aria-pressed", "true");
      });
    });
  });

  if (reduce) return;

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px 12% 0px", threshold: 0.01 });

    var view = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll(".reveal").forEach(function (el) {
      var rect = el.getBoundingClientRect();
      // Already on screen, above it, or just below the fold: never hide.
      if (rect.top < view + 64) return;
      el.classList.add("wait");
      io.observe(el);
    });

    // If the observer never fires (print, a capture that doesn't scroll), show the copy.
    window.setTimeout(function () {
      document.querySelectorAll(".reveal.wait").forEach(function (el) {
        el.classList.add("in");
        io.unobserve(el);
      });
    }, 1500);

    var counts = document.querySelectorAll(".count");
    if (counts.length) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var to = parseInt(el.getAttribute("data-to"), 10) || 0;
          var start = performance.now();
          var dur = 800;
          var tick = function (now) {
            var t = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - t, 3);
            el.textContent = String(Math.round(to * eased));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          cio.unobserve(el);
        });
      }, { threshold: 0.7 });
      counts.forEach(function (el) { cio.observe(el); });
    }
  }

  if (!fine) return;

  document.querySelectorAll(".magnetic").forEach(function (el) {
    var box = null;
    var clamp = function (v, m) { return Math.max(-m, Math.min(m, v)); };
    el.addEventListener("pointerenter", function () {
      box = el.getBoundingClientRect();
      el.style.transition = "none";
    });
    el.addEventListener("pointermove", function (e) {
      if (!box || (e.pointerType && e.pointerType !== "mouse")) return;
      var dx = e.clientX - (box.left + box.width / 2);
      var dy = e.clientY - (box.top + box.height / 2);
      el.style.transform = "translate3d(" + clamp(dx * 0.2, 8) + "px," + clamp(dy * 0.3, 6) + "px,0)";
    });
    el.addEventListener("pointerleave", function () {
      el.style.transition = "";
      el.style.transform = "";
      box = null;
    });
  });

  var hero = document.querySelector(".hero");
  var glow = document.querySelector(".hero-glow");
  var ret = document.querySelector(".hero-reticle");
  var grid = document.querySelector(".hero-grid");
  if (!hero || !glow || !ret) return;

  var rect = hero.getBoundingClientRect();
  var x = rect.width * 0.62;
  var y = rect.height * 0.4;
  var tx = x;
  var ty = y;
  var raf = 0;
  var inside = false;

  var frame = function () {
    x += (tx - x) * 0.14;
    y += (ty - y) * 0.14;
    glow.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    ret.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    if (grid && rect.width) {
      var gx = (x / rect.width - 0.5) * 14;
      var gy = (y / rect.height - 0.5) * 10;
      grid.style.transform = "translate3d(" + gx + "px," + gy + "px,0)";
    }
    if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(frame);
    else raf = 0;
  };

  hero.addEventListener("pointerenter", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    inside = true;
    hero.classList.add("fx");
  });
  hero.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    rect = hero.getBoundingClientRect();
    tx = e.clientX - rect.left;
    ty = e.clientY - rect.top;
    if (!raf) raf = requestAnimationFrame(frame);
  });
  hero.addEventListener("pointerleave", function () {
    inside = false;
    hero.classList.remove("fx");
    tx = rect.width * 0.5;
    ty = rect.height * 0.5;
    if (!raf) raf = requestAnimationFrame(frame);
  });
  window.addEventListener("resize", function () {
    rect = hero.getBoundingClientRect();
  }, { passive: true });
})();
