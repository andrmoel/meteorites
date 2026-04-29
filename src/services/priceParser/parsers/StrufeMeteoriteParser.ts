import Parser from "./Parser";
import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";

const API_URL = 'https://www.strufe.net/_api/wix-ecommerce-storefront-web/api';

const HEADERS = {
    Authorization: 'j7SFPFE3zJIYu6h6iyGuD1XaOzIEZCuO8HcfmrGz4UM.eyJpbnN0YW5jZUlkIjoiNGU3NWM3OGItODI3Yi00ZWY4LWFiYTMtYWQyOTRlY2NiYTE0IiwiYXBwRGVmSWQiOiIxMzgwYjcwMy1jZTgxLWZmMDUtZjExNS0zOTU3MWQ5NGRmY2QiLCJtZXRhU2l0ZUlkIjoiZGI1MDk3M2MtNDQ2Yy00ODI2LThhMzQtY2I1NDIwMjM4NTg1Iiwic2lnbkRhdGUiOiIyMDI2LTA0LTI5VDE4OjQzOjQxLjE4M1oiLCJ2ZW5kb3JQcm9kdWN0SWQiOiJzdG9yZXNfc2lsdmVyIiwiZGVtb01vZGUiOmZhbHNlLCJvcmlnaW5JbnN0YW5jZUlkIjoiNjI4NDQwOWQtMjNmMC00NDAwLWIyZDctYjk5ZGVjYjVmNWQyIiwiYWlkIjoiNGM3ZTc0NmUtNDFhZC00OTVmLTliZGItZjY2OGQ5OWM2NWEyIiwiYmlUb2tlbiI6Ijk1MjU1MGI3LWM2MTctMDZkZS0yMTk3LTY2N2Q2ZWVmM2Y5MSIsInNpdGVPd25lcklkIjoiYzkzNTUyNzctMTNiMi00YjM1LThlNDctOTQ3NjA4NTJjMzFiIiwiYnMiOiJibVhKdGNGNnRhZkF0OExXWWJmN1BmSVh4c2NzRnJOZ3o3bkJWNnhDUXlVIiwic2NkIjoiMjAyMS0wMy0xNFQxODo1ODoyNi45ODdaIn0',
    'X-XSRF-TOKEN': '1777488202|7kztMjojP4TN',
    Referer: 'https://www.strufe.net/_partials/wix-thunderbolt/dist/clientWorker.00a6ea0d.bundle.min.js',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    'Content-Type': 'application/json; charset=utf-8',
};

const QUERY = `query getFilteredProducts($mainCollectionId: String!, $filters: ProductFilters, $sort: ProductSort, $offset: Int, $limit: Int, $withOptions: Boolean = false, $withPriceRange: Boolean = false) {
  catalog {
    category(categoryId: $mainCollectionId) {
      productsWithMetaData(filters: $filters, limit: $limit, sort: $sort, offset: $offset, onlyVisible: true) {
        totalCount
        list {
             id
      options {
        id
        key
        title @include(if: $withOptions)
        optionType @include(if: $withOptions)
        selections @include(if: $withOptions) {
          id
          value
          description
          key
          inStock
          visible
          linkedMediaItems {
            url
            fullUrl
            width
            height
          }
        }
      }
      productItems @include(if: $withOptions) {
        id
        optionsSelections
        price
        comparePrice
        formattedPrice
        formattedComparePrice
        hasDiscount
        availableForPreOrder
        isTrackingInventory
        inventory {
          status
          quantity
        }
        automaticDiscount {
          automaticDiscountPrice
          formattedAutomaticDiscountPrice
          automaticDiscountPricePerUnit
          formattedAutomaticDiscountPricePerUnit
        }
        isVisible
        pricePerUnit
        formattedPricePerUnit
        preOrderInfo {
          limit
          message
        }
      }
      customTextFields(limit: 1) {
        title
      }
      productType
      ribbon
      additionalRibbons {
        id
        name
      }
      price
      comparePrice
      pricePerUnit
      sku
      isInStock
      urlPart
      formattedComparePrice
      formattedPrice
      formattedPricePerUnit
      pricePerUnitData {
        baseQuantity
        baseMeasurementUnit
      }
      itemDiscount {
        discountRuleName
        automaticDiscountRuleNames
        priceAfterDiscount
        priceAfterDiscountAmount
        automaticDiscountPricePerUnit
        formattedAutomaticDiscountPricePerUnit
      }
      digitalProductFileItems {
        fileType
      }
      name
      currency
      media {
        url
        fullUrl
        width
        height
        altText
      }
      isManageProductItems
      productItemsPreOrderAvailability
      isTrackingInventory
      inventory {
        status
        quantity
        availableForPreOrder
        preOrderInfoView {
          limit
        }
      }
      subscriptionPlans {
        list {
          id
          visible
        }
      }
      priceRange(withSubscriptionPriceRange: true) @include(if: $withPriceRange) {
        fromPrice
        fromPriceFormatted
      }
      discount {
        value
      }
      groupInfo {
        productGroupId
        groupingCustomizationId
        members {
          productId
          choice {
            id
            value
            description
            key
          }
          slug
          inventoryAvailabilityStatus
        }
      }
        }
      }
    }
  }
}
`;

export default class StrufeMeteoriteParser implements Parser {
    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const results: Array<MeteoritePrice> = [];
        const limit = 100;
        let offset = 0;
        let totalCount = Infinity;

        while (offset < totalCount) {
            console.log(`Fetching offset ${offset}...`);
            const response = await axios.post(API_URL, {
                variables: {
                    mainCollectionId: '00000000-000000-000000-000000000001',
                    offset,
                    limit,
                    sort: null,
                    filters: null,
                    withOptions: false,
                    withPriceRange: false,
                },
                query: QUERY,
                source: 'WixStoresWebClient',
                operationName: 'getFilteredProducts',
            }, {headers: HEADERS});

            const {totalCount: count, list} = response.data.data.catalog.category.productsWithMetaData;
            totalCount = count;

            for (const product of list) {
                const parsed = this.parseProduct(product);
                if (parsed) {
                    results.push(parsed);
                }
            }

            offset += list.length;
            console.log(`Fetched ${list.length} products (total so far: ${results.length}/${totalCount})`);
        }

        return results;
    }

    private parseProduct(product: {name: string; price: number}): MeteoritePrice | null {
        // Weight is embedded in the name, e.g. "Gibeon ( 2,800 g)" where comma is the decimal separator
        const weightMatch = product.name.match(/\(\s*([\d,]+)\s*g\s*\)/);
        if (!weightMatch) return null;

        const weight = parseFloat(weightMatch[1].replace(',', '.'));
        if (isNaN(weight)) return null;

        const name = product.name.replace(/\s*\(\s*[\d,]+\s*g\s*\)\s*$/, '').trim();

        return {name, weight, price: product.price};
    }
}
