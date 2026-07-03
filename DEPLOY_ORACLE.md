# Deploy Accelance on Oracle Cloud Always Free

**VM specs:** 4 OCPUs, 24 GB RAM, ARM64 — free forever. Uses your existing Neon database.  
**Estimated time:** ~60 minutes (most of it is the first Docker build).

---

## Phase 1 — Create Oracle Cloud Account & VM (~25 min)

### Step 1 — Sign up at cloud.oracle.com

- Requires a credit card for identity verification — you will **not be charged** for Always Free resources.
- Choose your **Home Region** (e.g. London, Frankfurt, Mumbai) during signup — **it cannot be changed later**. Pick the region closest to your users.
- Account approval can take 10–30 minutes. If the "Create Instance" button stays greyed out, wait and refresh.

### Step 2 — Create the ARM VM instance

Go to **Compute → Instances → Create Instance** and configure:

| Setting | Value |
|---|---|
| Image | **Ubuntu 22.04** (not Oracle Linux — Docker is easier here) |
| Shape | **VM.Standard.A1.Flex** → click "Change Shape" → Ampere |
| OCPU count | **4** (the full always-free quota) |
| Memory | **24 GB** |
| SSH key | Generate a key pair → download the `.key` private key file |
| Boot volume | 50 GB (default is fine) |

> Under **Networking**, make sure "Assign a public IPv4 address" is **enabled**. Note the public IP — you need it throughout.

### Step 3 — Open ports in the OCI Security List

Go to **Networking → Virtual Cloud Networks → your VCN → Security Lists → Default Security List → Add Ingress Rules**.

| Source CIDR | Protocol | Port | Purpose |
|---|---|---|---|
| 0.0.0.0/0 | TCP | 22 | SSH |
| 0.0.0.0/0 | TCP | 80 | HTTP (app) |
| 0.0.0.0/0 | TCP | 443 | HTTPS |

---

## Phase 2 — Configure the VM & Install Docker (~15 min)

### Step 4 — SSH into the VM

From your local machine (Git Bash or Terminal):

```bash
# Set correct permissions on the key first (Mac/Linux)
chmod 400 ~/Downloads/ssh-key.key

# Connect
ssh -i ~/Downloads/ssh-key.key ubuntu@YOUR_VM_IP
```

> **Windows PowerShell:** use `icacls "ssh-key.key" /inheritance:r /grant:r "%USERNAME%:R"` instead of chmod.

### Step 5 — Open ports in the OS firewall (iptables)

> ⚠️ **This is the most commonly missed step.** Oracle's Ubuntu images have iptables rules that drop all incoming traffic by default — even if the OCI Security List allows it.

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Save so rules survive reboots
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
```

### Step 6 — Install Docker

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to the docker group (avoids sudo on every command)
sudo usermod -aG docker ubuntu

# Log out and back in for the group change to take effect
exit
```

Reconnect, then verify:

```bash
ssh -i ~/Downloads/ssh-key.key ubuntu@YOUR_VM_IP
docker run hello-world   # should print "Hello from Docker!"
```

---

## Phase 3 — Deploy the Application (~30 min, first build)

### Step 7 — Get the code onto the server

**Option A — if the repo is on GitHub:**
```bash
git clone https://github.com/your-org/your-repo.git accelance
cd accelance
```

**Option B — copy from your local machine (run this locally):**
```bash
scp -i ~/Downloads/ssh-key.key -r \
  "d:/Accelance AI Platform/AI-Platform-Internal" \
  ubuntu@YOUR_VM_IP:~/accelance
```
Then on the VM: `cd ~/accelance`

### Step 8 — Create `.env.production`

First generate the three secret values. Run this command **3 separate times** to get 3 unique secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then create the file inside `~/accelance/`:

```bash
nano .env.production
```

Paste and fill in your values:

```env
# ── Platform ──────────────────────────────────────
ACCELANCE_PLATFORM=enterprise
PORT=3000

# ── Database (your Neon connection) ───────────────
DATABASE_TYPE=postgres
DATABASE_HOST=your-project.neon.tech
DATABASE_PORT=5432
DATABASE_USER=neondb_owner
DATABASE_PASSWORD=your_neon_password
DATABASE_NAME=neondb
DATABASE_SSL=true

# ── Paths (mapped to Docker volume) ───────────────
SECRETKEY_PATH=/data/secrets
BLOB_STORAGE_PATH=/data/storage
STORAGE_TYPE=local

# ── IMPORTANT: must be exactly 32 characters ──────
# Prevents credential decryption failure on restart.
SECRETKEY_OVERWRITE=exactly_32_chars_replace_thisxx

# ── Auth secrets (3 unique values from above) ─────
JWT_AUTH_TOKEN_SECRET=paste_first_64_byte_hex_here
JWT_REFRESH_TOKEN_SECRET=paste_second_64_byte_hex_here
EXPRESS_SESSION_SECRET=paste_third_value_here
JWT_ISSUER=Accelance
JWT_AUDIENCE=Accelance

# ── App URL ────────────────────────────────────────
APP_URL=http://YOUR_VM_IP

DISABLE_TELEMETRY=true
```

> ⚠️ `SECRETKEY_OVERWRITE` must be **exactly 32 characters**. Count carefully. Wrong length = app fails to decrypt saved API keys on restart.

### Step 9 — Create `docker-compose.yml`

```bash
nano docker-compose.yml
```

```yaml
services:
  accelance:
    build: .
    container_name: accelance
    restart: unless-stopped
    ports:
      - "80:3000"
    env_file:
      - .env.production
    volumes:
      - accelance_data:/data
    environment:
      - SECRETKEY_PATH=/data/secrets
      - BLOB_STORAGE_PATH=/data/storage

volumes:
  accelance_data:
```

### Step 10 — Build and start

```bash
# Build the image and start in detached mode
docker compose up --build -d

# Watch the startup logs (Ctrl+C stops watching; container keeps running)
docker compose logs -f accelance
```

The first build takes **15–25 minutes** — it compiles the entire monorepo. Subsequent builds reuse the Docker cache and take ~3 minutes.

The app is ready when you see: **"Accelance server is listening on port 3000"**

---

## Phase 4 — First-time Setup (~5 min)

### Step 11 — Register the admin user

Open your browser and go to:

```
http://YOUR_VM_IP/register
```

The **first user to register** automatically becomes the organization owner (OWNER role). Do this before sharing the URL with your team.

> ⚠️ If you can't reach the URL, the most likely cause is the iptables step was skipped. SSH back in and re-run Step 5.

### Step 12 — Useful management commands

```bash
# Stop the app
docker compose down

# Restart
docker compose up -d

# Pull latest code + rebuild (for updates)
git pull && docker compose up --build -d

# View logs
docker compose logs -f accelance

# Check memory/CPU usage
docker stats accelance
```

---

## Phase 5 — Free HTTPS with Cloudflare Tunnel (Optional, ~10 min)

Gives you a public `*.trycloudflare.com` HTTPS URL — no domain purchase needed. Good for demos.

```bash
# Install cloudflared (ARM64 binary)
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb

# Start the tunnel (points at your app on port 80)
cloudflared tunnel --url http://localhost:80
```

The command prints a URL like `https://some-name.trycloudflare.com` — share this with demo attendees.

> ⚠️ After you get the Cloudflare URL, update **APP_URL** in `.env.production` to that URL, then rebuild: `docker compose up --build -d`. Otherwise invite emails will contain the wrong link.

For a **permanent tunnel** (survives reboots), create a named tunnel via the Cloudflare dashboard (free with a Cloudflare account), then run `cloudflared service install`.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Can't reach the app in browser | iptables blocking port 80 | Re-run Step 5 |
| App crashes on startup | Wrong `SECRETKEY_OVERWRITE` length | Check it's exactly 32 chars |
| "credential decryption failed" | `SECRETKEY_OVERWRITE` changed | Use the same value as first deploy |
| Build runs out of memory | Shouldn't happen with 24 GB | Check with `docker stats` |
| SSH connection refused | VM still provisioning | Wait 2–3 min after instance shows "Running" |
