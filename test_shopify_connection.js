
import fetch from 'node-fetch';

const SHOPIFY_DOMAIN = 'highwaygodzilla.com';
const STOREFRONT_ACCESS_TOKEN = 'c6a7f37eceabf83e4a59956f5597ef74';
const DEPOSIT_VARIANT_ID = 'gid://shopify/ProductVariant/52805262803308';

async function testShopify() {
    console.log(`Testing connection to ${SHOPIFY_DOMAIN}...`);

    const query = `
    query {
      node(id: "${DEPOSIT_VARIANT_ID}") {
        id
        ... on ProductVariant {
          title
          price {
            amount
            currencyCode
          }
          product {
            title
          }
        }
      }
    }
  `;

    try {
        const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN
            },
            body: JSON.stringify({ query })
        });

        const json = await response.json();

        if (json.errors) {
            console.error("❌ Shopify API Error:", json.errors[0].message);
        } else if (!json.data.node) {
            console.error("❌ Variant ID not found or invalid.");
            console.log("Response:", JSON.stringify(json, null, 2));
        } else {
            console.log("✅ Connection Successful!");
            console.log("Product:", json.data.node.product.title);
            console.log("Variant:", json.data.node.title);
            console.log("Price:", json.data.node.price.amount, json.data.node.price.currencyCode);
        }

    } catch (error) {
        console.error("❌ Network or Script Error:", error.message);
    }
}

testShopify();
