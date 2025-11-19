# dustCMS - Quick Start Guide

A modern multi-tenant CMS with dynamic content modeling built with Bun, TypeScript, and HTMX.

## Features

- ✨ **Multi-tenant architecture** - Subdomain-based tenant isolation
- 🎨 **Dynamic content modeling** - Define custom content structures per tenant
- 🖼️ **Automatic image optimization** - WebP conversion with Sharp
- 🔒 **Simple authentication** - Single super-admin, plaintext passwords for tenants
- 📦 **Single binary deployment** - Compile to standalone executable
- 🚀 **Modern UI** - Built with DaisyUI and HTMX

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Run Development Server

```bash
bun run dev
```

The server will start at `http://localhost:3000`

### 3. Complete Setup Wizard

Visit `http://localhost:3000/setup` and follow the wizard:

- **Step 1**: Configure your base domain (e.g., `localhost` for development)
- **Step 2**: Create your super-admin account

### 4. Access Admin Dashboard

After setup, login at `http://localhost:3000/admin/login` with your super-admin credentials.

## Usage

### Creating a Tenant

1. From the admin dashboard, click **"Create New Tenant"**
2. Enter:
   - **Slug**: URL-friendly identifier (e.g., `acme-corp`)
   - **Name**: Display name (e.g., `ACME Corporation`)
   - **Password**: Simple password for the tenant (plaintext)
3. Click **"Create Tenant"**

The tenant will be accessible at `acme-corp.localhost:3000` (in development)

### Managing Content Models

1. Click **"Manage"** on a tenant card
2. Go to the **"Content Models"** tab
3. Click **"Create Model"** and define:
   - **Slug**: Model identifier (e.g., `events`)
   - **Name**: Display name (e.g., `Events`)
   - **Type**: Collection (multiple items) or Singleton (single item)
   - **Fields**: Add fields with types (text, textarea, markdown, image, date, link)

### Editing Content

1. From the tenant dashboard, go to **"Content Management"**
2. Click on a content model card
3. Add, edit, or delete content items

### Media Library

1. Go to the **"Media Library"** tab
2. Click **"Upload Image"** to add images
3. Images are automatically optimized to WebP
4. Click **"Copy URL"** to get the image path

### Public API Access

Content is accessible via REST API:

```bash
# Get all items from a collection
GET http://acme-corp.localhost:3000/api/content/events

# Get a single item
GET http://acme-corp.localhost:3000/api/content/events/1

# Get singleton content
GET http://acme-corp.localhost:3000/api/content/site_settings
```

## Building for Production

### Compile to Single Binary

```bash
./build.sh
```

This creates a `cms-server` executable containing everything.

### Run the Binary

```bash
# Run setup wizard
./cms-server setup

# Start server
./cms-server
```

## Project Structure

```
dustCMS/
├── src/
│   ├── db/              # Database layer (SQLite)
│   ├── middleware/      # Auth & tenant extraction
│   ├── models/          # TypeScript interfaces
│   ├── routes/          # API & UI routes
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   ├── config.ts        # Configuration
│   ├── server.ts        # HTTP server
│   └── main.ts          # Entry point
├── templates/           # HTML templates
│   ├── admin/          # Admin UI pages
│   └── layout.html     # Base layout
├── data/               # Runtime data (gitignored)
│   ├── system.db       # Super-admin & tenants
│   └── tenants/        # Tenant databases & images
├── package.json
├── tsconfig.json
└── build.sh
```

## Database Schema

### System Database (`data/system.db`)

```sql
super_admin (email, password_hash)
tenants (slug, name, password, created_at)
sessions (token, email, created_at)
```

### Tenant Database (`data/tenants/{slug}/content.db`)

```sql
content_models (slug, name, type, fields)
content_{model_slug} (id, ...dynamic fields)
```

## Environment Variables

Create a `.env` file:

```env
PORT=3000
BASE_DOMAIN=localhost
SESSION_SECRET=your-secret-key
DATA_DIR=./data
NODE_ENV=development
```

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Web Framework**: Elysia
- **Database**: SQLite (better-sqlite3)
- **Image Processing**: Sharp
- **Frontend**: HTMX + DaisyUI + Tailwind CSS

## Development Commands

```bash
# Run dev server with hot reload
bun run dev

# Build single binary
bun run build

# Run setup wizard
bun run setup
```

## API Examples

### Create Content Item (Admin API)

```bash
curl -X POST http://localhost:3000/api/admin/tenants/acme-corp/content/events \
  -H "Content-Type: application/json" \
  -b "session=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "Summer Festival",
    "date": "2024-07-15",
    "description": "Join us for our annual summer festival!"
  }'
```

### Upload Image (Admin API)

```bash
curl -X POST http://localhost:3000/api/admin/tenants/acme-corp/images \
  -b "session=YOUR_SESSION_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

## Security Notes

- Super-admin password is hashed with Bun's built-in password hashing (Argon2)
- Tenant passwords are stored in plaintext (by design, for simplicity)
- Sessions use secure HTTP-only cookies
- Image uploads are automatically optimized to prevent large files

## Deployment

For production deployment:

1. Build the binary: `./build.sh`
2. Copy `cms-server` to your server
3. Run setup: `./cms-server setup`
4. Configure reverse proxy (Caddy recommended for automatic SSL)
5. Start server: `./cms-server`

Example Caddyfile:

```
*.yourdomain.com {
    reverse_proxy localhost:3000
}
```

## License

See main README.md for license information.
