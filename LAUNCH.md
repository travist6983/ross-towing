# Launch: connect rosstow.com

**Prepared only. Do not run any of this until every precondition below is true.** Nothing here has been done: there's no CNAME file, no Pages custom domain, and no DNS change.

Ross owns rosstow.com at GoDaddy. Until launch the site lives at https://travist6983.github.io/ross-towing/.

## Preconditions (all four, confirmed by Travis)

1. Jennifer has given Travis delegate access to the GoDaddy account for rosstow.com, or is screen sharing.
2. A screenshot or export of **every** current DNS record for rosstow.com is saved.
3. Her email setup is known. If she uses Microsoft 365 (or any email) on rosstow.com, write down these records first. They will not be changed:
   - the MX records
   - the TXT records (SPF and Microsoft verification)
   - the autodiscover CNAME
4. Travis has said "launch".

## Steps

1. **In this repo:**
   - In `.github/workflows/deploy.yml`, set `VITE_BASE: /`.
   - In `src/config.js`:
     - `SITE_URL: "https://rosstow.com/"`. The canonical, `og:url`, sitemap and JSON-LD follow it.
     - `NOINDEX: false`
     - `JWC_TRACKING: false`, so the Journeyman preview tracker doesn't load on the client's real site.
   - Add `public/CNAME` containing `rosstow.com`.
   - Run `npm run build` and check `dist/sitemap.xml` and the canonical tag.
   - Commit, but don't push until step 3 is ready.
2. **GitHub:**
   - Optionally verify rosstow.com for the travist6983 account first (Settings > Pages > Verified domains). This prevents domain takeover.
   - Then go to Repo Settings > Pages > Custom domain, enter `rosstow.com` and save.
3. **GoDaddy DNS, web records only:**
   - Replace the `@` A records with GitHub Pages' four A records. Check GitHub's "Managing a custom domain" docs for current values first. As of this writing they are:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Add the matching AAAA records if you use IPv6:
     - `2606:50c0:8000::153`
     - `2606:50c0:8001::153`
     - `2606:50c0:8002::153`
     - `2606:50c0:8003::153`
   - Set `www` as a CNAME to `travist6983.github.io`.
   - Turn off GoDaddy domain forwarding if it's on.
   - Leave MX, TXT and every other record exactly as they were.
4. **Push** the step 1 commit. Wait for DNS and the certificate (minutes to a few hours), then tick **Enforce HTTPS** in Pages settings.
5. **Check:**
   - https://rosstow.com and https://www.rosstow.com both load the site.
   - The gallery and the 404 page work at `/`.
   - Send a test email to a rosstow.com address and confirm it still arrives.
6. **Old preview links:**
   - Point the redirect at journeymanwebco.com/preview/ross-towing/ (in the lead-scout repo, `preview/ross-towing/index.html`) to `https://rosstow.com/`.
   - Only if Travis wants the preview gone, drop its noindex and delete the rest of the old folder.
   - The github.io address redirects to rosstow.com on its own once the custom domain is set.
7. **Separate task, after launch:**
   - Submit `https://rosstow.com/sitemap.xml` in Google Search Console.
   - Add the website to Ross's Google Business Profile.

## Rollback

1. Restore the saved `@` A records and `www` record from the screenshot.
2. Remove the custom domain in Pages settings.
3. Revert the step 1 commit and push.

Email is unaffected, because its records were never changed.
