import { formations } from "../api/virtual-assistant-attributes/formation";
import { textures } from "../api/attributes/texture";
import { skin_types } from "../api/virtual-assistant-attributes/skin_type";
import { skin_concerns } from "../api/attributes/skin_concern";
import { hair_types } from "../api/virtual-assistant-attributes/hair_type";
import { hair_concerns } from "../api/virtual-assistant-attributes/hair_concern";
import { fragrance_notes } from "../api/virtual-assistant-attributes/fragrance_note";
import { materials } from "../api/virtual-assistant-attributes/material";
import { shapes } from "../api/virtual-assistant-attributes/shape";
import { fabrics } from "../api/virtual-assistant-attributes/fabric";
import { ProductRequest } from "../types/productRequest";
import { product_types } from "../api/virtual-assistant-attributes/product_type";
import axios from "axios";

// Fungsi untuk mencari label dan ID berdasarkan product_type
function findCategoryFieldAndIds(
  productTypes: string[],
): { field: string; ids: string[] }[] {
  const matchedCategories: { field: string; ids: string[] }[] = [];

  for (const [categoryField, items] of Object.entries(product_types)) {
    const ids = items
      .filter((item) => productTypes.includes(item.label))
      .map((item) => item.value);

    if (ids.length > 0) {
      matchedCategories.push({ field: categoryField, ids });
    }
  }
  return matchedCategories;
}
// Utility function to find IDs by label
function findIdsByLabels(
  collection: { label: string; value: string }[],
  labels: string[],
): string[] {
  return labels
    .map((label) => {
      const item = collection.find((item) => item.label === label);
      return item ? item.value : null;
    })
    .filter((id) => id !== null) as string[];
}

const findCategoryIdsByProduct = (
  products: ProductRequest[],
  categories: Category[],
): number[][] => {
  const foundIds: number[][] = [];

  const searchCategory = (
    product: ProductRequest,
    category: Category,
    collectedIds: number[],
  ) => {
    // First, check if the category matches the main `category`
    if (product.category.includes(category.name)) {
      // If `sub_category` is specified, only collect matching subcategories
      if (product.sub_category && product.sub_category.length > 0) {
        for (const child of category.children_data) {
          if (product.sub_category.includes(child.name)) {
            collectedIds.push(child.id);
          }
        }
      } else {
        // If `sub_category` is not specified, collect the main category ID
        collectedIds.push(category.id);
      }
      return; // Stop further recursion once the main category is matched
    }

    // Continue searching within children_data to locate the main category
    for (const child of category.children_data) {
      searchCategory(product, child, collectedIds);
    }
  };

  // Iterate over each product to find matching category and subcategory IDs
  products.forEach((product) => {
    const categoryIds: number[] = [];

    // Start the search for each top-level category in `categories`
    for (const category of categories) {
      searchCategory(product, category, categoryIds);
    }

    foundIds.push([...new Set(categoryIds)]); // Remove duplicate IDs if any
  });

  return foundIds;
};

const createMagentoQuery = (product: ProductRequest, categoryIds: number[]) => {
  // Find product type IDs and their respective fields
  const productTypeFilters = findCategoryFieldAndIds(product.product_type);

  // Find other attribute IDs
  const formationIds = Array.isArray(product.formation)
    ? findIdsByLabels(formations, product.formation)
    : [];
  const textureIds = Array.isArray(product.texture)
    ? findIdsByLabels(textures, product.texture)
    : [];
  const skinTypeIds = Array.isArray(product.skin_type)
    ? findIdsByLabels(skin_types, product.skin_type)
    : [];
  const skinConcernIds = Array.isArray(product.skin_concern)
    ? findIdsByLabels(skin_concerns, product.skin_concern)
    : [];
  const hairTypeIds = Array.isArray(product.hair_type)
    ? findIdsByLabels(hair_types, product.hair_type)
    : [];
  const hairConcernIds = Array.isArray(product.hair_concern)
    ? findIdsByLabels(hair_concerns, product.hair_concern)
    : [];
  const fragranceNoteIds = Array.isArray(product.fragrance_note)
    ? findIdsByLabels(fragrance_notes, product.fragrance_note)
    : [];
  const materialIds = Array.isArray(product.material)
    ? findIdsByLabels(materials, product.material)
    : [];
  const shapeIds = Array.isArray(product.shape)
    ? findIdsByLabels(shapes, product.shape)
    : [];
  const fabricIds = Array.isArray(product.fabric)
    ? findIdsByLabels(fabrics, product.fabric)
    : [];

  // Start constructing query with category IDs
  const queryParts = [
    `searchCriteria[filter_groups][0][filters][0][field]=category_id`,
    `searchCriteria[filter_groups][0][filters][0][value]=${categoryIds.join(",")}`,
    `searchCriteria[filter_groups][0][filters][0][condition_type]=in`,
  ];

  let filterIndex = 1;

  // Add dynamic product type filters
  for (const { field, ids } of productTypeFilters) {
    if (ids.length > 0) {
      queryParts.push(
        `searchCriteria[filter_groups][${filterIndex}][filters][0][field]=${field}`,
        `searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${ids.join(",")}`,
        `searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=in`,
      );
      filterIndex++;
    }
  }

  // Add other attribute filters if they have values
  for (const [field, ids] of [
    ["formation", formationIds],
    ["texture", textureIds],
    ["skin_type", skinTypeIds],
    ["skin_concern", skinConcernIds],
    ["hair_type", hairTypeIds],
    ["hair_concern", hairConcernIds],
    ["fragrance_note", fragranceNoteIds],
    ["material", materialIds],
    ["shape", shapeIds],
    ["fabric", fabricIds],
  ] as [string, string[]][]) {
    if (ids.length > 0) {
      queryParts.push(
        `searchCriteria[filter_groups][${filterIndex}][filters][0][field]=${field}`,
        `searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${ids.join(",")}`,
        `searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=in`,
      );
      filterIndex++;
    }
  }

  return queryParts.join("&");
};

// Integrating the findCategoryIdsByProduct function
export const generateMagentoQueries = (
  products: ProductRequest[],
  categories: Category[],
) => {
  const categoryIdsList = findCategoryIdsByProduct(products, categories);

  return products.map((product, index) => {
    const categoryIds = categoryIdsList[index]; // Get corresponding category IDs for each product
    return createMagentoQuery(product, categoryIds); // Generate Magento query with multiple category IDs
  });
};

// Virtual assistant api
export const talkingAvatarHost = "https://talking-avatar.evorty.id";

export function makeSpeech(text: string, language = "en-US") {
  console.log(text, language);
  return axios.post(talkingAvatarHost + "/talk", { text, language });
}
