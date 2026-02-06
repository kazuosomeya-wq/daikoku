import { getPriceForDate, calculateDeposit } from './pricing';

// Configuration - User must fill these!
const SHOPIFY_DOMAIN = 'highwaygodzilla.com';
const STOREFRONT_ACCESS_TOKEN = 'c6a7f37eceabf83e4a59956f5597ef74';
const DEPOSIT_VARIANT_ID = 'gid://shopify/ProductVariant/52805262803308'; // Variant ID for ¥5,000 Deposit

// Shopify Storefront API Client
export const createShopifyCheckout = async (depositAmount, quantity = 1, bookingDetails) => {
    if (SHOPIFY_DOMAIN === 'your-shop-name.myshopify.com') {
        console.warn("Shopify API keys are not set.");
        return null;
    }

    const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    // Custom attributes can store booking details
    // Note: Storefront API Cart attributes key/value
    const attributes = [
        { key: "Tour Date", value: bookingDetails.date },
        { key: "Guests", value: String(bookingDetails.guests) },
        { key: "Name", value: bookingDetails.name },
        { key: "Instagram", value: bookingDetails.instagram },
        { key: "Total Tour Price", value: String(bookingDetails.totalToken) }
    ];

    const variables = {
        input: {
            lines: [
                {
                    merchandiseId: DEPOSIT_VARIANT_ID,
                    quantity: parseInt(quantity)
                }
            ],
            attributes: attributes
        }
    };

    try {
        const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN
            },
            body: JSON.stringify({ query, variables })
        });

        const json = await response.json();
        console.log("Shopify API Response:", json); // Debug log

        if (json.errors) {
            console.error("Shopify GraphQL Errors:", json.errors);
            throw new Error(json.errors[0].message);
        }

        if (!json.data || !json.data.cartCreate) {
            console.error("Unexpected Shopify Response structure:", json);
            throw new Error("Invalid response from Shopify API");
        }

        const userErrors = json.data.cartCreate.userErrors;
        if (userErrors && userErrors.length > 0) {
            console.error("Shopify Cart User Errors:", userErrors);
            throw new Error(userErrors[0].message);
        }

        const cart = json.data.cartCreate.cart;
        if (cart) {
            return cart.checkoutUrl;
        } else {
            throw new Error("Failed to create cart (no checkout url returned)");
        }
    } catch (error) {
        console.error("Shopify API Error", error);
        throw error;
    }
};
