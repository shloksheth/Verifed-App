// Scripted presentation data for the printed 2cero7 menu, not OCR output.
// Any successful photo capture opens this same menu by the user's request.
export const fixedMenuSource = {
  url: "https://www.2cero7restaurant.com/wp-content/uploads/cartas/carta-menu-2cero7-restaurant.pdf",
  page: 1,
  mode: "fixed-menu-demo",
};

const dishes = [
  ["Primeros platos", "Starters", "Ensalada con tomates, ventresca, cebolleta tierna y vinagreta de mango", "Salad with tomatoes, tuna belly, spring onion and mango vinaigrette"],
  ["Primeros platos", "Starters", "Vichissoise con crujiente de puerro frito y virutas de jamón serrano", "Vichyssoise with crispy fried leek and Serrano ham shavings"],
  ["Primeros platos", "Starters", "Parrillada de verduras frescas a la plancha con cremoso de parmesano y romesco", "Grilled fresh vegetables with creamy Parmesan and romesco"],
  ["Primeros platos", "Starters", "Canelón de carne con bechamel de pimiento escalibado y jugo de carne", "Meat cannelloni with roasted-pepper béchamel and meat jus"],
  ["Primeros platos", "Starters", "Arroz meloso de pollo con dados manzana caramelizada", "Creamy-style chicken rice with diced caramelized apple"],
  ["Segundos platos", "Main dishes", "Bacalao con pisto de verduras", "Cod with stewed vegetables"],
  ["Segundos platos", "Main dishes", "Calamares guisados con patatas y edamames", "Squid stew with potatoes and edamame"],
  ["Segundos platos", "Main dishes", "Churrasco de ternera con patata platillo y aliño de cherrys con piñones", "Grilled beef with small potatoes and cherry-tomato dressing with pine nuts"],
  ["Segundos platos", "Main dishes", "Solomillo de cerdo con cremoso de patata, piquillos salteados y salsa de mostaza", "Pork tenderloin with creamy potato, sautéed piquillo peppers and mustard sauce"],
  ["Segundos platos", "Main dishes", "Entrecot de ternera con bastones de boniato", "Beef entrecôte with sweet-potato sticks", "*suplemento 5€", "+5 € supplement"],
  ["Postres", "Desserts", "Ensalada de fruta natural", "Fresh fruit salad"],
  ["Postres", "Desserts", "Surtido de helados", "Assorted ice cream"],
  ["Postres", "Desserts", "Pastel de queso con reducción de Pedro Ximenez", "Cheesecake with Pedro Ximénez reduction"],
  ["Postres", "Desserts", "Crema catalana con frambuesas", "Catalan custard with raspberries"],
  ["Postres", "Desserts", "Brownie con helado de vainilla", "Brownie with vanilla ice cream"],
];

export function fixedSpanishMenu() {
  return {
    id: "2cero7-spanish-fixed",
    title: "2cero7 Restaurant",
    sourceLabel: "Menú del día · Español → English",
    demoMode: true,
    source: { ...fixedMenuSource },
    headingEs: "MENÚ DEL DÍA",
    headingEn: "SET MENU",
    priceSummaryEs: "25€ → 20€ con la promoción · 18€ escogiendo plato único · IVA INCL",
    priceSummaryEn: "25€ → 20€ with the promotion · 18€ when choosing a single dish · VAT included",
    notesEs: [
      "Pan (Pan sin gluten 0,50€)",
      "1 Bebida (1/2 agua o 1/2 Vino de la Casa o Copa de Cerveza (o Estrella), o Refresco 35cl)",
      "Café, Latte o Infusión (Carajillo con un suplemento de 0,50€)",
    ],
    notesEn: [
      "Bread (gluten-free bread: 0,50€)",
      "1 drink: ½ water or ½ house wine, a glass of beer (or Estrella), or a 35cl soft drink",
      "Coffee, latte or herbal tea (carajillo, coffee with spirits: 0,50€ supplement)",
    ],
    contact: "www.2cero7restaurant.com · reserves@2cero7restaurant.com · 934 906 640",
    venue: "ATENEA BARCELONA APARTHOTEL · 2CERO7 RESTAURANT",
    legendEs: "Contiene gluten · Crustáceos · Huevos · Pescado · Cacahuetes · Soja · Lácteos · Frutos de cáscara · Apio · Mostaza · Granos de sésamo · Dióxido de azufre y sulfitos · Moluscos · Altramuces",
    legendEn: "Gluten · Crustaceans · Eggs · Fish · Peanuts · Soy · Milk · Tree nuts · Celery · Mustard · Sesame · Sulfur dioxide and sulfites · Molluscs · Lupin",
    items: dishes.map(([categoryEs, categoryEn, nameEs, nameEn, priceEs = "", priceEn = ""], index) => ({
      id: `2cero7-${index + 1}`, categoryEs, categoryEn, nameEs, nameEn,
      descriptionEs: "", descriptionEn: "", price: priceEs, priceEs, priceEn, tags: [],
    })),
  };
}

export function menuAfterPhoto(photo) {
  // Keep the person's actual photo for review, but never pretend it determines
  // this fixed transcript or call a model-provider service.
  return { photo, menu: fixedSpanishMenu() };
}
