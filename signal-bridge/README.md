# Signal bridge for the weigh-in nudge

Signal has no official bot/webhook API, so this uses
[bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api),
a widely-used community-maintained HTTP wrapper around `signal-cli`. It needs
somewhere with a persistent disk to run — Vercel can't host it — so it lives
here as a small always-on [Fly.io](https://fly.io) app instead. The Next.js
app (on Vercel) just makes an HTTP call to it once a day.

**Heads up before you start:** you chose to link this as a secondary device
on your own Signal account. That means every nudge message will show up in
the group as sent by *you*, personally — not a separate "bot" identity.
Signal caps how many devices can be linked to one account (a handful), and
unlinking/relinking other devices (like Signal Desktop) won't affect this,
but it's worth knowing this app now holds a persistent login to your account
that can send messages as you until you unlink it.

I can't do the steps below myself — they need your own Fly.io account and
your own phone to scan a QR code — but everything else (the app code, the
cron job, this config) is already built and pushed. This is also unverified
against a live instance: I have no network access to Fly.io or Signal from
where I'm running, so treat the exact API paths below as "correct per the
project's public docs," and confirm against the Swagger UI the container
serves at its root URL once it's actually deployed.

## One-time setup

1. **Install the Fly CLI and log in** (on your own machine):
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Pick a unique app name** and put it in `fly.toml` (replace
   `CHANGE-ME-weight-comp-signal-bridge` on the `app =` line) — Fly app names
   are global, so add something distinguishing.

3. **Create the app and its persistent volume** (must exist before first
   deploy, so the linked device's state survives restarts):
   ```bash
   cd signal-bridge
   fly apps create <your-app-name>
   fly volumes create signal_cli_data --size 1 --region syd -a <your-app-name>
   ```

4. **Deploy it:**
   ```bash
   fly deploy
   ```
   Your service is now at `https://<your-app-name>.fly.dev`.

5. **Link it to your Signal account.** Open (in a browser, or `curl`):
   ```
   https://<your-app-name>.fly.dev/v1/qrcodelink?device_name=weight-comp-bot
   ```
   This returns a QR code. On your phone: Signal → Settings → Linked Devices
   → **Link New Device** → scan it. Confirm it worked:
   ```bash
   curl https://<your-app-name>.fly.dev/v1/accounts
   ```
   should list your phone number.

6. **Find the target group's ID.** The linked account needs to already be a
   member of the Signal group you want nudges posted into (it's linked as
   *you*, so if you're already in the group, you're set). Then:
   ```bash
   curl https://<your-app-name>.fly.dev/v1/groups/<your-phone-number>
   ```
   Find the group in the list and copy its `id` (looks like
   `group.XXXXXXXXXXXXXXXXXXXXXXXX=`) — that's your `SIGNAL_RECIPIENT`.

7. **Set these in your Vercel project** (Settings → Environment Variables),
   matching what you just set up:
   - `SIGNAL_API_URL` = `https://<your-app-name>.fly.dev`
   - `SIGNAL_SENDER_NUMBER` = your linked phone number, e.g. `+15551234567`
   - `SIGNAL_RECIPIENT` = the group ID from step 6
   - `NUDGE_TIMEZONE` = `Pacific/Auckland` (or your group's actual timezone)
   - `CRON_SECRET` = a random string (`openssl rand -base64 32`) — Vercel
     Cron automatically sends this back as a Bearer token, which the route
     checks before doing anything

8. **Redeploy the Next.js app** so it picks up the new env vars, then test
   the endpoint directly (bypassing the schedule) with the same secret:
   ```bash
   curl -H "Authorization: Bearer <your CRON_SECRET>" \
     https://<your-vercel-app>.vercel.app/api/cron/nudge
   ```
   You should get back `{"sent":true,...}` or a `{"skipped":"..."}` if
   everyone's already logged in today (or the competition isn't active).

That's it — from here, Vercel Cron fires `/api/cron/nudge` daily per the
schedule in `vercel.json` (`0 19 * * *`, i.e. 19:00 UTC ≈ 7-8am NZ time
depending on daylight saving). Adjust that cron string if you want a
different time; Vercel's cron schedules are always in UTC.

## Cost

Fly.io's free allowance covers a single small always-on `shared-cpu-1x` /
256MB machine like this one in most cases, though that depends on your
account and what else you're running there — check Fly's current pricing
if you're unsure.
