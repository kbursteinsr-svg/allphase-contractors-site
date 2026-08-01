// All Phase Contractors — shared lead form handler
// Replaces the previous handler, which sat on a <form novalidate> and therefore
// accepted completely empty submissions, showed the success message anyway, and
// sent an identifier-less payload that Meta's CAPI rejected outright.
//
// Drop-in contract: form fields named firstName, lastName, phone, email, city,
// address (optional), projectType. Requires LEAD_SOURCE to be defined.

(function () {
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function fieldWrap(el) {
    return el.closest('.form-group') || el.parentNode;
  }

  function clearError(el) {
    var wrap = fieldWrap(el);
    var msg = wrap.querySelector('.field-error');
    if (msg) msg.remove();
    el.removeAttribute('aria-invalid');
    el.classList.remove('is-invalid');
  }

  function setError(el, text) {
    clearError(el);
    var wrap = fieldWrap(el);
    var msg = document.createElement('div');
    msg.className = 'field-error';
    msg.textContent = text;
    wrap.appendChild(msg);
    el.setAttribute('aria-invalid', 'true');
    el.classList.add('is-invalid');
  }

  function digits(v) {
    return String(v || '').replace(/[^0-9]/g, '');
  }

  function validate(form) {
    var problems = [];

    var checks = [
      { el: form.firstName, test: function (v) { return v.trim().length >= 1; }, msg: 'Please enter your name.' },
      { el: form.phone,     test: function (v) { var d = digits(v); return d.length === 10 || (d.length === 11 && d[0] === '1'); }, msg: 'Enter a 10-digit phone number.' },
      { el: form.email,     test: function (v) { return v.trim() === '' || EMAIL_RE.test(v.trim()); }, msg: 'Enter a valid email address.' },
      { el: form.projectType, test: function (v) { return v.trim().length >= 1; }, msg: 'Please choose what you need.' }
    ];

    checks.forEach(function (c) {
      if (!c.el) return;
      clearError(c.el);
      if (!c.test(c.el.value)) {
        setError(c.el, c.msg);
        problems.push(c.el);
      }
    });

    if (problems.length) {
      problems[0].focus();
      problems[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return problems.length === 0;
  }

  window.submitForm = function (e) {
    e.preventDefault();
    var form = e.target;
    var btn = form.querySelector('button[type="submit"]');
    var original = btn ? btn.textContent : '';

    if (!validate(form)) return false;

    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

    // Shared between the browser Pixel and the server-side CAPI event so Meta
    // deduplicates them into one Lead instead of double-counting.
    var eventId = 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);

    var payload = {
      firstName: form.firstName ? form.firstName.value.trim() : '',
      lastName: form.lastName ? form.lastName.value.trim() : '',
      phone: form.phone ? form.phone.value.trim() : '',
      email: form.email ? form.email.value.trim() : '',
      city: form.city ? form.city.value.trim() : '',
      address: form.address ? form.address.value.trim() : '',
      projectType: form.projectType ? form.projectType.value.trim() : '',
      source: window.LEAD_SOURCE || 'allphase-website',
      eventId: eventId,
      eventSourceUrl: window.location.href,
      submittedAt: new Date().toISOString()
    };

    function reveal() {
      var ok = document.getElementById('successMsg') || document.getElementById('formSuccess');
      if (ok) ok.style.display = 'block';
      form.style.display = 'none';
      if (ok && ok.scrollIntoView) ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function failSoft() {
      if (btn) { btn.disabled = false; btn.textContent = original; }
      var wrap = form.querySelector('.form-submit') || form;
      var existing = wrap.querySelector('.submit-error');
      if (!existing) {
        var err = document.createElement('div');
        err.className = 'submit-error';
        err.innerHTML = "Something went wrong sending that. Please call <a href=\"tel:9418829491\">941-882-9491</a> and we'll take it down over the phone.";
        wrap.appendChild(err);
      }
    }

    fetch('https://kbdigitalmkt.app.n8n.cloud/webhook/allphase-lead-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        // Only fire Lead once the intake actually accepted it, so the pixel
        // never reports a conversion the CRM never received.
        if (typeof fbq !== 'undefined') fbq('track', 'Lead', {}, { eventID: eventId });
        reveal();
      })
      .catch(function () { failSoft(); });

    return false;
  };

  // Tap-to-call tracking — lets Meta optimize toward call taps alongside form fills.
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (t && typeof fbq !== 'undefined') {
      fbq('track', 'Contact', {
        content_name: 'Phone Call Tap',
        content_category: document.title,
        source: window.location.pathname
      }, { eventID: 'call-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) });
    }
  }, true);

  // Live-clear errors as the visitor corrects them.
  document.addEventListener('input', function (e) {
    if (e.target.matches && e.target.matches('.is-invalid')) clearError(e.target);
  }, true);
})();
