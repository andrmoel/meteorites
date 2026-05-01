import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import Parser from "./Parser";
import {Currency} from "../../currency/enums/Currency";

const BASE_URL = 'https://www.metals-minerals.com';
const API_URL = `${BASE_URL}/_api/wix-ecommerce-storefront-web/api`;

const STATIC_HEADERS = {
    Referer: `${BASE_URL}/_partials/wix-thunderbolt/dist/clientWorker.9dac61c0.bundle.min.js`,
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    'x-wix-linguist': 'de|de-de|true|0fc930e0-5bc6-4dfe-b828-4d56c40a0c07',
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

export default class MetalMineralsParser implements Parser {
    private async fetchFreshHeaders(): Promise<typeof STATIC_HEADERS & {Authorization: string, 'X-XSRF-TOKEN': string}> {
        const WIX_ECOMMERCE_APP_ID = '1380b703-ce81-ff05-f115-39571d94dfcd';
        const response = await axios.get(`${BASE_URL}/_api/v1/access-tokens`, {
            headers: {'User-Agent': STATIC_HEADERS['User-Agent']},
        });

        const authorization: string = response.data?.apps?.[WIX_ECOMMERCE_APP_ID]?.instance;
        if (!authorization) throw new Error('MetalMineralsParser: could not find Wix instance token');

        const setCookies: string[] = ([] as string[]).concat(response.headers['set-cookie'] ?? []);
        let xsrfToken = '';
        for (const cookie of setCookies) {
            const m = cookie.match(/XSRF-TOKEN=([^;]+)/);
            if (m) {
                xsrfToken = decodeURIComponent(m[1]);
                break;
            }
        }
        if (!xsrfToken) throw new Error('MetalMineralsParser: could not find XSRF token in cookies');

        return {...STATIC_HEADERS, Authorization: authorization, 'X-XSRF-TOKEN': xsrfToken};
    }

    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const headers = await this.fetchFreshHeaders();
        const results: Array<MeteoritePrice> = [];
        const limit = 24;
        let offset = 0;
        let totalCount = Infinity;

        while (offset < totalCount) {
            const response = await axios.post(API_URL, {
                variables: {
                    mainCollectionId: '9f79caca-1a18-c5c1-d368-f0008eb2510d',
                    offset,
                    limit,
                    sort: {direction: 'Descending', sortField: 'creationDate'},
                    filters: null,
                    withOptions: false,
                    withPriceRange: false,
                },
                query: QUERY,
                source: 'WixStoresWebClient',
                operationName: 'getFilteredProducts',
            }, {headers});

            const {totalCount: count, list} = response.data.data.catalog.category.productsWithMetaData;
            totalCount = count;

            for (const product of list) {
                const parsed = this.parseProduct(product);
                if (parsed) {
                    results.push(parsed);
                }
            }

            offset += list.length;
        }

        return results;
    }

    private parseProduct(product: {name: string; price: number; currency: string}): MeteoritePrice | null {
        // Weight formats found in product names (German locale, comma as decimal):
        //   "Meteorit - Gibeon [IVA] - 709g - Namibia"
        //   "Meteorit - Ibbenbüren - 150 mg"
        //   "Meteorit - Menow [H4], - 0,507g, ..."
        //   "Meteorit - Marburg [PAL] - Olivinkristall (50 mg)"
        const weightMatch = product.name.match(/[\-\(]\s*([\d]+(?:[,.]\d+)?)\s*(mg|g)\b/i);
        if (!weightMatch) return null;

        const rawValue = parseFloat(weightMatch[1].replace(',', '.'));
        if (isNaN(rawValue) || rawValue <= 0) return null;

        const unit = weightMatch[2].toLowerCase();
        const weight = unit === 'mg' ? rawValue / 1000 : rawValue;
        if (weight <= 0) return null;

        // Strip "Meteorit - " prefix and extract the meteorite name
        // Name starts after "Meteorit - " or "Kopie von Meteorit - "
        let rawName = product.name
            .replace(/^Kopie von /, '')
            .replace(/^Meteorit\s*-\s*/, '');

        // Remove weight part and everything after it
        const weightIdx = rawName.search(/[\-\(]\s*[\d]+(?:[,.]\d+)?\s*(?:mg|g)\b/i);
        if (weightIdx > 0) {
            rawName = rawName.slice(0, weightIdx).trim().replace(/[,\s]+$/, '');
        }

        if (!rawName) return null;
        const currency = product.currency === 'USD' ? Currency.USD : Currency.EUR;

        return {name: rawName, weight, price: product.price, currency};
    }
}
