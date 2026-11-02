# AVM Labs Website

The live page is **`AVM Labs Website.dc.html`**. It is generated from `src/`, so edit the files in `src/` and then rebuild:

```
node build.js          # rebuild AVM Labs Website.dc.html
node build.js --check  # confirm the built file matches src/
```

The Claude Design runtime (`support.js`) reads the markup and logic only from inside that one `.dc.html` file, so the build puts every part back into a single file.

## Layout

```
src/
  index.html                 page skeleton: page routing (sc-if) and the order of every part
  config/settings.json       editor settings: location, WhatsApp numbers, addresses, fees
  styles/global.css          global styles and animations (keyframes)
  components/                shared UI
    location-gate.html         country / location prompt
    header.html                top bar, location picker, nav, cart button
    footer.html
    mobile-tabs.html           bottom tab bar (mobile)
    tests-bar.html             floating cart summary on the Tests page
    cart-bar.html              checkout bar on the Cart page
    whatsapp-fab.html          WhatsApp button
    toast.html                 short notifications
    booking-confirmed.html     booking success dialog
  pages/
    home/hero.html             hero, search, categories, slider
    home/health-profiles.html  profile reel tiles
    home/most-booked.html      popular tests
    home/centres.html          centres and country ticker
    tests.html  profiles.html  cart.html  test-detail.html  about.html
  reels/
    reels-desktop.html         full-screen profile viewer (desktop)
    reels-mobile.html          swipe viewer (mobile)
  logic/                       the Component class body, split in order
    01-data.js                 categories, tests, details, profiles, slots
    02-state.js                initial state, catalogue, options
    03-region-pricing.js       regions, currency, location detection
    04-navigation-cart.js      navigation, cart, profile matching, bill
    05-booking.js              dates, form validation, confirm
    06-reels.js                reel viewer, swipe, share
    07-lifecycle.js            mount / update / unmount
    08-render-values.js        values the templates bind to
assets/                      logo and 3D category icons
support.js icon.js image-slot.js   runtime scripts (keep beside the .dc.html)
.image-slots.state.json      images placed in image slots (keep beside the .dc.html)
```

The `logic/*.js` files are pieces of one class (`class Component extends DCLogic { ... }` in `src/index.html`), so each one is not a standalone module.
