<!-- BEGIN:nextjs-agent-rules -->

# Next.js Agent Rules

## Next.js version

**This is NOT the Next.js version you may already know.**

This project may use a Next.js version with breaking changes to APIs, conventions, configuration, and file structure.

Before writing or modifying Next.js code:

- Read the relevant documentation inside `node_modules/next/dist/docs/`.
- Resolve the documentation path relative to this project.
- In a monorepo, the `next` package may not be installed at the repository root, so locate the correct package first.
- Follow deprecation notices and the documentation bundled with the installed Next.js version instead of relying only on previously learned Next.js conventions.

This block is automatically generated and may be re-added by `next dev`.

Implementation reference:

`node_modules/next/dist/server/lib/generate-agent-files.js`

Do not remove this block just to clean up a Git diff. If removed, `next dev` may recreate it and cause an uncommitted change again.

---

# Repository Instructions - phucnh

## 1. General code requirements

### Comments

When creating or modifying code:

- Every component must include a short comment explaining its purpose.
- Important functions and methods must include comments explaining what they do.
- Comments should focus on purpose, business logic, or intent rather than simply repeating the code syntax.
- Complex logic, business rules, and special conditions should include comments explaining why the logic exists.

TypeScript example:

```ts
/**
 * Displays the article list and allows the user to select an article for editing.
 */
export function ArticleList() {
    // ...
}

/**
 * Retrieves article information by ID.
 */
async function getArticleById(id: string): Promise<ArticleDto> {
    // ...
}
```

C# example:

```csharp
/// <summary>
/// Retrieves article information by ID.
/// </summary>
public async Task<ArticleDto> GetArticleAsync(Guid id)
{
    // ...
}
```

---

## 2. Build, test, and verification

After modifying code, **do not automatically run any build, test, lint, or type-check command** unless the user explicitly requests it.

This includes, but is not limited to:

- `dotnet build`
- `dotnet test`
- `npm run build`
- `npm test`
- `npm run lint`
- `yarn build`
- `yarn lint`
- `pnpm build`
- `pnpm lint`
- `ng build`
- `tsc`
- `tsc --noEmit`
- Any other command that may trigger compilation, build, linting, testing, or type checking

Compilation and build verification must be left to the user.

After completing code changes, the final summary must clearly state:

> Build/test/lint/type-check commands were not run according to the repository instructions.

Do not run a build simply to verify whether the modified code compiles unless the user explicitly asks for it.

---

## 3. C# backend

When modifying C# backend code:

- Do not run `dotnet build`.
- Do not run `dotnet test`.
- Do not run commands that may trigger a backend build.
- Leave compilation and build verification to the user.
- Prefer dependency injection through interfaces whenever an interface already exists.
- Do not inject concrete implementations when an appropriate contract or interface is available.

Preferred:

```csharp
private readonly IArticleRepository _articleRepository;

public ArticleAppService(IArticleRepository articleRepository)
{
    _articleRepository = articleRepository;
}
```

Avoid:

```csharp
private readonly ArticleRepository _articleRepository;
```

unless the framework or project architecture specifically requires the concrete implementation.

DTOs, entities, value objects, and implementation classes may remain classes where appropriate.

---

## 4. TypeScript strong typing

All new or modified TypeScript code must remain strongly typed.

### Do not use

- `any`
- `unknown` as a way to bypass proper typing
- `as any`
- `as unknown`
- Unsafe chained casts
- `@ts-ignore`
- Similar type-check suppression techniques

### Define and use named interfaces or types for

- Component props
- Component state
- API requests
- API responses
- Payloads
- Callbacks
- Service results
- Object shapes
- Form models
- Store state
- Store actions

Prefer existing generated DTOs, proxy interfaces, or existing project types before creating new ones.

Example:

```ts
interface ArticleListProps {
    categoryId: string;
    onSelect: (articleId: string) => void;
}

interface ArticleResponse {
    id: string;
    title: string;
    content: string;
}
```

Do not write:

```ts
function handleArticle(data: any) {
    // ...
}
```

---

## 5. Documentation language

When creating or updating:

- Markdown files
- README files
- Technical documentation
- User guides
- Business documentation
- Long-form business logic comments
- Repository instructions or guides

use **Vietnamese with proper diacritics**, unless the user explicitly requests another language.

The following should continue following the existing source-code naming conventions:

- Classes
- Functions
- Variables
- Interfaces
- Types
- APIs
- Database fields

---

## 6. Rules when modifying code

When handling a code modification request:

1. Read the existing code and relevant project structure before making changes.
2. For Next.js-related changes, check the relevant documentation in `node_modules/next/dist/docs/` when the task involves Next.js APIs, conventions, routing, rendering, caching, configuration, or project structure.
3. Reuse existing components, hooks, services, DTOs, interfaces, and utilities whenever appropriate.
4. Do not introduce unnecessary abstractions.
5. Do not modify unrelated logic outside the requested scope unless it is necessary for the requested change.
6. Preserve the existing coding conventions and architectural style of the project.
7. Add comments to components and important functions or methods.
8. Maintain strong typing.
9. Do not automatically run build, test, lint, or type-check commands.
10. After completing the task, provide a concise summary containing:
    - What was changed.
    - Which files were modified.
    - How the main logic changed.
    - Confirmation that build/test/lint/type-check commands were not run.

---

## 7. Priority rules

If there is a conflict between:

- previously learned Next.js knowledge,
- common Next.js conventions,
- and the documentation bundled with the installed Next.js version,

the documentation inside `node_modules/next/dist/docs/` for the current project takes priority.

If there is a conflict between common implementation practices and these repository instructions, these repository instructions take priority.

<!-- END:nextjs-agent-rules -->