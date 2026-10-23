/* LabSyria: Meta Pixel, ONLY after the visitor agrees (23 Oct 2026)
   ----------------------------------------------------------------------------
   Lets LabSyria measure its Facebook/Instagram adverts and show them again to
   people who visited the site (e.g. the LIS page). Nothing loads from Meta and
   no cookie is set until the visitor taps "Accept" on the small bar this file
   draws; "No thanks" is remembered and nothing is ever loaded. Do-Not-Track
   is respected (no bar, no pixel). The choice lives in localStorage
   ("ls_ads_consent") and can be changed from the privacy page.

   Events: PageView on every page, ViewContent on /lims/, Contact when a
   WhatsApp or phone link is tapped, and window.lsTrack(name) for pages that
   report their own milestone (the careers form sends "JobApplication").
   No form content, name, phone or email is ever passed to Meta. */
(function () {
  var PIXEL = '1881264822202364';
  var KEY = 'ls_ads_consent';
  var queue = [];
  window.lsTrack = function (name) { queue.push(name); if (window.fbq) flush(); };

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function put(v) { try { localStorage.setItem(KEY, v); } catch (e) { } }
  function dnt() { return navigator.doNotTrack === '1' || window.doNotTrack === '1'; }

  function flush() {
    while (queue.length) { try { window.fbq('trackCustom', queue.shift()); } catch (e) { } }
  }

  function load() {
    if (window.fbq) return;
    /* Meta's base code, unminified */
    var n = window.fbq = function () {
      if (n.callMethod) n.callMethod.apply(n, arguments); else n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    var s = document.createElement('script');
    s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    window.fbq('init', PIXEL);
    window.fbq('track', 'PageView');
    if (/^\/lims(\/|$)/.test(location.pathname)) window.fbq('track', 'ViewContent', { content_name: 'LIS' });
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var h = a.getAttribute('href') || '';
      if (/wa\.me|api\.whatsapp\.com|^tel:/i.test(h)) { try { window.fbq('track', 'Contact'); } catch (x) { } }
    }, true);
    flush();
  }

  function bar() {
    var b = document.createElement('div');
    b.id = 'ls-consent';
    b.setAttribute('role', 'region');
    b.setAttribute('aria-label', 'Advertising consent');
    b.style.cssText = 'position:fixed;inset-inline:12px;bottom:12px;z-index:9999;max-width:560px;margin-inline:auto;' +
      'background:#fff;color:#1b1f2a;border:1px solid #d9dee5;border-radius:12px;padding:12px 14px;' +
      'font-size:14px;line-height:1.5;display:flex;flex-wrap:wrap;gap:10px;align-items:center';
    b.innerHTML =
      '<p style="margin:0;flex:1 1 260px"><span data-ar>نستخدم بكسل ميتا لقياس إعلاناتنا على فيسبوك وإنستغرام وإظهارها لزوّار الموقع. ' +
      'لا نرسل أي بيانات من النماذج. <a href="/privacy/#ads">التفاصيل</a></span>' +
      '<span data-en>We use the Meta Pixel to measure our Facebook and Instagram adverts and show them to visitors of this site. ' +
      'No form data is sent. <a href="/privacy/#ads">Details</a></span></p>' +
      '<span style="display:flex;gap:8px">' +
      '<button type="button" data-v="yes" style="padding:8px 14px;border-radius:8px;border:0;background:#0b7a75;color:#fff;font:inherit;cursor:pointer">' +
      '<span data-ar>موافق</span><span data-en>Accept</span></button>' +
      '<button type="button" data-v="no" style="padding:8px 14px;border-radius:8px;border:1px solid #c9cfd8;background:#fff;color:#1b1f2a;font:inherit;cursor:pointer">' +
      '<span data-ar>لا، شكراً</span><span data-en>No thanks</span></button></span>';
    b.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button[data-v]') : null;
      if (!t) return;
      put(t.getAttribute('data-v'));
      b.parentNode.removeChild(b);
      if (t.getAttribute('data-v') === 'yes') load();
    });
    document.body.appendChild(b);
  }

  /* the privacy page offers a way to change the choice */
  window.lsAdsConsent = function (v) { put(v); if (v === 'yes') load(); };

  function start() {
    if (dnt()) return;
    var c = get();
    if (c === 'yes') load();
    else if (c !== 'no') bar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
