# **Multi-Tenant CMS - Minimal Vibe Coding Spec**

## **Tech Stack (Final)**

| Layer | Choice | Vibe Coding Reason |
|-------|--------|-------------------|
| **Runtime** | **Bun** | Compile to single binary; Sharp just works |
| **Language** | **TypeScript** | LLM makes fewer mistakes; types guide corrections |
| **DB** | **SQLite per tenant** | One file per tenant; backup = `cp` |
| **Images** | **Sharp** | `sharp().resize(800).webp()` - one line, always works |
| **Admin UI** | **HTMX + DaisyUI** | Vendored CSS; LLM writes HTML that works first time |
| **Auth** | **Single super-admin** | No email; password stored plaintext (admin owns everything) |
| **Deployment** | **Single binary** | `./build.sh` → `cms-server`; scp and run |

---

## **Architecture**

```
Binary: cms-server
Data:   data/
        ├── system.db        -- tenants: slug, name, password, created_at
        └── tenants/
            ├── acme-corp/
            │   ├── content.db    -- content models and data
            │   └── images/       -- optimized .webp files
            └── beta-max/
```

**Request Flow (Example)**:
```
GET acme-corp.cms.mainbizsite.org/api/content/events
  ↓
Extract slug "acme-corp" from subdomain
  ↓
Check data/tenants/acme-corp exists → 404 if not
  ↓
Query "events" model in content.db
  ↓
Serve JSON to static site
```

---

## **Auth (Simplified)**

**Single super-admin account** stored in `system.db`:

```sql
-- system.db
CREATE TABLE tenants (
  slug TEXT PRIMARY KEY,          -- "acme-corp"
  name TEXT,                      -- "ACME Corporation"
  password TEXT,                  -- "client-password-123" (plaintext, admin can see it)
  created_at INTEGER
);

CREATE TABLE super_admin (
  email TEXT PRIMARY KEY,
  password_hash TEXT              -- bcrypt hash only for super-admin
);
```

**Login Flow**:
- Super-admin logs in at `cms.mainbizsite.org/admin/login`
- Cookie `session=super:${token}` set on `.cms.mainbizsite.org` domain
- This cookie grants access to **all** tenant subdomains and administrative functions.
- Tenants are created and managed within the super-admin UI.

**Session Middleware**:
```typescript
const cookie = request.headers.get('cookie');
if (cookie?.includes('session=super:')) {
  // Super-admin mode: can access any tenant
  tenant = await getTenantFromSubdomain(request);
} else {
  // Public API mode: serve read-only JSON
  tenant = await getTenantFromSubdomain(request);
}
```

---

## **Content Modeling (The Core Concept)**

The CMS does not have hardcoded content types. Instead, a super-admin defines **Content Models** for each tenant. A client then adds content that conforms to the structure of these models.

**Model Types**:
- **Collection**: An array of items, like a list of blog posts, events, or team members. Accessed via `/api/content/:model_slug`.
- **Singleton**: A single object of fields, like a site-wide banner or a settings page. Accessed via `/api/content/:model_slug`.

**Field Types**:
Each model is composed of fields. Available field types include:
- `text`: A single line of text (e.g., title, name).
- `textarea`: A multi-line block of text.
- `markdown`: A full markdown editor.
- `image`: An image from the media library.
- `date`: A date or datetime.
- `link`: A URL with optional text.

**Example**: A typical "Events" feature is just a **Collection** model named `events` with fields like `title` (text), `date` (date), `description` (textarea), `image_url` (image), and `registration_link` (link).

### **Schema Editor**

The super-admin dashboard will include a **Schema Editor**. This UI allows the admin to visually define and manage multiple content models for each tenant. For each model, the admin can:
-   Create a new Collection or Singleton model.
-   Add, edit, or remove fields (`text`, `image`, `date`, etc.).
-   Define properties for each field (e.g., making a text field "required").

This allows for a fully customizable content structure for each client site.

---

## **Admin UI (Generated from Content Models)**

The tenant-facing admin UI is dynamically generated based on the Content Models defined by the super-admin. Below are examples of what the UI for a few different model types might look like.

### **Example: "Events" (Collection)**
Shows a table of events with inline edit/delete.

```html
<!-- admin/content/events.html -->
<table class="table">
  <thead>
    <tr>
      <th>Title</th>
      <th>Date</th>
      <th>Image</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody hx-get="/admin/content/events/data" hx-trigger="load">
    <!-- LLM generates this row template based on the model's fields:
    <tr>
      <td>Annual Summit</td>
      <td>2025-06-15</td>
      <td><img src="/images/hero.webp" class="w-16 h-16 object-cover"></td>
      <td>
        <button class="btn btn-sm" hx-get="/admin/content/events/{{id}}/edit">Edit</button>
        <button class="btn btn-sm btn-error" hx-delete="/api/content/events/{{id}}">Delete</button>
      </td>
    </tr>
    -->
  </tbody>
</table>
```

### **Example: "Pages" (Collection of Markdown)**
A list of markdown files, editable on click. This could be a Collection model where each item has just a `slug` and `body` (markdown) field.

```html
<!-- admin/content/pages.html -->
<ul class="menu bg-base-200 rounded-box">
  <li><a hx-get="/admin/content/pages/about-us/edit">about-us</a></li>
  <li><a hx-get="/admin/content/pages/contact/edit">contact</a></li>
</ul>
<textarea class="w-full h-96 font-mono" 
          hx-post="/api/content/pages/{{slug}}" 
          hx-trigger="keyup delay:2s"># Markdown content...</textarea>
```

### **Media Library**
A central place to manage all images for a tenant.

```html
<!-- admin/images.html -->
<form hx-post="/api/images" hx-encoding="multipart/form-data">
  <input type="file" name="images" multiple class="file-input">
  <button class="btn">Upload</button>
</form>
<div class="grid grid-cols-3 gap-4 mt-4">
  <!-- LLM generates:
  <div class="card">
    <img src="/images/logo.webp" class="w-full">
    <button class="btn btn-sm" onclick="copy('/images/logo.webp')">Copy URL</button>
  </div>
  -->
</div>
```

---

## **API Endpoints (Generic & Dynamic)**

**Public API (read-only, no auth)**
```typescript
// Get a collection (e.g., all events) or a singleton (e.g., the site banner)
GET  /api/content/:model_slug   → { data: [...] } or { data: {...} }

// Get a single item from a collection
GET  /api/content/:model_slug/:item_id → { data: {...} }

// Serve an image from the tenant's media library
GET  /images/:filename          → Binary webp file (path sanitized)
```

**Admin API (requires super-admin session)**
```typescript
// --- Content Management ---
POST   /api/content/:model_slug   → Create an item in a collection (form data)
PATCH  /api/content/:model_slug/:item_id → Update an item
PUT    /api/content/:model_slug   → Update a singleton
DELETE /api/content/:model_slug/:item_id → Delete an item from a collection

// --- Media Management ---
POST   /api/images                → Upload + optimize image(s)

// --- Tenant Management (Super-admin only) ---
GET    /admin/tenants             → List all tenants
POST   /admin/tenants             → Create a new tenant (name, slug)
```

**Image Optimization**:
```typescript
// In POST /api/images handler
const filename = `${Date.now()}-${sanitize(file.name)}.webp`;
await sharp(file)
  .resize(800, null, { withoutEnlargement: true })
  .webp({ quality: 85 })
  .toFile(`data/tenants/${tenant.slug}/images/${filename}`);
return { url: `/images/${filename}` };
```

---

## **Setup Wizard (Server Installation)**

The setup wizard is an opinionated, one-time script to get the server running. It configures the essential system-level settings. **It does not create tenants.** Tenants are created by the super-admin via the web UI after setup is complete.

```bash
$ ./cms-server setup
```

**Step 1: Base Domain**
```
> Base domain for the admin panel (e.g., cms.your-agency.com):
  cms.dustbunny.dev

✓ Base domain set.
```

**Step 2: Super-Admin Password**
```
> Create a super-admin password (min 12 chars):
  ************

✓ Hash stored in data/system.db
```

The server binary will have Caddy integrated for fully automated reverse proxying and SSL certificate management (via Let's Encrypt) for the base domain and all tenant subdomains. This provides a zero-config HTTPS setup.

**Post-Setup:**
You can now start the server with `./cms-server` and log in to create tenants at `https://cms.dustbunny.dev/admin`.

---

## **LLM Vibe Coding Prompts**

**Modify a content model:**
```
Add a "speaker_name" (text) field to the "events" content model.
Update the admin UI table to show this new field.
Ensure it's included in the public API response for events.
```

**Create a new content model:**
```
Define a new **Collection** content model named "team_members".
It should have the fields:
- name (text)
- bio (textarea)
- headshot (image)

The admin UI for "/admin/content/team_members" should let me:
- See a table of all members
- Add a new member in a modal form
- Upload and select a headshot

The public API at GET /api/content/team_members should return all members.
```

**Fix image upload:**
```
POST /api/images is failing with "EISDIR: illegal operation on a directory"
Add error handling that returns a 400 with a clear message if no file was uploaded.
```

---

## **Static Site Integration (Example)**

```html
<script>
  // Load events from the dynamic content API and render cards
  const model = 'events';
  fetch(`https://acme-corp.cms.mainbizsite.org/api/content/${model}`)
    .then(r => r.json())
    .then(({data}) => {
      document.getElementById('grid').innerHTML = data.map(e => `
        <div class="card">
          <img src="${e.image_url}" loading="lazy">
          <div class="card-body">
            <h2>${e.title}</h2>
            <p>${e.description}</p>
            <a href="${e.registration_link.url}" class="btn">Register</a>
          </div>
        </div>
      `).join('');
    });
</script>
```

**Good practice**: Yes, this pattern is correct. Static site has zero backend, fetches JSON from the CMS, and renders content. This makes it fast, secure, and easy to host on a CDN.
