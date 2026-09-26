/* Local assets only. Native dialogs provide focus containment and inertness. */
(function () {
  'use strict';
  var root = document.documentElement;
  var themeButton = document.querySelector('.theme-toggle');
  var menuButton = document.querySelector('.menu-toggle');
  var menu = document.getElementById('site-menu');
  var box = document.getElementById('lightbox');
  var links = Array.from(document.querySelectorAll('[data-full]'));
  var current = 0;
  var originalHash = location.hash;
  var returnFocus = null;
  function theme(value) {
    root.dataset.theme = value;
    var label = 'Switch to ' + (value === 'dark' ? 'light' : 'dark') + ' mode';
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
  }
  try { theme(localStorage.getItem('wildlife-theme') === 'light' ? 'light' : 'dark'); } catch (_) { theme('dark'); }
  themeButton.addEventListener('click', function () {
    theme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    try { localStorage.setItem('wildlife-theme', root.dataset.theme); } catch (_) {}
  });
  function open(dialog, trigger) {
    returnFocus = trigger;
    dialog.showModal();
    root.classList.add('modal-open');
  }
  [menu, box].forEach(function (dialog) {
    dialog.addEventListener('close', function () {
      root.classList.remove('modal-open');
      menuButton.setAttribute('aria-expanded', 'false');
      if (returnFocus) returnFocus.focus({ preventScroll: true });
    });
  });
  menuButton.addEventListener('click', function () {
    open(menu, menuButton);
    menuButton.setAttribute('aria-expanded', 'true');
    menu.querySelector('.menu-close').focus();
  });
  menu.querySelector('.menu-close').addEventListener('click', function () { menu.close(); });
  var img = box.querySelector('img');
  var detailsPanel = box.querySelector('#lightbox-details');
  var detailsButton = box.querySelector('.lightbox-info');
  function toggleDetails(opened) {
    detailsPanel.hidden = !opened;
    detailsButton.setAttribute('aria-expanded', String(opened));
    detailsButton.textContent = opened ? 'PHOTO' : 'DETAILS';
    box.classList.toggle('details-open', opened);
  }
  detailsButton.addEventListener('click', function () { toggleDetails(detailsPanel.hidden); });
  box.addEventListener('close', function () {
    toggleDetails(false);
    box.querySelector('.share-status').textContent = '';
  });
  box.addEventListener('cancel', function (event) {
    if (!detailsPanel.hidden) {
      event.preventDefault(); toggleDetails(false); detailsButton.focus();
    }
  });
  function sizePhoto() {
    var bounds = img.getBoundingClientRect();
    var ratio = Number(img.getAttribute('width')) / Number(img.getAttribute('height'));
    if (box.open && bounds.width > 0 && bounds.height > 0 && ratio > 0) {
      img.sizes = Math.ceil(Math.min(bounds.width, bounds.height * ratio)) + 'px';
    }
  }
  function show(index) {
    current = (index + links.length) % links.length;
    var link = links[current];
    var photoId = link.closest('.post-block').id;
    if (box.open && photoId) history.replaceState(null, '', '#' + photoId);
    box.querySelector('.share-status').textContent = '';
    var thumb = link.querySelector('img');
    img.alt = link.dataset.alt || thumb.alt;
    img.width = thumb.getAttribute('width');
    img.height = thumb.getAttribute('height');
    box.querySelector('figcaption').textContent = link.dataset.caption || img.alt;
    var metadata = link.closest('.post-block').querySelector('.photo-detail-grid');
    box.querySelector('.lightbox-detail-content').replaceChildren();
    if (metadata) box.querySelector('.lightbox-detail-content').appendChild(metadata.cloneNode(true));
    detailsButton.hidden = !metadata;
    sizePhoto();
    img.srcset = thumb.srcset;
    img.src = link.dataset.full;
    box.querySelector('.lightbox-count').textContent = String(current + 1).padStart(2, '0') + ' / ' + String(links.length).padStart(2, '0');
    box.querySelector('.lightbox-prev').hidden = links.length < 2;
    box.querySelector('.lightbox-next').hidden = links.length < 2;
  }
  links.forEach(function (link, index) {
    link.addEventListener('click', function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof box.showModal !== 'function') return;
      event.preventDefault(); open(box, link); show(index);
      box.querySelector('.lightbox-close').focus();
    });
  });
  if (typeof ResizeObserver === 'function') new ResizeObserver(sizePhoto).observe(img);
  window.addEventListener('resize', sizePhoto);
  box.querySelector('.lightbox-close').addEventListener('click', function () { box.close(); });
  box.querySelector('.lightbox-prev').addEventListener('click', function () { show(current - 1); });
  box.querySelector('.lightbox-next').addEventListener('click', function () { show(current + 1); });
  box.querySelector('.lightbox-share').addEventListener('click', async function () {
    var url = new URL(location.href);
    url.hash = links[current].closest('.post-block').id;
    url.search = '';
    var status = box.querySelector('.share-status');
    try {
      await navigator.clipboard.writeText(url.href);
      status.textContent = 'Photo link copied';
    } catch (_) {
      status.replaceChildren();
      var input = document.createElement('input');
      input.type = 'text'; input.readOnly = true; input.value = url.href;
      input.setAttribute('aria-label', 'Photo link — select and copy');
      status.appendChild(input); input.focus(); input.select();
    }
  });
  var touchStart = null;
  img.addEventListener('touchstart', function (event) {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  img.addEventListener('touchend', function (event) {
    if (!touchStart || !detailsPanel.hidden || event.changedTouches.length !== 1) return;
    var dx = event.changedTouches[0].clientX - touchStart.x;
    var dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && links.length > 1) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
  img.addEventListener('touchcancel', function () { touchStart = null; }, { passive: true });
  function openLinkedPhoto() {
    var index = links.findIndex(function (link) { return '#' + link.closest('.post-block').id === location.hash; });
    if (index >= 0 && !box.open && typeof box.showModal === 'function') {
      open(box, links[index]); show(index); box.querySelector('.lightbox-close').focus();
    }
  }
  window.addEventListener('hashchange', openLinkedPhoto);
  if (originalHash) openLinkedPhoto();
  box.addEventListener('click', function (event) { if (event.target === box) box.close(); });
  box.addEventListener('keydown', function (event) {
    if (event.target.matches('input, textarea, select')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
  });
  var header = document.querySelector('.site-header');
  function scrollState() { header.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', scrollState, { passive: true }); scrollState();

  var filters = document.getElementById('archive-filters');
  if (filters) {
    var cards = Array.from(document.querySelectorAll('.archive-card'));
    var params = new URLSearchParams(location.search);
    ['q', 'species', 'place', 'year', 'group'].forEach(function (key) {
      if (params.has(key)) filters.elements[key].value = params.get(key);
    });
    filters.hidden = false;
    function filterArchive() {
      var values = new FormData(filters);
      var words = String(values.get('q') || '').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
      var count = 0;
      cards.forEach(function (card) {
        var match = words.every(function (word) { return card.dataset.search.includes(word); });
        ['species', 'place', 'year', 'group'].forEach(function (key) {
          if (values.get(key) && card.dataset[key] !== values.get(key)) match = false;
        });
        card.hidden = !match; if (match) count++;
      });
      document.getElementById('archive-count').textContent = count + (count === 1 ? ' photograph' : ' photographs');
      document.getElementById('archive-empty').hidden = count !== 0;
      var query = new URLSearchParams();
      values.forEach(function (value, key) { if (value) query.set(key, value); });
      history.replaceState(null, '', location.pathname + (query.size ? '?' + query.toString() : ''));
    }
    filters.addEventListener('input', filterArchive);
    filters.addEventListener('submit', function (event) { event.preventDefault(); filterArchive(); });
    filters.addEventListener('reset', function () { setTimeout(filterArchive, 0); });
    filterArchive();
  }
})();
