# Phase 7 — CallRail DNI + Meta CAPI for All Phase (STAGED — not deployed)

**Status:** the DNI tracking script is **staged on branch `claude/phase7-callrail-dni`** across all 24 content
pages, but it is **NOT live** — the swap-key placeholder must be filled and the branch merged/deployed. It is
intentionally **not** on `main` so a placeholder script never ships.

CallRail context (already set up by Kris, do not redo): account **222862157**, company **511459086**
("KB Digital Marketing"), tracking number **941-200-3378**, forwards to **941-809-8733** (Mike's cell —
confirmed correct, do not change). Trial ends **Aug 18** — add billing before then.

---

## What's staged
The CallRail `swap.js` tag was inserted just before `</head>` in all 24 content pages (every `.html` except
the Google verification file):
```html
<script type="text/javascript" src="//cdn.callrail.com/companies/511459086/__CALLRAIL_SWAP_KEY__/12/swap.js"></script>
```
- `company_id` `511459086` is filled in.
- **`__CALLRAIL_SWAP_KEY__` is a placeholder** — the per-company swap key lives only in your CallRail
  dashboard, so I couldn't fill it.
- The underlying number in the HTML stays **941-412-4901** everywhere (134 display + 89 `tel:` instances,
  unchanged). CallRail's script swaps only what's *rendered*, and only for visitors its targeting qualifies —
  so direct/organic visitors still see 941-412-4901. This preserves the earlier phone-consistency fix;
  there is **no second hardcoded number** anywhere — only CallRail's script does the swap.

## What you need to do (in order)

1. **Get the swap key / exact snippet.** CallRail → Settings → Tracking (the number's *JavaScript* / DNI
   snippet). Either (a) tell me the key and I'll replace `__CALLRAIL_SWAP_KEY__` across all 24 files, or
   (b) paste CallRail's exact `<script>` in place of the staged tag. (If your snippet's `/12/` version
   differs, use yours.)
2. **Configure the number swap in CallRail:** source **941-412-4901** → tracking **941-200-3378**, with
   targeting set to **visitors from Facebook ads** (so only ad traffic sees the tracking number). This is
   CallRail-dashboard config, not code.
3. **Wire Meta CAPI for calls:** CallRail → Settings → Integrations → **Facebook Ads / Conversions API** →
   connect to the **same** Meta Pixel **`1029418552907498`** and ad account **`act_1006010788713827`** that
   the existing form-lead CAPI already reports to (system user `qKTApkr37eJRsLCi`). Goal: a tracked call
   posts as a conversion alongside form-fill conversions.
4. **Merge + deploy:** merge `claude/phase7-callrail-dni` → `main` (Netlify auto-deploys
   allphasecontractorsfl.com). Do this only after step 1 so no placeholder ships. (Or hand me the key and
   I'll finish + deploy.)
5. **Verify end-to-end:** from a device **not** logged into the site, load the site via a simulated FB-ad
   visit → confirm the displayed number swaps to 941-200-3378; call it → it should ring Mike (already
   confirmed), log in CallRail with duration, and (once step 3 is done) appear as a conversion in Meta Ads
   Manager within the normal CAPI window.

## Do NOT
- Change the CallRail call flow / forwarding destination (Mike's personal setup, confirmed correct).
- Create additional CallRail numbers/companies (multi-client tracking is a separate structural decision).
- Extend DNI to SBC or other clients without deciding scope/pricing first — that's your call, not an
  autonomous build.

## Extending to SBC / other clients (report, don't act)
Whether to add call tracking for SBC or others is a scope/pricing decision (a separate CallRail "Company"
per client). Flagged for you; not built.
