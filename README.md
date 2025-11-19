# dustCMS

A multi-tenant headless CMS with dynamic content modeling. Build custom content APIs for static sites with zero configuration.

## Features

- 🏢 **Multi-tenant**: Isolated databases and media per tenant
- 🎨 **Dynamic Content Modeling**: Create custom content types without code
- 🖼️ **Built-in Media Library**: Auto-optimized WebP images with Sharp
- 🚀 **Zero Config Deployment**: Single binary with SQLite
- 🔒 **Simple Auth**: Session-based admin authentication
- 📡 **REST API**: Auto-generated endpoints for all content models

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) runtime installed

### Installation

```bash
# Clone the repository
git clone git@github.com/yourusername/dustCMS.git
cd dustCMS

# Install dependencies
bun install

# Run setup wizard
bun run setup
```

The setup wizard will prompt you for:
1. **Base domain** (e.g., `cms.example.com`) - Where tenants will be accessed
2. **Super admin email** - Your login email
3. **Super admin password** - Must be at least 8 characters

### Start the Server

```bash
# Development mode (with hot reload)
bun dev

# Production mode
bun start
```

The server will start on `http://localhost:3000`

## Usage

### 1. Login to Admin Dashboard

Navigate to `http://localhost:3000/admin/login` and login with your super admin credentials.

### 2. Create a Tenant

1. Click "Create New Tenant"
2. Enter tenant details:
   - **Slug**: URL-safe identifier (e.g., `acme-corp`)
   - **Name**: Display name (e.g., `ACME Corporation`)
   - **Password**: Optional password for the tenant

Tenants are accessed at: `http://{slug}.{baseDomain}/`

### 3. Define Content Models

For each tenant, you can create content models:

**Content Model Types:**
- **Collection**: Multiple items (e.g., blog posts, events, team members)
- **Singleton**: Single object (e.g., homepage banner, site settings)

**Field Types:**
- `text` - Single line text
- `textarea` - Multi-line text
- `markdown` - Rich markdown editor
- `image` - Media library image selector
- `date` - Date/datetime picker
- `link` - URL with optional label

### 4. Add Content

Once models are defined, add content through the admin UI. Content is automatically available via the API.

### 5. Integrate with Your Static Site

Fetch content from your static site:

```html
<script>
  fetch('https://acme-corp.cms.example.com/api/content/events')
    .then(r => r.json())
    .then(({data}) => {
      // Render your events
      console.log(data);
    });
</script>
```

## API Endpoints

### Public API (Read-only, no auth)

```
GET  /api/content/:modelSlug           # Get collection or singleton
GET  /api/content/:modelSlug/:itemId   # Get single item
GET  /images/:filename                 # Get optimized image
```

### Admin API (Requires authentication)

```
# Tenants
GET    /api/admin/tenants              # List all tenants
POST   /api/admin/tenants              # Create tenant
DELETE /api/admin/tenants/:slug        # Delete tenant

# Content Models
GET    /api/admin/tenants/:slug/models
POST   /api/admin/tenants/:slug/models
PUT    /api/admin/tenants/:slug/models/:modelSlug
DELETE /api/admin/tenants/:slug/models/:modelSlug

# Content
POST   /api/admin/tenants/:slug/content/:modelSlug       # Create item
PUT    /api/admin/tenants/:slug/content/:modelSlug       # Update singleton
PATCH  /api/admin/tenants/:slug/content/:modelSlug/:id   # Update item
DELETE /api/admin/tenants/:slug/content/:modelSlug/:id   # Delete item

# Images
POST   /api/admin/tenants/:slug/images  # Upload images
```

## Production Deployment

### Build Standalone Binary

```bash
./build.sh
```

This creates a `cms-server` binary with all dependencies bundled.

### Run in Production

```bash
# First time setup
./cms-server setup

# Start server
./cms-server
```

### Systemd Service (Linux)

Create `/etc/systemd/system/dustcms.service`:

```ini
[Unit]
Description=dustCMS Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/dustcms
ExecStart=/opt/dustcms/cms-server
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable dustcms
sudo systemctl start dustcms
```

## Development

### Run Tests

```bash
# All tests
bun test

# Unit tests only
bun run test:unit

# Integration tests only
bun run test:integration

# Watch mode
bun run test:watch
```

### Project Structure

```
dustCMS/
├── src/
│   ├── config.ts           # Configuration
│   ├── main.ts             # Entry point & setup wizard
│   ├── server.ts           # Elysia server setup
│   ├── db/                 # Database layers
│   │   ├── system.ts       # System DB (tenants, admin)
│   │   ├── tenant.ts       # Tenant DBs
│   │   └── schema.ts       # Database schemas
│   ├── middleware/         # Auth & tenant middleware
│   ├── routes/             # API & UI routes
│   ├── services/           # Business logic
│   └── types/              # TypeScript types
├── templates/              # HTML templates
├── tests/                  # Test suites
├── data/                   # SQLite databases & media
└── build.sh                # Binary build script
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [Elysia](https://elysiajs.com)
- **Database**: SQLite (via `bun:sqlite`)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/)
- **Frontend**: HTMX + DaisyUI
- **Auth**: Session-based cookies

## Architecture

Each tenant has:
- Isolated SQLite database (`data/tenants/{slug}/content.db`)
- Isolated media directory (`data/tenants/{slug}/images/`)
- Subdomain routing (`{slug}.{baseDomain}`)

All content is stored in a single `content` table with JSONB fields, allowing for fully dynamic schemas without migrations.

## License

MIT

## Documentation

For the full vision and architectural details, see [VISION.md](./VISION.md).
