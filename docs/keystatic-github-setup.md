# Editing content on the live site (Keystatic GitHub mode)

By default Keystatic runs in **local mode**: you edit at `http://localhost:3000/keystatic` while
`npm run dev` is running, and it saves straight to the files in `content/` and `public/images/`.
You then commit and push those changes yourself.

**GitHub mode** lets you (or Sofy) edit at `https://www.sofyjaramillo.com/keystatic` from any browser.
Every save becomes a commit to the GitHub repo, and Vercel redeploys the site with the change.

This guide sets it up once. It takes about 15 minutes.

## Before you start

- The site is deployed on Vercel at `https://www.sofyjaramillo.com`.
- In your browser, you're signed in to github.com as **jjaramillo34**, the owner of
  `jjaramillo34/sofyjaramillo`. Keystatic creates a GitHub App under whichever account is signed
  in, and only the repo owner can install it on the repo.
- Your local copy is up to date: `git pull`.

## 1. Point Keystatic at the repo (locally)

In `.env.local`, set:

```bash
NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO=jjaramillo34/sofyjaramillo
```

`keystatic.config.ts` switches to GitHub mode whenever this variable is set.

## 2. Create the GitHub App with the setup wizard

The wizard only works in development.

1. Run `npm run dev`.
2. Open `http://localhost:3000/keystatic`. Keystatic notices the GitHub credentials are missing
   and shows the setup page.
3. When it asks for your **deployed app URL**, enter `https://www.sofyjaramillo.com` (with
   `www`). This adds the live site to the app's allowed sign-in addresses, alongside `localhost`.
4. Click **Create GitHub App**. GitHub opens a form with everything pre-filled; give the app a
   name if it asks (e.g. `Sofy Jaramillo Keystatic`) and confirm.
5. GitHub sends you back to Keystatic, which writes four values to a file named **`.env`** in the
   project root (not `.env.local`):

   ```bash
   KEYSTATIC_GITHUB_CLIENT_ID=...
   KEYSTATIC_GITHUB_CLIENT_SECRET=...
   KEYSTATIC_SECRET=...
   NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=...
   ```

   `.env` is ignored by git, like `.env.local`, so these stay private. Don't paste them anywhere
   public.

## 3. Install the app on the repo

1. On the Keystatic page that follows, click **Install GitHub App** (or open
   `https://github.com/apps/<app-slug>/installations/new`, using the slug from `.env`).
2. Choose **Only select repositories** → `jjaramillo34/sofyjaramillo` → **Install**.
3. Restart `npm run dev`, open `http://localhost:3000/keystatic` and sign in with GitHub. You
   should see the Artworks list. Saving now creates a commit on GitHub instead of changing
   local files.

## 4. Add the variables to Vercel

The live site needs all five values. Add them under Vercel → Project → Settings →
Environment Variables (Production), or with the CLI:

```bash
vercel env add NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO production   # jjaramillo34/sofyjaramillo
vercel env add KEYSTATIC_GITHUB_CLIENT_ID production
vercel env add KEYSTATIC_GITHUB_CLIENT_SECRET production
vercel env add KEYSTATIC_SECRET production
vercel env add NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG production
```

Copy each value from your local `.env`.

> **Add all five together.** If `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO` is set without the other
> four, Keystatic errors on the live site with "Missing required config".

Then **redeploy**. Variables starting with `NEXT_PUBLIC_` are built into the site, so they only
take effect in a new deployment.

## 5. Try it

1. Open `https://www.sofyjaramillo.com/keystatic` and sign in with GitHub.
2. Edit something small (e.g. an artwork's description) and save.
3. Check the repo on GitHub: there's a new commit on `main`.
4. Vercel builds it automatically. The change is live after the build finishes, usually within
   a couple of minutes.

## Letting Sofy or family edit

Anyone who signs in must be able to write to the repo:

1. They create a free GitHub account.
2. On GitHub: repo → **Settings** → **Collaborators** → **Add people**, and they accept the
   invite.
3. They go to `https://www.sofyjaramillo.com/keystatic` and sign in with GitHub.

Their edits are commits under their own name, so the history shows who changed what.

## Good to know

- **Local editing afterwards:** while `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO` is set in
  `.env.local`, local edits also go to GitHub. To go back to editing files on disk locally,
  remove or comment out that line (keep the four values in `.env` for later).
- **Pull after editing online:** online edits are commits on GitHub, so run `git pull` before
  you change code locally.
- **Use the `www` address:** GitHub sign-in returns to
  `https://www.sofyjaramillo.com/api/keystatic/github/oauth/callback`. Open the admin at
  `www.sofyjaramillo.com`; if `sofyjaramillo.com` (without `www`) is set in Vercel to redirect to
  `www`, that works too.
- **Changing the domain later:** add `https://<new-domain>/api/keystatic/github/oauth/callback`
  under GitHub → Settings → Developer settings → GitHub Apps → your app → **Callback URL**, and
  update `PRODUCTION_URL` in `lib/site.ts`.
- **Big photos:** photos uploaded through Keystatic are committed as they are. Phone photos
  around 2–4 MB are fine; resize anything much bigger before uploading.
- **Lost secrets:** if `.env` is lost, generate a new client secret in the GitHub App's settings,
  and set `KEYSTATIC_SECRET` to any random string of 40+ characters
  (`openssl rand -hex 40`). Update Vercel and redeploy.
