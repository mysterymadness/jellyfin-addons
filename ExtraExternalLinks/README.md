<h1 align="center">
  Extra External Links Addon
</h1>

<p align="center">
  Adds provider logo buttons to Jellyfin item pages from URLs in the item description.
</p>

<p align="center">
  <a href="../ADDONS.md"><img alt="All Addons" src="../docs/assets/badge-all-addons.svg"></a>
  <a href="src/providers.js"><img alt="Providers" src="../docs/assets/badge-providers.svg"></a>
  <a href="injector.js"><img alt="Injector" src="../docs/assets/badge-injector.svg"></a>
</p>

## What It Does

This addon scans a Jellyfin detail-page description for configured provider URLs.

When it finds one, it:

1. Detects which provider the URL belongs to.
2. Removes the raw URL from the description text.
3. Adds a Jellyfin-style external-link button.
4. Adds the same comma separator Jellyfin uses between external links.
5. Replaces the button text with the provider logo.

Example providers are already included for Newgrounds and YouTube.

## Folder Layout

```text
ExtraExternalLinks
├── README.md
├── injector.js
├── src
│   ├── providers.js
│   └── external-links.js
├── styles
│   └── external-links.css
└── assets
    ├── Newgrounds
    │   └── image.png
    └── Youtube
        └── image.png
```

## Setup

Open `injector.js` and change:

```javascript
const PROJECT_BASE =
    "https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@main/ExtraExternalLinks/";
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your real GitHub username and repository name.

Example:

```javascript
const PROJECT_BASE =
    "https://cdn.jsdelivr.net/gh/myname/jellyfin-addons@main/ExtraExternalLinks/";
```

Then paste the full contents of `injector.js` into Jellyfin JavaScript Injector.

## Provider Config

Providers are configured in [src/providers.js](src/providers.js).

Each provider has:

```javascript
{
    key: "newgrounds",
    displayName: "Newgrounds",
    domains: ["newgrounds.com", "www.newgrounds.com"],
    asset: "assets/Newgrounds/image.png",
    logoHeight: 25,
}
```

Logo width is detected automatically from the image ratio. The addon keeps the height at `logoHeight` and calculates the width from the image's natural size.

If automatic sizing does not look right, set the width yourself:

```javascript
{
    key: "newgrounds",
    displayName: "Newgrounds",
    domains: ["newgrounds.com", "www.newgrounds.com"],
    asset: "assets/Newgrounds/image.png",
    logoHeight: 25,
    logoWidth: 145,
}
```

You can also change the defaults at the top of `src/providers.js`:

```javascript
defaultLogoHeight: 25,
fallbackLogoWidth: 145,
```

## Add A Provider

1. Create a new asset folder:

```text
assets/ProviderName/image.png
```

2. Add the provider to `src/providers.js`:

```javascript
{
    key: "providername",
    displayName: "Provider Name",
    domains: ["provider.com", "www.provider.com"],
    asset: "assets/ProviderName/image.png",
    logoHeight: 25,
}
```

3. Commit and push the changes to GitHub.

## Why There Is An Injector File

JavaScript does not support CSS-style `@import`.

This will not work in Jellyfin JavaScript Injector:

```javascript
@import "https://example.com/script.js";
```

The small `injector.js` file is the reliable replacement. It loads:

```text
styles/external-links.css
src/providers.js
src/external-links.js
```

That gives you one Jellyfin entry while keeping the addon files modular.

## Cache Notes

jsDelivr can cache GitHub files.

If you update a file and Jellyfin does not change right away, purge the changed file at:

```text
https://www.jsdelivr.com/tools/purge
```

Example file URL:

```text
https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@main/ExtraExternalLinks/src/providers.js
```

## Troubleshooting

If a provider button does not appear:

1. Make sure the Jellyfin item description contains the provider URL.
2. Make sure the provider domain is listed in `src/providers.js`.
3. Make sure the image exists at the configured asset path.
4. Make sure the GitHub repository is public.
5. Temporarily set `debug: true` in `src/providers.js` and check the browser console.
