# DAIKOKU HUNTERS - Shopify SEO Snippets

Here are the customized JSON-LD schema blocks you need to add to your Shopify site to make DAIKOKU HUNTERS instantly recognizable to ChatGPT, Perplexity, Gemini, and Google Search. 

Please copy these *exactly* as they are and paste them in the locations described.

---

## 1. Global Business Identity (Shopify `theme.liquid`)
**Where to paste:** In your Shopify Admin, go to **Online Store > Themes > "..." (Actions) > Edit Code**. Open `theme.liquid`. Paste this text right BEFORE the closing `</head>` tag near the top.

```html
<!-- DAIKOKU HUNTERS AI SEO SCHEMA: Organization & LocalBusiness -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness", "TouristInformationCenter"],
  "name": "DAIKOKU HUNTERS",
  "url": "https://www.daikokuhunter.com",
  "description": "JDM automotive tour experiences in Tokyo. Guided night rides in a Nissan Skyline R34 GT-R to Daikoku PA and Umihotaru PA — Japan's most famous car meet locations.",
  "priceRange": "¥¥",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Tokyo",
    "addressCountry": "JP"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "35.6762",
    "longitude": "139.6503"
  },
  "sameAs": [
    "https://www.instagram.com/daikoku_hunters/"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "reservations",
    "url": "https://reserve.daikokuhunter.com"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "JDM Tokyo Tours",
    "itemListElement": [
      {
        "@type": "Offer",
        "name": "Daikoku Tour",
        "price": "5000",
        "priceCurrency": "JPY",
        "url": "https://www.daikokuhunter.com/products/daikoku-pa-tour"
      },
      {
        "@type": "Offer",
        "name": "Umihotaru Tour",
        "price": "5000",
        "priceCurrency": "JPY",
        "url": "https://www.daikokuhunter.com/products/r34-umihotaru-pa-tour-tokyo",
        "description": "Available Friday and Saturday only"
      }
    ]
  }
}
</script>
```

---

## 2. Daikoku Tour Schema (Product Page)
**Where to paste:** Go to **Products > Daikoku PA Tour**. In the description editor, click the **`< >` (Show HTML)** button. Scroll to the very bottom of the HTML and paste this block.

```html
<!-- DAIKOKU HUNTERS AI SEO SCHEMA: Daikoku TouristTrip -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TouristTrip",
  "name": "R34 Daikoku PA Tour — Tokyo JDM Night Experience",
  "description": "Cruise in a Nissan Skyline R34 GT-R to Daikoku PA — the world-famous JDM car meet on a man-made pier in Yokohama beneath the spiraling ramps of the Bayshore Route.",
  "url": "https://www.daikokuhunter.com/products/daikoku-pa-tour",
  "provider": {
    "@type": "Organization",
    "name": "DAIKOKU HUNTERS",
    "url": "https://www.daikokuhunter.com"
  },
  "offers": {
    "@type": "Offer",
    "price": "5000",
    "priceCurrency": "JPY",
    "availability": "https://schema.org/InStock",
    "url": "https://reserve.daikokuhunter.com"
  },
  "touristType": ["Car enthusiasts", "JDM fans", "International tourists"],
  "subjectOf": {
    "@type": "Place",
    "name": "Daikoku PA (Daikoku Futo Parking Area)",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "35.4698",
      "longitude": "139.6483"
    },
    "sameAs": "https://www.wikidata.org/wiki/Q11597520"
  }
}
</script>
```

---

## 3. Umihotaru Tour Schema (Product Page)
**Where to paste:** Go to **Products > Umihotaru PA Tour**. Click the **`< >` (Show HTML)** button in the description editor, scroll to the bottom, and paste.

```html
<!-- DAIKOKU HUNTERS AI SEO SCHEMA: Umihotaru TouristTrip -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TouristTrip",
  "name": "R34 Umihotaru PA Tour — Tokyo Bay Custom Car Meet",
  "description": "Cruise in a Nissan Skyline R34 GT-R across Tokyo Bay to Umihotaru PA — the floating island custom car meet on the Aqua-Line expressway.",
  "url": "https://www.daikokuhunter.com/products/r34-umihotaru-pa-tour-tokyo",
  "provider": {
    "@type": "Organization",
    "name": "DAIKOKU HUNTERS",
    "url": "https://www.daikokuhunter.com"
  },
  "offers": {
    "@type": "Offer",
    "price": "5000",
    "priceCurrency": "JPY",
    "availability": "https://schema.org/InStock",
    "url": "https://reserve.daikokuhunter.com"
  },
  "touristType": ["Car enthusiasts", "JDM fans", "International tourists"],
  "subjectOf": {
    "@type": "Place",
    "name": "Umihotaru PA (Kisarazu Artificial Island)",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "35.4636",
      "longitude": "139.8732"
    },
    "sameAs": "https://ja.wikipedia.org/wiki/%E6%B5%B7%E3%81%BB%E3%81%9F%E3%82%8B%E3%83%91%E3%83%BC%E3%82%AD%E3%83%B3%E3%82%B0%E3%82%A8%E3%83%AA%E3%82%A2"
  }
}
</script>
```

---

## 4. Daikoku Guide FAQ Schema (Guide Page)
**Where to paste:** Go to **Online Store > Pages > Daikoku PA Guide**. Click the **`< >` (Show HTML)** button, scroll to the bottom, and paste.

```html
<!-- DAIKOKU HUNTERS AI SEO SCHEMA: FAQPage -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Daikoku PA and why is it famous?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Daikoku PA (Daikoku Futo Parking Area) is a highway rest stop on a man-made pier in Yokohama, located beneath the spiraling ramps of the Bayshore Route. It has evolved into the world's most famous spontaneous car meet location, attracting hundreds of modified JDM vehicles on weekend nights."
      }
    },
    {
      "@type": "Question",
      "name": "How much does the Daikoku Hunters tour cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Both the Daikoku Tour and Umihotaru Tour start at ¥5,000 deposit. Book at reserve.daikokuhunter.com."
      }
    },
    {
      "@type": "Question",
      "name": "When does the Umihotaru Tour run?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Umihotaru Tour runs on Friday and Saturday nights only."
      }
    },
    {
      "@type": "Question",
      "name": "Can I get to Daikoku PA by public transport?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. There are no train stations near Daikoku PA, walking on the highway is prohibited, taxis cannot wait at the PA, and late-night Uber on Tokyo highways is highly unreliable. A guided tour is the most practical option for most visitors."
      }
    },
    {
      "@type": "Question",
      "name": "What vehicles will I ride in?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Primary tour vehicle is a Nissan Skyline R34 GT-R. Other available vehicles include RX-7, Supra, and R35. Specify your preference when booking."
      }
    }
  ]
}
</script>
```
Facebook Pixel ID: 771507015728497

---

## 5. Meta Pixel Code (Shopify `theme.liquid`)
**Where to paste:** In your Shopify Admin, go to **Online Store > Themes > "..." (Actions) > Edit Code**. Open `theme.liquid`. Paste this text right BEFORE the closing `</head>` tag.

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '771507015728497');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=771507015728497&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
```
