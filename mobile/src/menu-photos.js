// Image sources are independent of allergen and ingredient evidence.
// Restaurant photography does not mean the pictured dish matches a menu entry.
export const representativeMenuPhotos = {
  "hawkers-orlando": {
    url: "https://www.theorlandoreal.com/uploads/hawkers_singaporesummer.75.jpg",
    alt: "Assorted food served at Hawkers Orlando",
    credit: "The Orlando Real · Hawkers dining coverage",
    sourceUrl: "https://www.theorlandoreal.com/hawkers-asian-street-food-in-mills-50/",
  },
  "pig-floyds-mills": {
    url: "https://www.theorlandoreal.com/uploads/Matahambre-Sandwich-1.jpg",
    alt: "Pig Floyd's barbacoa sandwich photograph",
    credit: "The Orlando Real · Pig Floyd's coverage",
    sourceUrl: "https://www.theorlandoreal.com/pig-floyds-urban-barbacoa/",
  },
  "lazy-moon-mills": {
    url: "https://tb-static.uber.com/prod/image-proc/processed_images/55115ee63708f59c54f94b18017a5440/719c6bd2757b08684c0faae44d43159d.jpeg",
    alt: "Assorted Lazy Moon pizzas and sides",
    credit: "Lazy Moon menu photograph · Uber Eats",
    sourceUrl: "https://www.ubereats.com/store/lazy-moon-pizza-colonial/MhbJzpfrWzWt-_bLWFn7wQ",
  },
  "reyes-mezcaleria": {
    url: "https://static.wixstatic.com/media/e2d616_f014634df91142b7a00ba18e9da19515~mv2.jpg/v1/fill/w_1536%2Ch_1024%2Cal_c/e2d616_f014634df91142b7a00ba18e9da19515~mv2.jpg",
    alt: "Table of food at Reyes Mezcaleria",
    credit: "Reyes Mezcaleria · official menu",
    sourceUrl: "https://www.reyesmex.com/menus",
  },
  "seito-baldwin-park": {
    url: "https://static.wixstatic.com/media/34ad14_5b758ced5dbf411e9451c9bcae069ba7~mv2.jpg/v1/fill/w_896%2Ch_549%2Cq_90%2Cenc_avif%2Cquality_auto/34ad14_5b758ced5dbf411e9451c9bcae069ba7~mv2.jpg",
    alt: "Sashimi presentation at Seito Sushi Baldwin Park",
    credit: "Seito Sushi Baldwin Park · official website",
    sourceUrl: "https://www.seitosushibp.com/",
  },
  "stubborn-mule": {
    url: "https://d1w7312wesee68.cloudfront.net/ja5IEL8YW_TY6vqGoWaZEgTQIx2e0MS4SpHqh0rL84A/resize%3Afit%3A720%3A720/plain/s3%3A/toasttab/restaurants/restaurant-71579000000000000/menu/items/2/item-400000010205582742_1681758608.jpg",
    alt: "Burger and copper mug photographed for The Stubborn Mule",
    credit: "The Stubborn Mule · restaurant ordering menu",
    sourceUrl: "https://order.toasttab.com/online/the-stubborn-mule-100-s-eola-drive",
  },
  "sparrow-orlando": {
    url: "https://static.wixstatic.com/media/34ad14_afcb84ea75e64c1388147b5a12cc3d66~mv2.jpg/v1/fill/w_980%2Ch_613%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_auto/Sparrow12.jpg",
    alt: "Table of small dishes at Sparrow Orlando",
    credit: "Sparrow Orlando · official website",
    sourceUrl: "https://www.sparroworlando.com/",
  },
  "osteria-ester": {
    url: "https://visitorlando.widen.net/content/ybegk75lub/jpeg/201828-OsteriaEster-2029.jpg?color=ffffffff&crop=true&h=640&position=c&q=65&u=p729mb&w=640",
    alt: "Pasta and antipasti at Osteria Ester",
    credit: "Visit Orlando · Osteria Ester photography",
    sourceUrl: "https://www.magicaldining.com/listing/osteria-ester/59065/",
  },
  "yellow-dog-eats-gotha": {
    url: "https://roadfood.com/.image/w_1200%2Ch_675%2Cg_auto%2Cc_fill/MTM6MDAwMDAwMDAwMDE4NDkx/rfl_21242.jpg",
    alt: "Pulled pork sandwich served at Yellow Dog Eats",
    credit: "Roadfood · Yellow Dog Eats photograph",
    sourceUrl: "https://roadfood.com/restaurants/yellow-dog-eats",
  },
};

const isHttpImage = (url) => /^https?:\/\//i.test(url || "");

/**
 * Exact product photography takes precedence over a restaurant's food photo.
 * Representative photos are never used as evidence of dietary compatibility.
 */
export function menuPhotoFor(dish, restaurant) {
  if (isHttpImage(dish?.imageUrl)) {
    return {
      url: dish.imageUrl,
      alt: dish.imageAlt || `Photograph of ${dish.name}`,
      credit: dish.imageCredit || "Published menu",
      sourceUrl: dish.provenance?.menuUrl || restaurant?.menuUrl || null,
      exact: true,
    };
  }
  const slug = restaurant?.slug || restaurant?.id || dish?.restaurantId;
  // Chipotle's official ordering page pictures a standalone side of
  // guacamole, which accurately represents this menu component.
  if (slug === "chipotle-south-orange" &&
      String(dish?.name || "").trim().toLowerCase() === "guacamole") {
    return {
      url: "https://www.chipotle.com/content/dam/chipotle/menu/menu-items/cmg-1025-large-side-of-guac/web-mobile/order.png",
      alt: "Official Chipotle side of guacamole photograph",
      credit: "Chipotle · official menu",
      sourceUrl: "https://www.chipotle.com/order/build/chips-%26-sides",
      exact: true,
    };
  }
  // Do not apply a single hero image to every item in the menu.
  // A missing photograph stays missing until an exact item match is sourced.
  return null;
}
