/* LabSyria: privacy-first website analytics (Azure Application Insights)
   ----------------------------------------------------------------------------
   Feeds Ops Central. Same approach as catenix.com/analytics.js: cookieless by
   design (disableCookiesUsage writes nothing to cookies or localStorage and
   stores no cross-session identifier on the device), Do-Not-Track respected,
   no session replay, hosted in West Europe.

   This lives in an external file ON PURPOSE. It previously shipped as the
   Microsoft minified snippet pasted inline into every page, and a single
   dropped ")" made the whole block unparseable, so the site recorded zero
   traffic from 19 Jul 2026 until this file replaced it. Minified code inlined
   into a template is not reviewable; a real file is, and build.py now parses
   every inline block anyway.

   Serves labsyria.com and learn.labsyria.com into the SAME App Insights
   component, which is what Ops Central expects (it strips both prefixes when
   grouping paths). */
(function () {
  var IKEY = '52c2a3ff-e80a-4ff6-8c43-49246680d457';
  var INGEST = 'https://westeurope-5.in.applicationinsights.azure.com';
  var CONNECTION_STRING = 'InstrumentationKey=' + IKEY +
    ';IngestionEndpoint=' + INGEST + '/' +
    ';LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/' +
    ';ApplicationId=5e4432cf-ee4d-4145-9982-3e5d28c51919';

  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1') { return; }

  // No telemetry from local or dev copies.
  var HOSTS = ['labsyria.com', 'www.labsyria.com', 'learn.labsyria.com'];
  if (HOSTS.indexOf(location.hostname) === -1) { return; }

  var sent = false;

  /* Fallback beacon. Much of the audience is inside Syria, where the Azure CDN
     that hosts the SDK may be slow or unreachable. If the SDK never loads we
     would silently count nobody, so post one minimal pageview straight to the
     ingestion endpoint instead. Marked fallback:"1" so it is distinguishable. */
  function fallbackPageView() {
    if (sent) { return; }
    sent = true;
    try {
      var envelope = {
        name: 'Microsoft.ApplicationInsights.' + IKEY.replace(/-/g, '') + '.Pageview',
        time: new Date().toISOString(),
        iKey: IKEY,
        tags: {
          'ai.device.type': 'Browser',
          'ai.operation.name': location.pathname || '/',
          'ai.internal.sdkVersion': 'labsyria-fallback:1'
        },
        data: {
          baseType: 'PageviewData',
          baseData: {
            ver: 2,
            name: (document.title || '').slice(0, 200),
            url: location.href,
            properties: { refUri: document.referrer || '(direct)', fallback: '1' }
          }
        }
      };
      fetch(INGEST + '/v2/track', {
        method: 'POST',
        body: JSON.stringify(envelope),
        mode: 'cors',
        keepalive: true
      })['catch'](function () { /* offline or blocked: nothing more we can do */ });
    } catch (e) { /* analytics must never break the page */ }
  }

  var s = document.createElement('script');
  s.src = 'https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js';
  s.async = true;
  s.crossOrigin = 'anonymous';

  s.onerror = fallbackPageView;

  s.onload = function () {
    try {
      var ai = new window.Microsoft.ApplicationInsights.ApplicationInsights({
        config: {
          connectionString: CONNECTION_STRING,
          disableCookiesUsage: true,        // cookieless: no cookies, no localStorage
          disableAjaxTracking: true,
          disableFetchTracking: true,
          enableAutoRouteTracking: false,   // static site: one page view per load
          autoTrackPageVisitTime: true,
          disableExceptionTracking: false,
          enableUnhandledPromiseRejectionTracking: false
        }
      });
      ai.loadAppInsights();
      ai.trackPageView();
      sent = true;
      window.labsyriaAI = ai;
    } catch (e) {
      fallbackPageView();
    }
  };

  document.head.appendChild(s);

  // If the SDK has not reported within 8s (blocked, throttled, hung), count the visit anyway.
  setTimeout(fallbackPageView, 8000);
})();
