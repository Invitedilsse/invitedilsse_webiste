(function () {
    "use strict";

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nav = document.querySelector('.nav');


    // Navbar state
    var ticking = false;
    var onScroll = function () {
        nav.classList.toggle('is-scrolled', window.scrollY > 20);
        ticking = false;
    };
    window.addEventListener('scroll', function () {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    onScroll();


    // Mobile menu
    var toggle = document.querySelector('.nav__toggle');
    var links = document.querySelector('.nav__links');
    var setMenu = function (open) {
        links.classList.toggle('is-open', open);
        nav.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function () {
        setMenu(!links.classList.contains('is-open'));
    });
    links.addEventListener('click', function (e) {
        if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setMenu(false);
    });


    // Active nav link
    var navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
    if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (link) {
                    link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        navLinks.forEach(function (link) {
            var section = document.querySelector(link.getAttribute('href'));
            if (section) spy.observe(section);
        });
    }


    // Scroll reveal
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
        Array.prototype.forEach.call(group.children, function (el, i) {
            el.classList.add('reveal');
            el.style.transitionDelay = (i % 4) * 80 + 'ms';
        });
    });
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var revealer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                el.classList.add('is-visible');
                revealer.unobserve(el);
                // Drop the stagger delay afterwards so hover feels instant
                setTimeout(function () { el.style.transitionDelay = ''; }, 1200);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
        reveals.forEach(function (el) { revealer.observe(el); });
    } else {
        reveals.forEach(function (el) {
            el.style.transitionDelay = '';
            el.classList.add('is-visible');
        });
    }


    // Hero phone screens
    var screens = document.querySelectorAll('.screens img');
    if (screens.length > 1 && !reduceMotion) {
        var current = 0;
        setInterval(function () {
            screens[current].classList.remove('is-active');
            current = (current + 1) % screens.length;
            screens[current].classList.add('is-active');
        }, 3800);
    }


    // Feature videos
    var player = document.querySelector('.watch__player video');
    var items = document.querySelectorAll('.watch__item');
    var sound = document.querySelector('.watch__sound');
    var autoStarted = false;
    var autoPaused = false;
    var autoMuted = false;
    var userMuted = false;

    // Browsers only allow autoplay without sound, so start muted and offer a tap for sound
    if (player && 'IntersectionObserver' in window && !reduceMotion) {
        new IntersectionObserver(function (entries) {
            var inView = entries[0].isIntersecting;
            if (inView && (!autoStarted || autoPaused)) {
                autoStarted = true;
                autoPaused = false;
                // Try with sound first; the browser only allows it once the visitor has
                // clicked or tapped somewhere on the page, so fall back to muted
                if (!userMuted) player.muted = false;
                var started = player.play();
                if (started && started.catch) {
                    started.catch(function () {
                        player.muted = true;
                        autoMuted = true;
                        var retry = player.play();
                        if (retry && retry.catch) retry.catch(function () {});
                    });
                }
            } else if (!inView && !player.paused) {
                player.pause();
                autoPaused = true;
            }
        }, { threshold: 0.6 }).observe(player);
    }
    if (player && sound) {
        var syncSound = function () {
            sound.hidden = !(player.muted && !player.paused);
        };
        ['play', 'pause', 'volumechange', 'ended'].forEach(function (name) {
            player.addEventListener(name, syncSound);
        });
        sound.addEventListener('click', function () {
            autoMuted = false;
            player.muted = false;
        });
    }
    if (player) {
        // Remember when the visitor mutes it on purpose, so sound is not forced back on
        player.addEventListener('volumechange', function () {
            if (!player.muted) {
                autoMuted = false;
                userMuted = false;
            } else if (!autoMuted) {
                userMuted = true;
            }
        });
        // The first click, tap or key press anywhere unlocks sound for a video we had to mute.
        // Clicks on the player itself are left to its own controls: its speaker button toggles
        // after this handler runs, so unmuting here as well would flip it straight back to muted.
        var unlockSound = function (e) {
            if (!autoMuted || e.target === player) return;
            autoMuted = false;
            player.muted = false;
        };
        document.addEventListener('click', unlockSound);
        document.addEventListener('keydown', unlockSound);
    }
    items.forEach(function (item) {
        item.addEventListener('click', function () {
            if (!item.classList.contains('is-active')) {
                items.forEach(function (other) {
                    other.classList.toggle('is-active', other === item);
                    other.setAttribute('aria-pressed', other === item ? 'true' : 'false');
                });
                player.pause();
                autoPaused = false;
                player.poster = item.getAttribute('data-poster');
                player.src = item.getAttribute('data-video');
                player.setAttribute('aria-label', item.querySelector('strong').textContent + ' feature video');
            }
            // A click is a user gesture, so sound is allowed from here on
            autoMuted = false;
            player.muted = false;
            var playing = player.play();
            if (playing && playing.catch) playing.catch(function () {});
            // On phones the player sits above the list, so bring it back into view
            if (window.matchMedia('(max-width: 899.98px)').matches) {
                player.parentNode.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
            }
        });
    });


    // Footer year
    var year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
})();
