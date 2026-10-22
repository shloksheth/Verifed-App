# Startup, configuration, and visual assets

These small files connect the application to the browser. They are intentionally separate from meal rules and screen components.

## package.json and package-lock.json

The package manifest lists the exact library versions and the commands for development, production builds, previews, and tests. React renders the screens; Lucide provides consistent icons; the Supabase client manages sessions and database requests; html5-qrcode decodes camera images; qrcode generates restaurant links. Vite bundles the application. The lockfile records every resolved dependency so another installation can reproduce this build. Library source is third-party code, not student-authored code.

## index.html

The browser starts here. The root element is the place where React renders the application. The viewport meta tag makes layout sizes follow the phone screen, including safe areas. The theme color supplies the browser's frame color. The description identifies the application. The module script loads src/main.jsx.

## vite.config.js

The configuration enables Vite's official React plugin, which compiles JSX and supports fast refresh during development. Prettier is a development-only formatter: it expands code into consistent readable blocks without providing application behavior.

## src/main.jsx

This imports React, the application, and the shared component and brand stylesheets. createRoot attaches React to the root element, then renders App. Keeping startup separate makes it easier to find the actual screen and business logic.

## src/config.js and environment files

Configuration reads Vite environment variables first and otherwise uses this project's public Supabase URL and publishable key. A publishable key identifies the project; it is expected to be visible in browser code. It does not replace authentication or database row-level security. The service-role key must never be added. .env.example shows the names to set when copying the app to another project; .env.local is ignored by Git.

The project's authentication Site URL is configured to the hosted Verifed site. Its redirect allowlist includes that exact site's paths and the local development/preview origins at ports 5173 and 4174. Email delivery is a separate service setting: Supabase's built-in SMTP is limited to organization-team addresses until a custom email provider is configured. The application does not disable email confirmation to bypass that limit.

## public/assets/verifed-mark.png and the manifest

The final identity refines the user's carrot-shaped checkmark. It preserves the orange check and three green leaves, smooths the curves, simplifies the carrot markings and removes the colored background. It was edited with OpenAI's built-in image tool from the user-supplied logo; the original is retained. The PNG has transparency and is used by Logo, the home scan motif, favicon and web manifest. The earlier icon.svg is an unused initial concept.

The final prompt was: Refine this exact Verifed carrot-shaped checkmark logo for a polished dining mobile app. Preserve its recognizable single orange checkmark/carrot silhouette and three green leaves growing from upper right tip. Improve geometric balance, smooth clean curves, consistent thinner dark warm brown outline; simplify to two subtle carrot score lines. Flat vector-like crisp graphic, orange #F47B28, green #54863C, dark brown #35261B. No gradient, glow, shadow, grain, border, letters or background. Centered icon fills canvas with modest even padding. Transparent background. One mark only. The generated raster has slight tonal variation; it is not claimed as a manually constructed vector.

public/manifest.webmanifest names the app, sets theme/background colors and requests standalone browser display. This does not create an App Store or Play Store binary or imply offline support. public/assets/dining-hero.png is an unused earlier generated editorial bowl illustration, retained as an exploration artifact. It is not a real meal photograph. The final home screen uses a scan-first utility layout instead of that promotional hero.

## src/styles.css and src/brand.css

The base stylesheet contains component layout and responsive behavior; the final brand layer follows it. Separating the final brand revision makes the carrot identity and new home/auth layouts easy to locate. Both are imported by main.jsx. The CSS imports Google Fonts DM Sans with local system fallbacks; no app records are sent as font parameters.

## .gitignore and .openai/hosting.json

The ignore file excludes installed libraries, generated builds, local environment files and test output. The hosting manifest identifies the private Sites project and the dist directory containing the production bundle. Deployment tools use this identifier to update the correct site.

## Explain it in your own words

Follow the entry path: index.html loads main.jsx; main.jsx renders App; App reads the data adapter; the adapter either uses an explicitly labeled local demonstration or authenticated Supabase operations. The same React screens rearrange for phone and desktop widths. Read the frontend and backend guides next to trace a meal request end to end.

This implementation was made with AI assistance. Understand, test, and document your own changes and disclose that assistance honestly in a competition submission.

## Google sign-in setup status

The free Google project Verifed was created under shlok.sheth62@gmail.com (project ID bubbly-clarity-512223-v0). Its consent configuration is prepared but not submitted: Google requires agreement to the API Services User Data Policy, and the user's explicit approval is pending. No OAuth client or secret has been created, and the Supabase Google provider has not been enabled. The code path exists, but the sign-in button is intentionally disabled while setup is incomplete. VITE_GOOGLE_AUTH_ENABLED defaults to false; enable it only after the provider is configured and tested. Set it in the production build environment or supply it to the build. Do not put a Google client secret in a Vite variable or browser source.

The required Google Web application redirect is https://dpcxzqovrxvxeladucuz.supabase.co/auth/v1/callback. Only basic openid, email and profile scopes are needed; no Gmail or Drive access is part of this app. The existing prepared Cloud tab is the handoff point. Official setup reference: https://supabase.com/docs/guides/auth/social-login/auth-google.
