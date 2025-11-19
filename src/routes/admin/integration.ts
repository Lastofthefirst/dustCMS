import { Elysia } from 'elysia';
import { findContentModel } from '../../services/content';
import { config } from '../../config';

export const integrationRoutes = new Elysia()
  .get('/api/admin/tenants/:slug/integration/:modelSlug', ({ params, set }) => {
    const model = findContentModel(params.slug, params.modelSlug);
    if (!model) {
      set.status = 404;
      return { error: 'Content model not found' };
    }

    const baseDomain = config.baseDomain;
    const endpoint = `https://${params.slug}.${baseDomain}/api/content/${params.modelSlug}`;

    // Generate code snippets for different scenarios
    const snippets = {
      javascript: generateJavaScriptSnippet(endpoint, model),
      fetch: generateFetchSnippet(endpoint, model),
      html: generateHTMLSnippet(endpoint, model),
      curl: generateCurlSnippet(endpoint),
    };

    const instructions = generateInstructions(model, endpoint);

    return {
      model,
      endpoint,
      snippets,
      instructions,
    };
  });

function generateJavaScriptSnippet(endpoint: string, model: any): string {
  if (model.type === 'singleton') {
    return `// Fetch ${model.name} (Singleton)
async function get${toPascalCase(model.slug)}() {
  try {
    const response = await fetch('${endpoint}');
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ${model.name}:', error);
    return null;
  }
}

// Usage
const ${toCamelCase(model.slug)} = await get${toPascalCase(model.slug)}();
console.log(${toCamelCase(model.slug)});`;
  } else {
    return `// Fetch ${model.name} (Collection)
async function get${toPascalCase(model.slug)}() {
  try {
    const response = await fetch('${endpoint}');
    const { data } = await response.json();
    return data; // Array of items
  } catch (error) {
    console.error('Error fetching ${model.name}:', error);
    return [];
  }
}

// Fetch single item
async function get${toPascalCase(model.slug)}ById(id) {
  try {
    const response = await fetch(\`${endpoint}/\${id}\`);
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching item:', error);
    return null;
  }
}

// Usage
const ${toCamelCase(model.slug)} = await get${toPascalCase(model.slug)}();
${toCamelCase(model.slug)}.forEach(item => console.log(item));`;
  }
}

function generateFetchSnippet(endpoint: string, model: any): string {
  return `// Simple fetch example
fetch('${endpoint}')
  .then(res => res.json())
  .then(({ data }) => {
    console.log('${model.name}:', data);
    // Your code here
  })
  .catch(err => console.error(err));`;
}

function generateHTMLSnippet(endpoint: string, model: any): string {
  if (model.type === 'singleton') {
    const fields = model.fields.map((f: any) => `      <p><strong>${f.label || f.name}:</strong> \${data.${f.name}}</p>`).join('\n');
    return `<!-- ${model.name} Display -->
<div id="${model.slug}-container"></div>

<script>
  fetch('${endpoint}')
    .then(res => res.json())
    .then(({ data }) => {
      document.getElementById('${model.slug}-container').innerHTML = \`
        <div class="${model.slug}">
          <h2>${model.name}</h2>
${fields}
        </div>
      \`;
    });
</script>`;
  } else {
    const fields = model.fields.slice(0, 3).map((f: any) => `          <p><strong>${f.label || f.name}:</strong> \${item.${f.name}}</p>`).join('\n');
    return `<!-- ${model.name} List -->
<div id="${model.slug}-list"></div>

<script>
  fetch('${endpoint}')
    .then(res => res.json())
    .then(({ data }) => {
      const html = data.map(item => \`
        <div class="${model.slug}-item">
${fields}
        </div>
      \`).join('');
      document.getElementById('${model.slug}-list').innerHTML = html;
    });
</script>`;
  }
}

function generateCurlSnippet(endpoint: string): string {
  return `curl -X GET '${endpoint}' \\
  -H 'Accept: application/json'`;
}

function generateInstructions(model: any, endpoint: string): string {
  const type = model.type === 'singleton' ? 'singleton' : 'collection';

  return `## How to Use ${model.name} in Your Static Site

### API Endpoint
\`\`\`
${endpoint}
\`\`\`

### Response Format
${type === 'singleton' ?
`This is a **singleton** model, so it returns a single object:
\`\`\`json
{
  "data": {
    ${model.fields.map((f: any) => `"${f.name}": "${f.type === 'text' ? 'example text' : 'value'}"`).join(',\n    ')}
  }
}
\`\`\`` :
`This is a **collection** model, so it returns an array of items:
\`\`\`json
{
  "data": [
    {
      "id": 1,
      ${model.fields.map((f: any) => `"${f.name}": "${f.type === 'text' ? 'example text' : 'value'}"`).join(',\n      ')}
    }
  ]
}
\`\`\`

To fetch a single item, append the ID:
\`\`\`
${endpoint}/{id}
\`\`\``}

### Fields Available
${model.fields.map((f: any) => `- **${f.name}** (${f.type})${f.required ? ' - Required' : ''}`).join('\n')}

### Integration Steps
1. Copy one of the code snippets from the tabs above
2. Paste it into your static site's JavaScript file
3. Customize the HTML/CSS to match your design
4. The API is read-only and requires no authentication
5. Content updates automatically when you edit in the CMS

### Example Use Cases
${type === 'singleton' ?
`- Site configuration (logo, contact info, etc.)
- About page content
- Homepage hero section
- Global settings` :
`- Blog posts
- Team members
- Product listings
- Events calendar
- Testimonials`}

### Notes
- All requests are **CORS-enabled** for use on any domain
- The API returns JSON format
- Images are served as optimized WebP files
- Content is cached for fast delivery`;
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}
