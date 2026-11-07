// Shared core for the SA Meal Planner: ingredient prices, nutrition, recipes,
// diet rules, fitness targets, the budget planner and grocery-list builder.
// Pure JavaScript with no dependencies, used by both the Expo app and the web preview.

// ---------- Stores ----------
// Price index relative to Checkers (= 1.00). Checkers R1,618 vs PnP R1,676 vs
// Woolworths R2,097 for the same basket (PriceCheck via BusinessTech, Mar 2025).
export const STORES = {
  shoprite:   { name: 'Shoprite',     index: 0.97, search: q => `https://www.shoprite.co.za/search?Search=${encodeURIComponent(q)}` },
  checkers:   { name: 'Checkers / Sixty60', index: 1.00, search: q => `https://www.checkers.co.za/search?Search=${encodeURIComponent(q)}` },
  pnp:        { name: 'Pick n Pay / asap!', index: 1.04, search: q => `https://www.pnp.co.za/search/${encodeURIComponent(q)}` },
  spar:       { name: 'Spar',         index: 1.06, search: q => `https://www.spar.co.za/search?q=${encodeURIComponent(q)}` },
  woolworths: { name: 'Woolworths / Dash', index: 1.30, search: q => `https://www.woolworths.co.za/cat?Ntt=${encodeURIComponent(q)}` },
};

// ---------- Ingredients ----------
// [name, packQty, unit, packPriceRand(Checkers est.), aisle, flags, protein, kcal, searchTerm, staple]
// unit 'g'/'ml': nutrition is per 100 g/ml. unit 'ea': nutrition is per item.
// flags: m=red meat, c=poultry, f=fish, p=pork, d=dairy, e=egg, g=gluten, n=nuts
const I = (name, pack, unit, price, aisle, flags, protein, kcal, search, staple = false) =>
  ({ name, pack, unit, price, aisle, flags, protein, kcal, search: search || name, staple });

export const INGREDIENTS = {
  onion:        I('Onions', 1000, 'g', 22.99, 'Fruit & veg', '', 1.1, 40, 'onions 1kg'),
  tomato:       I('Tomatoes', 1000, 'g', 29.99, 'Fruit & veg', '', 0.9, 18, 'tomatoes 1kg'),
  potato:       I('Potatoes', 2000, 'g', 39.99, 'Fruit & veg', '', 2, 77, 'potatoes 2kg'),
  sweet_potato: I('Sweet potatoes', 1000, 'g', 29.99, 'Fruit & veg', '', 1.6, 86),
  carrot:       I('Carrots', 1000, 'g', 19.99, 'Fruit & veg', '', 0.9, 41, 'carrots 1kg'),
  cabbage:      I('Cabbage', 1, 'ea', 19.99, 'Fruit & veg', '', 13, 250),
  spinach:      I('Spinach', 250, 'g', 22.99, 'Fruit & veg', '', 2.9, 23, 'baby spinach'),
  butternut:    I('Butternut', 1, 'ea', 24.99, 'Fruit & veg', '', 12, 540),
  green_pepper: I('Green peppers (3)', 3, 'ea', 24.99, 'Fruit & veg', '', 1, 24, 'green peppers'),
  garlic:       I('Garlic', 1, 'ea', 9.99, 'Fruit & veg', '', 3, 70, 'garlic bulb'),
  banana:       I('Bananas (~7)', 7, 'ea', 24.99, 'Fruit & veg', '', 1.3, 105, 'bananas'),
  apple:        I('Apples (~10)', 10, 'ea', 29.99, 'Fruit & veg', '', 0.5, 95, 'apples 1.5kg'),
  avocado:      I('Avocados (4)', 4, 'ea', 39.99, 'Fruit & veg', '', 3, 240, 'avocados'),
  mushrooms:    I('Mushrooms', 250, 'g', 27.99, 'Fruit & veg', '', 3.1, 22, 'button mushrooms'),
  broccoli:     I('Broccoli', 1, 'ea', 24.99, 'Fruit & veg', '', 11, 136),
  chicken_pieces: I('Chicken braai pack', 2000, 'g', 109.99, 'Meat & fish', 'c', 18, 180, 'chicken braai pack'),
  chicken_breast: I('Chicken breast fillets', 1000, 'g', 99.99, 'Meat & fish', 'c', 23, 120, 'chicken breast fillets'),
  mince:        I('Beef mince', 1000, 'g', 119.99, 'Meat & fish', 'm', 19, 250, 'beef mince'),
  boerewors:    I('Boerewors', 1000, 'g', 109.99, 'Meat & fish', 'mp', 15, 280),
  beef_stew:    I('Beef stewing meat', 1000, 'g', 129.99, 'Meat & fish', 'm', 20, 220, 'beef stew'),
  pork_chops:   I('Pork chops', 1000, 'g', 99.99, 'Meat & fish', 'mp', 20, 230),
  hake:         I('Hake fillets (frozen)', 1000, 'g', 109.99, 'Meat & fish', 'f', 17, 80, 'hake fillets'),
  tuna:         I('Tuna in brine (170 g can)', 1, 'ea', 24.99, 'Tins & jars', 'f', 30, 190, 'tuna chunks in brine'),
  pilchards:    I('Pilchards in tomato (400 g)', 1, 'ea', 27.99, 'Tins & jars', 'f', 50, 560, 'pilchards tomato sauce'),
  eggs:         I('Eggs (18)', 18, 'ea', 64.99, 'Dairy & eggs', 'e', 6.5, 75, 'large eggs 18'),
  milk:         I('Milk (2 L)', 2000, 'ml', 34.99, 'Dairy & eggs', 'd', 3.4, 64, 'fresh milk 2l'),
  cheese:       I('Cheddar cheese', 400, 'g', 59.99, 'Dairy & eggs', 'd', 25, 400, 'cheddar cheese'),
  butter:       I('Butter', 500, 'g', 69.99, 'Dairy & eggs', 'd', 0.6, 740),
  yoghurt:      I('Plain yoghurt', 1000, 'g', 39.99, 'Dairy & eggs', 'd', 4, 65, 'plain yoghurt 1kg'),
  bread:        I('Brown bread loaf (~20 slices)', 20, 'ea', 19.99, 'Bakery', 'g', 3, 80, 'brown bread'),
  wraps:        I('Wraps (6)', 6, 'ea', 34.99, 'Bakery', 'g', 5, 180, 'tortilla wraps'),
  rice:         I('Rice', 2000, 'g', 44.99, 'Pantry', '', 7, 360, 'white rice 2kg'),
  maize_meal:   I('Maize meal', 2500, 'g', 39.99, 'Pantry', '', 8, 360, 'super maize meal'),
  pasta:        I('Pasta', 500, 'g', 19.99, 'Pantry', 'g', 12, 355, 'spaghetti 500g'),
  oats:         I('Oats', 1000, 'g', 34.99, 'Pantry', 'g', 13, 380, 'rolled oats 1kg'),
  samp:         I('Samp & beans', 1000, 'g', 24.99, 'Pantry', '', 11, 340, 'samp and beans'),
  lentils:      I('Red lentils', 500, 'g', 26.99, 'Pantry', '', 24, 350, 'red lentils'),
  soya:         I('Soya mince', 400, 'g', 24.99, 'Pantry', '', 50, 330, 'soya mince'),
  baked_beans:  I('Baked beans (410 g)', 1, 'ea', 16.99, 'Tins & jars', '', 20, 350, 'baked beans 410g'),
  chakalaka:    I('Chakalaka (410 g)', 1, 'ea', 19.99, 'Tins & jars', '', 6, 200, 'chakalaka'),
  chickpeas:    I('Chickpeas (400 g)', 1, 'ea', 19.99, 'Tins & jars', '', 17, 330, 'chickpeas tin'),
  tomato_can:   I('Chopped tomatoes (410 g)', 1, 'ea', 14.99, 'Tins & jars', '', 4, 80, 'chopped tomatoes tin'),
  coconut_milk: I('Coconut milk (400 ml)', 1, 'ea', 24.99, 'Tins & jars', '', 8, 700, 'coconut milk'),
  peanut_butter:I('Peanut butter', 400, 'g', 39.99, 'Pantry', 'n', 25, 590, 'peanut butter 400g'),
  frozen_veg:   I('Frozen mixed veg', 1000, 'g', 39.99, 'Frozen', '', 3, 60, 'frozen mixed vegetables'),
  frozen_peas:  I('Frozen peas', 1000, 'g', 34.99, 'Frozen', '', 5.4, 81, 'frozen peas'),
  mayo:         I('Mayonnaise', 750, 'g', 44.99, 'Tins & jars', 'e', 1, 500, 'mayonnaise'),
  chicken_livers: I('Chicken livers', 500, 'g', 34.99, 'Meat & fish', 'c', 17, 120, 'chicken livers'),
  bacon:        I('Bacon', 250, 'g', 54.99, 'Meat & fish', 'mp', 13, 400, 'streaky bacon 250g'),
  sweetcorn:    I('Sweetcorn (410 g)', 1, 'ea', 17.99, 'Tins & jars', '', 7, 220, 'whole kernel corn tin'),
  gem_squash:   I('Gem squash (4)', 4, 'ea', 24.99, 'Fruit & veg', '', 1.5, 60, 'gem squash'),
  lemon:        I('Lemons (6)', 6, 'ea', 24.99, 'Fruit & veg', '', 0.5, 17, 'lemons'),
  oil:          I('Sunflower oil (2 L)', 2000, 'ml', 64.99, 'Pantry', '', 0, 880, 'sunflower oil 2l', true),
  flour:        I('Cake flour', 2500, 'g', 39.99, 'Pantry', 'g', 10, 350, 'cake flour', true),
  stock:        I('Stock cubes (12)', 12, 'ea', 19.99, 'Pantry', 'g', 0.5, 10, 'stock cubes', true),
  curry:        I('Curry powder', 100, 'g', 24.99, 'Pantry', '', 0, 0, 'curry powder', true),
  soy_sauce:    I('Soy sauce', 250, 'ml', 24.99, 'Pantry', 'g', 8, 60, 'soy sauce', true),
  peri:         I('Peri-peri sauce', 250, 'ml', 34.99, 'Pantry', '', 0.5, 40, 'peri peri sauce', true),
};

// Iron in mg per 100 g/ml (or per item for 'ea'), and ingredients that supply vitamin C,
// which helps the body absorb iron from plant foods. Approximate values; SA maize meal and
// bread flour are iron-fortified.
const IRON = {"onion": 0.2, "tomato": 0.3, "potato": 0.8, "sweet_potato": 0.6, "carrot": 0.3, "cabbage": 4.7, "spinach": 2.7, "butternut": 8.4, "green_pepper": 0.4, "garlic": 0.5, "banana": 0.3, "apple": 0.2, "avocado": 1.1, "mushrooms": 0.5, "broccoli": 2.9, "chicken_pieces": 0.9, "chicken_breast": 0.7, "mince": 2.6, "boerewors": 2.0, "beef_stew": 2.6, "pork_chops": 0.8, "hake": 0.5, "tuna": 1.6, "pilchards": 8.0, "eggs": 0.9, "milk": 0.03, "cheese": 0.2, "butter": 0, "yoghurt": 0.1, "bread": 0.8, "wraps": 1.5, "rice": 0.8, "maize_meal": 3.8, "pasta": 1.3, "oats": 4.3, "samp": 3.0, "lentils": 7.5, "soya": 9.0, "baked_beans": 6.0, "chakalaka": 3.0, "chickpeas": 7.0, "tomato_can": 1.3, "coconut_milk": 6.6, "peanut_butter": 1.9, "frozen_veg": 0.8, "frozen_peas": 1.5, "mayo": 0.3, "oil": 0, "flour": 1.2, "stock": 0, "curry": 0, "soy_sauce": 2.0, "peri": 0, "chicken_livers": 9.0, "bacon": 0.6, "sweetcorn": 1.2, "gem_squash": 0.6, "lemon": 0.3};
const VIT_C = new Set(["tomato", "green_pepper", "broccoli", "cabbage", "spinach", "potato", "sweet_potato", "tomato_can", "chakalaka", "butternut", "frozen_peas", "frozen_veg", "lemon", "gem_squash"]);
for (const [id, ing] of Object.entries(INGREDIENTS)) { ing.iron = IRON[id] || 0; ing.vitC = VIT_C.has(id); }

// ---------- Recipes ----------
// qty is for 4 servings. lc = low-carb friendly.
const R = (id, name, meal, mins, ing, steps, lc = false) => ({ id, name, meal, mins, ing, steps, lc });

export const RECIPES = [
  // Breakfast
  R('b_oats_banana', 'Oats with banana', 'breakfast', 10, { oats: 320, milk: 800, banana: 2 }, ['Simmer oats in milk 5 min.', 'Top with sliced banana.']),
  R('b_eggs_toast', 'Scrambled eggs on toast', 'breakfast', 10, { eggs: 8, bread: 8, butter: 40, tomato: 200 }, ['Scramble eggs in butter.', 'Serve on toast with sliced tomato.']),
  R('b_maize_porridge', 'Maize meal porridge', 'breakfast', 15, { maize_meal: 300, milk: 600, butter: 20 }, ['Whisk maize meal into boiling water, cook 10 min.', 'Finish with milk and butter.']),
  R('b_yog_oats', 'Yoghurt, oats & apple bowl', 'breakfast', 5, { yoghurt: 600, oats: 160, apple: 2 }, ['Layer yoghurt with oats and chopped apple.']),
  R('b_pb_toast', 'Peanut butter & banana toast', 'breakfast', 5, { bread: 8, peanut_butter: 120, banana: 2 }, ['Toast bread, spread peanut butter, top with banana.']),
  R('b_vegan_oats', 'Peanut butter oats', 'breakfast', 10, { oats: 320, banana: 2, peanut_butter: 60 }, ['Cook oats in water.', 'Stir in peanut butter, top with banana.']),
  R('b_omelette', 'Spinach & cheese omelette', 'breakfast', 10, { eggs: 10, spinach: 150, cheese: 80, tomato: 200 }, ['Wilt spinach, add beaten eggs.', 'Add cheese, fold and serve with tomato.'], true),
  R('b_fruit_yog', 'Fruit & yoghurt', 'breakfast', 5, { yoghurt: 600, banana: 2, apple: 2 }, ['Chop fruit and serve with yoghurt.']),
  R('b_eggs_avo', 'Boiled eggs & avo', 'breakfast', 12, { eggs: 8, avocado: 2, tomato: 200 }, ['Boil eggs 8 min.', 'Serve with sliced avo and tomato.'], true),
  // Lunch
  R('l_tuna_wraps', 'Tuna mayo wraps', 'lunch', 10, { wraps: 4, tuna: 2, mayo: 80, tomato: 200, cabbage: 0.2 }, ['Mix tuna and mayo.', 'Fill wraps with tuna, tomato and shredded cabbage.']),
  R('l_chakalaka_bread', 'Chakalaka & bread', 'lunch', 5, { chakalaka: 2, bread: 8 }, ['Heat chakalaka and serve with bread.']),
  R('l_lentil_soup', 'Lentil & carrot soup', 'lunch', 30, { lentils: 250, carrot: 300, onion: 150, tomato_can: 1, stock: 2 }, ['Soften onion and carrot.', 'Add lentils, tomatoes, stock and 1 L water; simmer 20 min.']),
  R('l_chicken_sarmie', 'Chicken mayo sandwiches', 'lunch', 20, { chicken_breast: 400, mayo: 80, bread: 8 }, ['Pan-fry and shred chicken.', 'Mix with mayo and make sandwiches.']),
  R('l_egg_wraps', 'Egg mayo wraps', 'lunch', 15, { eggs: 6, mayo: 60, wraps: 4, spinach: 60 }, ['Boil and chop eggs, mix with mayo.', 'Fill wraps with egg and spinach.']),
  R('l_quesadilla', 'Bean & cheese quesadillas', 'lunch', 15, { wraps: 4, baked_beans: 2, cheese: 120 }, ['Fill wraps with beans and cheese.', 'Toast in a pan until crisp.']),
  R('l_rice_bowl', 'Chickpea, rice & avo bowl', 'lunch', 20, { rice: 300, chickpeas: 2, tomato: 300, onion: 100, avocado: 2 }, ['Cook rice.', 'Top with chickpeas, chopped tomato, onion and avo.']),
  R('l_pilchards_toast', 'Pilchards on toast', 'lunch', 10, { pilchards: 1, onion: 100, bread: 8 }, ['Heat pilchards with sliced onion.', 'Serve on toast.']),
  R('l_butternut_soup', 'Butternut soup', 'lunch', 35, { butternut: 1, onion: 150, carrot: 200, stock: 2 }, ['Simmer butternut, onion and carrot in stock 25 min.', 'Blend smooth.']),
  R('l_chicken_avo_salad', 'Chicken & avo salad', 'lunch', 20, { chicken_breast: 500, avocado: 2, tomato: 300, spinach: 150 }, ['Grill and slice chicken.', 'Toss with spinach, tomato and avo.'], true),
  R('l_tuna_salad', 'Tuna & egg salad', 'lunch', 15, { tuna: 2, eggs: 4, tomato: 300, spinach: 150 }, ['Boil eggs.', 'Toss tuna, eggs, tomato and spinach.'], true),
  // Dinner
  R('d_chicken_curry', 'Chicken & potato curry with rice', 'dinner', 50, { chicken_pieces: 1200, onion: 200, tomato_can: 1, potato: 400, curry: 15, rice: 300, oil: 30 }, ['Brown chicken and onion with curry powder.', 'Add tomatoes and potato, simmer 35 min.', 'Serve with rice.']),
  R('d_bolognese', 'Spaghetti bolognese', 'dinner', 40, { mince: 500, pasta: 500, tomato_can: 2, onion: 150, carrot: 150, oil: 15 }, ['Brown mince with onion and carrot.', 'Add tomatoes, simmer 25 min.', 'Serve on spaghetti.']),
  R('d_wors_pap', 'Boerewors, pap & chakalaka', 'dinner', 30, { boerewors: 600, maize_meal: 400, chakalaka: 1 }, ['Cook stiff pap.', 'Grill or braai boerewors.', 'Serve with warm chakalaka.']),
  R('d_bobotie', 'Bobotie & rice', 'dinner', 60, { mince: 500, bread: 2, milk: 250, eggs: 2, onion: 150, curry: 10, rice: 300, oil: 15 }, ['Fry onion and mince with curry.', 'Mix in milk-soaked bread, top with egg-milk custard.', 'Bake 30 min at 180°C; serve with rice.']),
  R('d_lentil_curry', 'Lentil coconut curry', 'dinner', 35, { lentils: 300, coconut_milk: 1, onion: 150, tomato_can: 1, curry: 15, rice: 300, oil: 15 }, ['Fry onion with curry powder.', 'Add lentils, tomatoes, coconut milk and 500 ml water; simmer 20 min.', 'Serve with rice.']),
  R('d_hake_chips', 'Oven hake, chips & slaw', 'dinner', 40, { hake: 600, potato: 1000, tomato: 200, cabbage: 0.25, oil: 30 }, ['Roast potato wedges 35 min at 220°C.', 'Bake hake for the last 15 min.', 'Serve with shredded cabbage and tomato.']),
  R('d_fishcakes', 'Pilchard fishcakes & mash', 'dinner', 40, { pilchards: 2, potato: 1000, eggs: 1, flour: 50, onion: 100, oil: 30 }, ['Boil and mash potatoes.', 'Mix some mash with pilchards, onion, egg and flour; fry patties.', 'Serve with remaining mash.']),
  R('d_samp_beans', 'Samp & beans with chakalaka', 'dinner', 120, { samp: 500, chakalaka: 1, onion: 100 }, ['Soak samp overnight, simmer 1.5–2 h until soft.', 'Stir in fried onion; serve with chakalaka.']),
  R('d_cottage_pie', 'Cottage pie', 'dinner', 60, { mince: 500, potato: 1000, carrot: 200, onion: 150, frozen_peas: 200, butter: 30, milk: 100 }, ['Cook mince with onion, carrot and peas.', 'Top with buttery mash.', 'Bake 20 min at 200°C.']),
  R('d_peri_chicken', 'Peri-peri chicken & sweet potato', 'dinner', 50, { chicken_pieces: 1200, sweet_potato: 800, peri: 60, broccoli: 1 }, ['Coat chicken in peri-peri sauce.', 'Roast with sweet potato 40 min at 200°C.', 'Steam broccoli to serve.']),
  R('d_soya_bolognese', 'Soya mince bolognese', 'dinner', 30, { soya: 200, pasta: 500, tomato_can: 2, onion: 150, carrot: 150, oil: 15 }, ['Fry onion and carrot.', 'Add soya mince, tomatoes and 300 ml water; simmer 15 min.', 'Serve on pasta.']),
  R('d_chickpea_stew', 'Chickpea & spinach stew', 'dinner', 30, { chickpeas: 2, spinach: 200, tomato_can: 1, onion: 150, rice: 300, curry: 10, oil: 15 }, ['Fry onion with spices.', 'Add tomatoes and chickpeas; simmer 15 min, stir in spinach.', 'Serve with rice.']),
  R('d_pork_mash', 'Pork chops, mash & veg', 'dinner', 35, { pork_chops: 800, potato: 1000, frozen_veg: 400, butter: 30, milk: 100 }, ['Pan-fry chops.', 'Make mash; steam veg.']),
  R('d_mushroom_pasta', 'Creamy mushroom & spinach pasta', 'dinner', 25, { pasta: 500, mushrooms: 250, spinach: 150, cheese: 100, milk: 300, garlic: 0.25, butter: 20 }, ['Fry mushrooms and garlic in butter.', 'Add milk and cheese to make a sauce; stir in spinach.', 'Toss with pasta.']),
  R('d_beef_stew', 'Beef stew & rice', 'dinner', 120, { beef_stew: 800, potato: 500, carrot: 300, onion: 150, stock: 2, rice: 300, oil: 15 }, ['Brown beef and onion.', 'Add stock, carrot and potato; simmer 1.5 h.', 'Serve with rice.']),
  R('d_stirfry', 'Chicken stir-fry & rice', 'dinner', 25, { chicken_breast: 500, green_pepper: 2, carrot: 200, cabbage: 0.25, soy_sauce: 40, rice: 300, oil: 15 }, ['Stir-fry sliced chicken.', 'Add veg and soy sauce.', 'Serve with rice.']),
  R('d_egg_fried_rice', 'Egg fried rice', 'dinner', 25, { rice: 300, eggs: 4, frozen_peas: 200, carrot: 150, soy_sauce: 40, onion: 100, oil: 20 }, ['Cook rice and cool.', 'Fry veg, push aside, scramble eggs.', 'Toss everything with rice and soy sauce.']),
  R('d_butternut_curry', 'Butternut & chickpea curry', 'dinner', 40, { butternut: 1, chickpeas: 1, coconut_milk: 1, onion: 100, curry: 15, rice: 300, oil: 15 }, ['Fry onion with curry powder.', 'Add cubed butternut, chickpeas and coconut milk; simmer 25 min.', 'Serve with rice.']),
  R('d_tuna_bake', 'Tuna pasta bake', 'dinner', 40, { pasta: 500, tuna: 2, cheese: 120, milk: 400, flour: 30, butter: 30, frozen_peas: 150 }, ['Make a white sauce with butter, flour and milk.', 'Mix with pasta, tuna and peas; top with cheese.', 'Bake 20 min at 200°C.']),
  R('d_mince_cabbage', 'Mince & cabbage stir-fry', 'dinner', 25, { mince: 500, cabbage: 0.5, onion: 100, carrot: 150, oil: 15 }, ['Brown mince with onion.', 'Add shredded cabbage and carrot; cook until tender.'], true),
  R('d_hake_veg', 'Hake with roast butternut & broccoli', 'dinner', 40, { hake: 600, butternut: 1, broccoli: 1, oil: 30 }, ['Roast cubed butternut 25 min at 200°C.', 'Add hake and broccoli; roast 15 min more.'], true),
  R('d_garlic_chicken', 'Garlic chicken & broccoli', 'dinner', 25, { chicken_breast: 600, broccoli: 1, garlic: 0.5, butter: 30, spinach: 100 }, ['Pan-fry chicken in garlic butter.', 'Add broccoli and spinach; cook until tender.'], true),
  R('d_shakshuka', 'Shakshuka (eggs in tomato)', 'dinner', 25, { eggs: 8, tomato_can: 2, onion: 150, green_pepper: 2, oil: 15 }, ['Fry onion and pepper.', 'Add tomatoes, simmer 10 min.', 'Crack in eggs, cover and cook 6 min.'], true),
  // More breakfasts
  R('b_bacon_eggs', 'Bacon, eggs & grilled tomato', 'breakfast', 15, { bacon: 250, eggs: 8, tomato: 300, bread: 4 }, ['Fry bacon until crisp.', 'Fry eggs in the pan; grill halved tomatoes.', 'Serve with toast.'], true),
  R('b_french_toast', 'French toast with banana', 'breakfast', 15, { bread: 8, eggs: 4, milk: 200, banana: 2, butter: 20 }, ['Whisk eggs and milk; soak the bread.', 'Fry in butter until golden.', 'Top with sliced banana.']),
  R('b_mince_toast', 'Savoury mince on toast', 'breakfast', 25, { mince: 300, onion: 100, tomato_can: 1, bread: 8 }, ['Brown mince with onion.', 'Add tomatoes and simmer 10 min.', 'Spoon over toast.']),
  R('b_flapjacks', 'Flapjacks with yoghurt & banana', 'breakfast', 25, { flour: 250, eggs: 2, milk: 400, yoghurt: 300, banana: 2, butter: 20 }, ['Whisk flour, eggs and milk into a batter.', 'Cook spoonfuls in a buttered pan until bubbles form, then flip.', 'Serve with yoghurt and banana.']),
  // More lunches
  R('l_corn_fritters', 'Sweetcorn fritters & salad', 'lunch', 25, { sweetcorn: 2, flour: 150, eggs: 2, tomato: 300, spinach: 100, oil: 30 }, ['Mix drained corn, flour and eggs.', 'Fry spoonfuls until golden on both sides.', 'Serve with tomato and spinach.']),
  R('l_toasted_sarmie', 'Cheese & tomato toasted sarmies', 'lunch', 10, { bread: 8, cheese: 120, tomato: 200, butter: 30 }, ['Butter the outsides of the bread.', 'Fill with cheese and tomato.', 'Toast in a pan or sandwich press.']),
  R('l_tuna_pasta_salad', 'Tuna & sweetcorn pasta salad', 'lunch', 20, { pasta: 300, tuna: 2, sweetcorn: 1, mayo: 80, green_pepper: 1 }, ['Cook and cool the pasta.', 'Mix with tuna, corn, chopped pepper and mayo.']),
  R('l_bean_soup', 'Bean & vegetable soup', 'lunch', 35, { baked_beans: 2, carrot: 200, potato: 300, onion: 150, stock: 2, tomato_can: 1 }, ['Soften onion and carrot.', 'Add potato, tomatoes, beans, stock and 800 ml water.', 'Simmer 20 min.']),
  R('l_gem_squash', 'Mince-stuffed gem squash', 'lunch', 40, { gem_squash: 4, mince: 300, onion: 100, cheese: 80 }, ['Boil gem squash halves 15 min.', 'Brown mince with onion.', 'Fill the squash, top with cheese and grill 5 min.'], true),
  R('l_livers_toast', 'Peri-peri chicken livers on toast', 'lunch', 20, { chicken_livers: 500, peri: 40, onion: 150, bread: 8 }, ['Fry onion, add livers and cook 6 min.', 'Stir in peri-peri sauce.', 'Serve on toast.']),
  R('l_chickpea_wraps', 'Smashed chickpea & avo wraps', 'lunch', 10, { wraps: 4, chickpeas: 1, avocado: 2, tomato: 200, lemon: 1 }, ['Mash chickpeas with avo and lemon juice.', 'Fill wraps with the mash and sliced tomato.']),
  // More dinners
  R('d_livers_pap', 'Peri-peri chicken livers & pap', 'dinner', 30, { chicken_livers: 500, peri: 60, onion: 150, tomato_can: 1, maize_meal: 400 }, ['Cook soft pap.', 'Fry onion and livers, add tomatoes and peri-peri; simmer 10 min.', 'Serve over pap.']),
  R('d_mac_cheese', 'Macaroni & cheese with bacon', 'dinner', 35, { pasta: 500, cheese: 200, milk: 600, flour: 40, butter: 40, bacon: 150 }, ['Cook pasta; fry bacon pieces.', 'Make a cheese sauce with butter, flour, milk and cheese.', 'Mix everything and grill until bubbling.']),
  R('d_chicken_pasta', 'Creamy chicken & mushroom pasta', 'dinner', 30, { chicken_breast: 400, pasta: 500, mushrooms: 250, milk: 400, cheese: 80, flour: 30 }, ['Fry sliced chicken and mushrooms.', 'Stir in flour, then milk and cheese to make a sauce.', 'Toss with pasta.']),
  R('d_frikkadels', 'Frikkadels, mash & peas', 'dinner', 45, { mince: 500, onion: 100, eggs: 1, bread: 2, potato: 1000, frozen_peas: 300, butter: 30 }, ['Mix mince, grated onion, egg and soaked bread; shape balls.', 'Bake 25 min at 200°C.', 'Serve with mash and peas.']),
  R('d_chicken_casserole', 'Chicken & veg casserole', 'dinner', 70, { chicken_pieces: 1200, potato: 600, carrot: 300, onion: 150, stock: 2, frozen_peas: 200 }, ['Brown chicken.', 'Add veg and stock; cover and bake 50 min at 180°C.', 'Stir in peas for the last 5 min.']),
  R('d_hake_wraps', 'Crispy hake wraps with slaw', 'dinner', 30, { hake: 500, wraps: 6, cabbage: 0.25, carrot: 150, mayo: 60, lemon: 1, flour: 40, oil: 30 }, ['Dust hake in flour and pan-fry.', 'Toss shredded cabbage and carrot with mayo and lemon.', 'Fill wraps with fish and slaw.']),
  R('d_pilchard_curry', 'Pilchard curry & rice', 'dinner', 30, { pilchards: 2, onion: 150, tomato_can: 1, curry: 15, potato: 400, rice: 300, oil: 15 }, ['Fry onion with curry powder.', 'Add potato, tomatoes and pilchards; simmer 15 min.', 'Serve with rice.']),
  R('d_bean_curry', 'Bean curry & rice', 'dinner', 30, { baked_beans: 3, onion: 150, tomato_can: 1, curry: 15, rice: 300, spinach: 100, oil: 15 }, ['Fry onion with curry powder.', 'Add tomatoes and beans; simmer 15 min, stir in spinach.', 'Serve with rice.']),
  R('d_braai_chops', 'Braaied chops, mielies & tomato salad', 'dinner', 40, { pork_chops: 800, sweetcorn: 2, tomato: 300, onion: 100, spinach: 100 }, ['Braai or grill the chops.', 'Heat the corn with a little butter.', 'Serve with a tomato, onion and spinach salad.']),
  R('d_chakalaka_chicken', 'Chicken & chakalaka bake', 'dinner', 55, { chicken_pieces: 1200, chakalaka: 2, potato: 800 }, ['Put chicken and potato wedges in a dish.', 'Pour over chakalaka.', 'Bake 45 min at 200°C.']),
  R('d_bunny_chow', 'Bean bunny chow', 'dinner', 40, { bread: 20, baked_beans: 2, potato: 400, onion: 150, curry: 15, tomato_can: 1, oil: 15 }, ['Make a bean and potato curry.', 'Hollow out quarter loaves of bread.', 'Fill with curry and top with the bread you removed.']),
  R('d_lentil_bobotie', 'Lentil bobotie & rice', 'dinner', 55, { lentils: 250, onion: 150, bread: 2, milk: 250, eggs: 2, curry: 10, rice: 300, oil: 15 }, ['Cook lentils with onion and curry.', 'Mix in soaked bread; top with egg and milk.', 'Bake 25 min at 180°C; serve with rice.']),
  R('d_bean_chilli', 'Bean & sweet potato chilli', 'dinner', 40, { baked_beans: 2, sweet_potato: 600, tomato_can: 2, onion: 150, green_pepper: 1, rice: 300, oil: 15 }, ['Fry onion and pepper.', 'Add cubed sweet potato, tomatoes and beans; simmer 25 min.', 'Serve with rice.']),
  R('d_potato_omelette', 'Potato & onion omelette with salad', 'dinner', 30, { eggs: 8, potato: 500, onion: 150, spinach: 100, tomato: 200, oil: 30 }, ['Fry sliced potato and onion until soft.', 'Pour over beaten eggs and cook gently, then grill the top.', 'Serve with salad.']),
  R('d_chicken_rice', 'One-pot chicken & rice', 'dinner', 50, { chicken_pieces: 1000, rice: 300, onion: 150, tomato_can: 1, frozen_veg: 300, stock: 2, oil: 15 }, ['Brown chicken with onion.', 'Add rice, tomatoes, stock and 600 ml water.', 'Cover and cook 25 min; stir in veg for the last 5.']),
  R('d_lemon_hake', 'Lemon hake, potatoes & broccoli', 'dinner', 40, { hake: 600, lemon: 1, potato: 600, broccoli: 1, butter: 30 }, ['Roast potato chunks 25 min at 220°C.', 'Add hake with butter and lemon; roast 12 min.', 'Steam broccoli to serve.']),
  R('d_roast_chicken_veg', 'Roast chicken & veg', 'dinner', 55, { chicken_pieces: 1200, butternut: 1, broccoli: 1, onion: 150, oil: 30 }, ['Roast chicken with butternut and onion 45 min at 200°C.', 'Add broccoli for the last 10 min.'], true),
];

// ---------- Fitness snacks (protein top-ups, 1 serving for one person) ----------
export const SNACKS = [
  { id: 's_eggs', name: '2 boiled eggs', ing: { eggs: 2 } },
  { id: 's_yoghurt', name: 'Yoghurt with banana', ing: { yoghurt: 250, banana: 1 } },
  { id: 's_milk', name: 'Glass of milk', ing: { milk: 400 } },
  { id: 's_tuna', name: 'Tuna mayo on toast', ing: { tuna: 0.5, bread: 1, mayo: 15 } },
  { id: 's_pb_toast', name: 'Peanut butter toast', ing: { bread: 2, peanut_butter: 30 } },
  { id: 's_chickpeas', name: 'Roasted chickpeas', ing: { chickpeas: 0.5 } },
  { id: 's_cheese', name: 'Cheese & apple', ing: { cheese: 40, apple: 1 } },
]

// ---------- Diets ----------
export const DIETS = {
  vegetarian:  { label: 'Vegetarian', no: 'mcpf' },
  vegan:       { label: 'Vegan', no: 'mcpfde' },
  pescatarian: { label: 'Pescatarian', no: 'mcp' },
  halal:       { label: 'Halal / no pork', no: 'p' },
  no_red_meat: { label: 'No red meat', no: 'mp' },
  gluten_free: { label: 'Gluten-free', no: 'g' },
  dairy_free:  { label: 'Dairy-free', no: 'd' },
  egg_free:    { label: 'Egg-free', no: 'e' },
  nut_free:    { label: 'Nut-free', no: 'n' },
  fish_free:   { label: 'No fish', no: 'f' },
};
export const PREFERENCES = {
  low_carb: { label: 'Prefer low-carb' },
  high_protein: { label: 'Prefer high-protein' },
};

// ---------- Fitness ----------
export const ACTIVITIES = {
  rest:     { label: 'Rest', kcal: 0 },
  easy_run: { label: 'Easy run', kcal: 450 },
  speed:    { label: 'Speed / intervals', kcal: 550 },
  long_run: { label: 'Long run', kcal: 900 },
  strength: { label: 'Strength / gym', kcal: 300 },
  sport:    { label: 'Sport / cycling', kcal: 500 },
  walk:     { label: 'Walk / light', kcal: 200 },
};
export const GOALS = {
  maintain: { label: 'Maintain / performance', kcalAdj: 1.0, proteinPerKg: 1.4 },
  lose:     { label: 'Lose fat', kcalAdj: 0.85, proteinPerKg: 1.8 },
  gain:     { label: 'Build muscle', kcalAdj: 1.1, proteinPerKg: 1.8 },
};
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ---------- Cycle-aware planning (optional) ----------
// Kept separate from settings so apps can store it on the device only.
export const IRON_TARGET_MG = 18;       // common guideline for menstruating women aged 19-50
export const LUTEAL_TOPUP_KCAL = 150;   // modest extra on higher-appetite days before a period
export const DEFAULT_CYCLE = { enabled: false, lastStart: null, length: 28, periodDays: 5 };

// Phase for each of the 7 plan days. weekStart is a Date (Monday).
//  period: bleeding days; recovery: 3 days after; luteal: last 10 days before the next period.
export function cycleWeek(cycle, weekStart) {
  if (!cycle || !cycle.enabled || !cycle.lastStart) return null;
  const start = new Date(cycle.lastStart + 'T00:00:00');
  if (isNaN(start)) return null;
  const len = Math.min(45, Math.max(20, Number(cycle.length) || 28));
  const per = Math.min(10, Math.max(2, Number(cycle.periodDays) || 5));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - start) / 864e5);
    const day = ((diff % len) + len) % len + 1; // 1-based cycle day
    const phase = day <= per ? 'period' : day <= per + 3 ? 'recovery' : day > len - 10 ? 'luteal' : 'mid';
    return { day, phase };
  });
}
export const CYCLE_LABELS = { period: 'Period', recovery: 'After period', luteal: 'Before period', mid: '' };

// Children eat smaller portions; factors are shares of an adult portion.
export const KID_GROUPS = {
  toddler: { label: 'Ages 1–3', factor: 0.4 },
  child:   { label: 'Ages 4–8', factor: 0.6 },
  preteen: { label: 'Ages 9–13', factor: 0.8 },
  teen:    { label: 'Ages 14–17', factor: 1.0 },
};
// Recipes most children happily eat (mild, familiar).
export const KID_FRIENDLY = new Set(['b_bacon_eggs','b_french_toast','b_mince_toast','b_flapjacks','l_toasted_sarmie','l_tuna_pasta_salad','l_corn_fritters','d_mac_cheese','d_chicken_pasta','d_frikkadels','d_chicken_casserole','d_hake_wraps','d_chicken_rice','d_potato_omelette','d_chakalaka_chicken','d_lemon_hake','b_oats_banana','b_eggs_toast','b_maize_porridge','b_yog_oats','b_pb_toast','b_vegan_oats','b_fruit_yog','b_eggs_avo',
  'l_tuna_wraps','l_chicken_sarmie','l_egg_wraps','l_quesadilla','l_pilchards_toast','l_butternut_soup','l_chakalaka_bread',
  'd_bolognese','d_wors_pap','d_hake_chips','d_fishcakes','d_cottage_pie','d_soya_bolognese','d_pork_mash','d_mushroom_pasta','d_stirfry','d_egg_fried_rice','d_tuna_bake','d_roast_chicken_veg','d_garlic_chicken','d_samp_beans']);

export function kidCount(s) { return Object.values((s && s.kids) || {}).reduce((a, n) => a + (Number(n) || 0), 0); }
// Adult-portion equivalents for the whole household.
export function eaters(s) {
  return (Number(s.householdSize) || 1) + Object.entries(s.kids || {}).reduce((a, [g, n]) => a + (Number(n) || 0) * ((KID_GROUPS[g] || {}).factor || 0), 0);
}
export function householdLabel(s) {
  const a = Number(s.householdSize) || 1, k = kidCount(s);
  return `${a} ${a === 1 ? 'adult' : 'adults'}${k ? `, ${k} ${k === 1 ? 'child' : 'children'}` : ''}`;
}

export const DEFAULT_SETTINGS = {
  householdSize: 2, // adults (and teens counted as adults if preferred)
  kids: { toddler: 0, child: 0, preteen: 0, teen: 0 },
  weeklyBudget: 1200,
  store: 'checkers',
  diets: [],
  prefs: [],
  favourites: [], // recipe ids the household loves; suggested more often
  meals: { breakfast: true, lunch: true, dinner: true },
  includeStaples: false,
  pantry: [],          // ingredient ids the household already has (the Cook tab)
  useUpPantry: false,  // plan the week around what's in the pantry; owned items leave the list total
  fitness: {
    enabled: false,
    weightKg: 75, heightCm: 178, age: 30, sex: 'male',
    goal: 'maintain',
    week: ['easy_run', 'strength', 'speed', 'rest', 'easy_run', 'long_run', 'rest'],
    proteinOverride: null, // g/day
    kcalOverride: null,    // kcal/day on a rest day
    snacks: true,
  },
};

export function mergeSettings(s) {
  const d = DEFAULT_SETTINGS;
  s = s || {};
  return {
    ...d, ...s,
    meals: { ...d.meals, ...(s.meals || {}) },
    kids: { ...d.kids, ...(s.kids || {}) },
    fitness: { ...d.fitness, ...(s.fitness || {}), week: (s.fitness && Array.isArray(s.fitness.week) && s.fitness.week.length === 7) ? s.fitness.week : d.fitness.week },
    diets: Array.isArray(s.diets) ? s.diets : [],
    prefs: Array.isArray(s.prefs) ? s.prefs : [],
    favourites: Array.isArray(s.favourites) ? s.favourites.filter(id => RECIPES.some(r => r.id === id)) : [],
    pantry: Array.isArray(s.pantry) ? [...new Set(s.pantry)].filter(id => INGREDIENTS[id] && !INGREDIENTS[id].staple) : [],
    useUpPantry: !!s.useUpPantry,
  };
}

// Per-person daily targets. Mifflin-St Jeor BMR x 1.3 everyday living, plus the day's exercise.
export function fitnessTargets(f) {
  const w = Number(f.weightKg) || 75, h = Number(f.heightCm) || 175, a = Number(f.age) || 30;
  const bmr = 10 * w + 6.25 * h - 5 * a + (f.sex === 'female' ? -161 : 5);
  const goal = GOALS[f.goal] || GOALS.maintain;
  const restKcal = f.kcalOverride ? Number(f.kcalOverride) : Math.round(bmr * 1.3 * goal.kcalAdj);
  const strengthDays = f.week.filter(x => x === 'strength').length;
  const perKg = Math.min(2.2, goal.proteinPerKg + (strengthDays >= 2 ? 0.2 : 0));
  const protein = f.proteinOverride ? Number(f.proteinOverride) : Math.round(w * perKg);
  const days = f.week.map(act => {
    const ex = Math.round(((ACTIVITIES[act] || ACTIVITIES.rest).kcal) * (w / 70));
    return { activity: act, kcal: restKcal + ex, protein };
  });
  return { bmr: Math.round(bmr), restKcal, protein, perKg: Math.round(perKg * 10) / 10, days };
}

// ---------- Pricing ----------
// priceFeed: { items: { id: { price, pack? } }, storeIndex?: {store: idx}, updatedAt, source }
// overrides: { id: price } set by the user.
export function priceOf(id, store, priceFeed, overrides) {
  const ing = INGREDIENTS[id];
  if (overrides && overrides[id] != null && overrides[id] !== '') return Number(overrides[id]);
  const feed = priceFeed && priceFeed.items && priceFeed.items[id];
  const base = feed && feed.price ? Number(feed.price) : ing.price;
  const idx = (priceFeed && priceFeed.storeIndex && priceFeed.storeIndex[store]) || STORES[store].index;
  return Math.round(base * idx * 100) / 100;
}
export function packOf(id, priceFeed) {
  const feed = priceFeed && priceFeed.items && priceFeed.items[id];
  return (feed && feed.pack) || INGREDIENTS[id].pack;
}

export function recipeById(id) { return RECIPES.find(r => r.id === id) || SNACKS.find(s => s.id === id); }

// Nutrition per serving (one person).
export function recipeNutrition(r) {
  let p = 0, k = 0, fe = 0, c = false;
  const servings = r.ing && r.id.startsWith('s_') ? 1 : 4;
  for (const [id, q] of Object.entries(r.ing)) {
    const ing = INGREDIENTS[id];
    const f = ing.unit === 'ea' ? q : q / 100;
    p += ing.protein * f; k += ing.kcal * f; fe += ing.iron * f; if (ing.vitC) c = true;
  }
  return { protein: Math.round(p / servings), kcal: Math.round(k / servings), iron: Math.round(fe / servings * 10) / 10, vitC: c };
}

export function allowedRecipe(r, diets) {
  const banned = diets.map(d => (DIETS[d] || { no: '' }).no).join('');
  if (!banned) return true;
  return Object.keys(r.ing).every(id => ![...INGREDIENTS[id].flags].some(fl => banned.includes(fl)));
}

// ---------- Grocery list ----------
// plan: { days: [ { breakfast, lunch, dinner, snacks: [ids] } x7 ] } ; each slot holds a recipe id or null.
export function buildList(plan, settings, priceFeed, overrides) {
  const s = settings;
  const need = {};
  const add = (id, q) => { need[id] = (need[id] || 0) + q; };
  for (const day of plan.days) {
    // The fitness person eats `portion` servings; everyone else a standard serving (children less).
    const scale = (eaters(s) - 1 + (day.portion || 1)) / 4;
    for (const slot of ['breakfast', 'lunch', 'dinner']) {
      const r = day[slot] && recipeById(day[slot]);
      if (r) for (const [id, q] of Object.entries(r.ing)) add(id, q * scale);
    }
    for (const sid of day.snacks || []) {
      const sn = recipeById(sid);
      if (sn) for (const [id, q] of Object.entries(sn.ing)) add(id, q);
    }
  }
  const owned = new Set(s.useUpPantry && Array.isArray(s.pantry) ? s.pantry : []);
  const items = Object.entries(need).map(([id, qty]) => {
    const ing = INGREDIENTS[id];
    const pack = packOf(id, priceFeed);
    const packs = Math.max(1, Math.ceil(qty / pack - 1e-9));
    const unitPrice = priceOf(id, s.store, priceFeed, overrides);
    return {
      id, name: ing.name, aisle: ing.aisle, staple: ing.staple, have: owned.has(id), search: ing.search,
      qty, unit: ing.unit, packs, unitPrice, cost: Math.round(packs * unitPrice * 100) / 100,
    };
  }).sort((a, b) => a.aisle.localeCompare(b.aisle) || a.name.localeCompare(b.name));
  // Staples are assumed in the cupboard unless counted; pantry items the household has are never bought.
  const counted = items.filter(i => !i.have && (s.includeStaples || !i.staple));
  const total = Math.round(counted.reduce((t, i) => t + i.cost, 0) * 100) / 100;
  const byStore = {};
  for (const st of Object.keys(STORES)) {
    byStore[st] = Math.round(counted.reduce((t, i) => t + i.packs * priceOf(i.id, st, priceFeed, null), 0));
  }
  return { items, total, byStore };
}

export function formatQty(item) {
  const q = item.qty;
  if (item.unit === 'g') return q >= 1000 ? `${(q / 1000).toFixed(1)} kg` : `${Math.round(q)} g`;
  if (item.unit === 'ml') return q >= 1000 ? `${(q / 1000).toFixed(1)} L` : `${Math.round(q)} ml`;
  return `${Math.round(q * 10) / 10}`;
}

export function listAsText(list, settings) {
  const lines = [`Grocery list (${STORES[settings.store].name}) ~R${Math.round(list.total)}`];
  let aisle = '';
  for (const i of list.items) {
    if ((!settings.includeStaples && i.staple) || i.have) continue;
    if (i.aisle !== aisle) { aisle = i.aisle; lines.push('', aisle.toUpperCase()); }
    lines.push(`- ${i.name} x${i.packs}  (R${i.cost.toFixed(2)})`);
  }
  const st = list.items.filter(i => i.staple && !settings.includeStaples);
  if (st.length) lines.push('', 'CHECK PANTRY', ...st.map(i => `- ${i.name}`));
  const hv = list.items.filter(i => i.have);
  if (hv.length) lines.push('', 'ALREADY HAVE', ...hv.map(i => `- ${ingredientLabel(i.id)}`));
  return lines.join('\n');
}

// ---------- Day nutrition ----------
export function dayNutrition(day) {
  let protein = 0, kcal = 0, iron = 0;
  const f = day.portion || 1;
  for (const slot of ['breakfast', 'lunch', 'dinner']) {
    const r = day[slot] && recipeById(day[slot]);
    if (r) { const n = recipeNutrition(r); protein += n.protein * f; kcal += n.kcal * f; iron += n.iron * f; }
  }
  protein = Math.round(protein); kcal = Math.round(kcal);
  for (const sid of day.snacks || []) { const n = recipeNutrition(recipeById(sid)); protein += n.protein; kcal += n.kcal; iron += n.iron; }
  return { protein, kcal, iron: Math.round(iron * 10) / 10 };
}

export const FAVOURITE_BONUS = 45;
export const isFavourite = (settings, id) => !!(settings && settings.favourites && settings.favourites.includes(id));
export function toggleFavourite(settings, id) {
  const f = new Set(settings.favourites || []);
  if (f.has(id)) f.delete(id); else f.add(id);
  return [...f];
}

// ---------- Planner ----------
function rng(seed) { let x = seed >>> 0 || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }

function candidates(meal, settings) {
  return RECIPES.filter(r => r.meal === meal && allowedRecipe(r, settings.diets));
}

function snackCandidates(settings) {
  return SNACKS.filter(sn => allowedRecipe(sn, settings.diets));
}

function addSnacks(plan, settings, targets) {
  const opts = snackCandidates(settings).map(sn => ({ sn, n: recipeNutrition(sn) }))
    .sort((a, b) => b.n.protein - a.n.protein);
  plan.days.forEach((day, di) => {
    day.snacks = [];
    day.portion = 1;
    if (!settings.fitness.enabled || !targets) return;
    // Scale the fitness person's portions toward the day's calorie target (0.8x-1.7x).
    const base = dayNutrition(day).kcal;
    if (base > 0) day.portion = Math.round(Math.min(1.7, Math.max(0.8, targets.days[di].kcal / base)) * 10) / 10;
    if (!settings.fitness.snacks) return;
    let guard = 0;
    while (dayNutrition(day).protein < targets.days[di].protein - 5 && guard++ < 3 && opts.length) {
      const pick = opts[(di + guard) % Math.min(3, opts.length)];
      day.snacks.push(pick.sn.id);
    }
  });
}

// Plan cost + fit score. Lower cost, more variety, closer protein/kcal match = better.
function evaluate(plan, settings, priceFeed, overrides, targets, opts) {
  const list = buildList(plan, settings, priceFeed, overrides);
  let score = 0;
  const counts = {};
  for (const d of plan.days) for (const sl of ['breakfast', 'lunch', 'dinner']) if (d[sl]) counts[d[sl]] = (counts[d[sl]] || 0) + 1;
  for (const c of Object.values(counts)) score -= (c - 1) * (c - 1) * 30; // repeats
  // Favourites come up more often (repeats are still limited by the penalty above).
  if (settings.favourites && settings.favourites.length) { const fav = new Set(settings.favourites); for (const id of Object.keys(counts)) if (fav.has(id)) score += FAVOURITE_BONUS * Math.min(counts[id], 2); }
  if (kidCount(settings) > 0) for (const d of plan.days) for (const sl of ['breakfast', 'lunch', 'dinner']) if (d[sl] && KID_FRIENDLY.has(d[sl])) score += 25;
  // Reward a mix of chicken / red meat / fish / meat-free dinners (within the diet).
  const kinds = new Set(plan.days.map(d => {
    const r = d.dinner && recipeById(d.dinner); if (!r) return null;
    const fl = Object.keys(r.ing).map(id => INGREDIENTS[id].flags).join('');
    return fl.includes('c') ? 'c' : fl.includes('m') ? 'm' : fl.includes('f') ? 'f' : 'v';
  }).filter(Boolean));
  score += kinds.size * 20;
  if (settings.prefs.includes('low_carb')) for (const d of plan.days) for (const sl of ['breakfast', 'lunch', 'dinner']) { const r = d[sl] && recipeById(d[sl]); if (r && r.lc) score += 60; }
  if ((settings.prefs.includes('high_protein') || settings.fitness.enabled) && targets) {
    plan.days.forEach((d, i) => {
      const n = dayNutrition(d);
      score -= Math.max(0, targets.days[i].protein - n.protein) * 2.5;
      if (settings.fitness.enabled) score -= Math.abs(targets.days[i].kcal - n.kcal) * 0.02;
    });
  } else if (settings.prefs.includes('high_protein')) {
    for (const d of plan.days) score += dayNutrition(d).protein * 0.5;
  }
  const over = list.total - settings.weeklyBudget;
  if (opts && opts.cycle) {
    plan.days.forEach((d, i) => {
      const ph = opts.cycle[i] && opts.cycle[i].phase;
      if (ph === 'period' || ph === 'recovery') {
        const n = dayNutrition(d);
        score -= Math.max(0, IRON_TARGET_MG - n.iron) * 10;          // lean towards iron-rich days
        const dn = d.dinner && recipeById(d.dinner);
        if (dn && recipeNutrition(dn).vitC) score += 8;              // vitamin C helps absorb plant iron
      }
    });
  }
  score -= over > 0 ? over * 3 + 500 : 0;
  score -= list.total * 0.05; // gentle push toward cheaper
  return { score, list };
}

export function generatePlan(settings, priceFeed, overrides, opts = {}) {
  const s = mergeSettings(settings);
  const locked = opts.locked || {}; // { 'dayIdx:slot': recipeId }
  const base = opts.basePlan;
  const targets = planTargets(s, opts.cycle);
  const rand = rng(opts.seed || Date.now());
  const slots = ['breakfast', 'lunch', 'dinner'].filter(m => s.meals[m]);
  const pools = Object.fromEntries(slots.map(m => [m, candidates(m, s)]));
  const empty = slots.find(m => pools[m].length === 0);
  let best = null;
  const iterations = opts.iterations || 400;
  for (let it = 0; it < iterations; it++) {
    const plan = { days: DAYS.map(() => ({ breakfast: null, lunch: null, dinner: null, snacks: [] })) };
    for (let d = 0; d < 7; d++) for (const m of slots) {
      const key = `${d}:${m}`;
      if (locked[key]) { plan.days[d][m] = locked[key]; continue; }
      const pool = pools[m];
      if (!pool.length) continue;
      // Breakfast repeats are fine; bias toward reusing ingredients already chosen.
      plan.days[d][m] = pool[Math.floor(rand() * pool.length)].id;
    }
    addSnacks(plan, s, targets);
    const ev = evaluate(plan, s, priceFeed, overrides, targets, opts);
    if (!best || ev.score > best.score) best = { plan, ...ev };
  }
  // Local improvement: try swapping each unlocked slot for every alternative.
  for (let pass = 0; pass < 2; pass++) {
    for (let d = 0; d < 7; d++) for (const m of slots) {
      if (locked[`${d}:${m}`]) continue;
      for (const r of pools[m]) {
        if (r.id === best.plan.days[d][m]) continue;
        const trial = JSON.parse(JSON.stringify(best.plan));
        trial.days[d][m] = r.id;
        addSnacks(trial, s, targets);
        const ev = evaluate(trial, s, priceFeed, overrides, targets, opts);
        if (ev.score > best.score) best = { plan: trial, ...ev };
      }
    }
  }
  best.plan.createdAt = new Date().toISOString();
  return {
    plan: best.plan, list: best.list, targets,
    overBudget: best.list.total > s.weeklyBudget,
    warning: empty ? `No ${empty} recipes match your dietary filters.` : null,
  };
}

// Training targets, plus the modest pre-period top-up when cycle-aware planning is on.
export function planTargets(settings, cycle) {
  if (!settings.fitness.enabled) return null;
  const t = fitnessTargets(settings.fitness);
  if (cycle) t.days = t.days.map((d, i) => cycle[i] && cycle[i].phase === 'luteal' ? { ...d, kcal: d.kcal + LUTEAL_TOPUP_KCAL, luteal: true } : d);
  return t;
}

// Alternatives for one slot, sorted by resulting weekly total.
export function alternatives(plan, dayIdx, slot, settings, priceFeed, overrides, cycle) {
  const s = mergeSettings(settings);
  const targets = planTargets(s, cycle);
  return candidates(slot, s).filter(r => r.id !== plan.days[dayIdx][slot]).map(r => {
    const trial = JSON.parse(JSON.stringify(plan));
    trial.days[dayIdx][slot] = r.id;
    addSnacks(trial, s, targets);
    const list = buildList(trial, s, priceFeed, overrides);
    return { recipe: r, total: list.total, nutrition: recipeNutrition(r), favourite: isFavourite(s, r.id) };
  }).sort((a, b) => (b.favourite - a.favourite) || (a.total - b.total));
}

export function applySwap(plan, dayIdx, slot, recipeId, settings, cycle) {
  const s = mergeSettings(settings);
  const trial = JSON.parse(JSON.stringify(plan));
  trial.days[dayIdx][slot] = recipeId;
  addSnacks(trial, s, planTargets(s, cycle));
  return trial;
}

// What feeds the planner (store choice excluded: it only changes prices, not meals).
export function planInputsKey(settings, overrides) {
  // Store and favourites don't re-plan the current week; favourites shape the next plan.
  const { store, favourites, pantry, ...rest } = mergeSettings(settings);
  // The pantry only shapes the plan when the household asks Tafel to use it up.
  return JSON.stringify([rest, rest.useUpPantry ? [...pantry].sort() : null, overrides || {}]);
}

// Kept meals that still fit the current settings.
export function validLocks(locked, settings) {
  const s = mergeSettings(settings);
  const out = {};
  for (const [k, id] of Object.entries(locked || {})) {
    const [, slot] = k.split(':');
    const r = recipeById(id);
    if (r && s.meals[slot] && allowedRecipe(r, s.diets)) out[k] = id;
  }
  return out;
}

export function storeSearchUrl(store, item) { return STORES[store].search(item.search); }

// ---------- Cook from what you have ----------
// An ingredient's everyday name, without the pack size: "Eggs (18)" -> "Eggs".
export function ingredientLabel(id) {
  return INGREDIENTS[id].name.replace(/\s*\(.*\)\s*$/, '');
}

// Ingredients a household can tick off, by aisle. Staples (oil, flour, spices,
// stock, sauces) are assumed to be in the cupboard, so they aren't listed.
export function pantryChoices() {
  const groups = {};
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    if (ing.staple) continue;
    (groups[ing.aisle] = groups[ing.aisle] || []).push({ id, name: ingredientLabel(id) });
  }
  return Object.keys(groups).sort().map(aisle => ({ aisle, items: groups[aisle].sort((a, b) => a.name.localeCompare(b.name)) }));
}

export const COOK_LIMIT = { almost: 2, close: 4 }; // most missing ingredients per group
export const COOK_TIMES = [0, 20, 30, 45]; // "ready in" filters, minutes (0 = any)

// Recipes ranked by what the household already has.
//   ready:  nothing to buy
//   almost: one or two things to buy, with what they'd cost at the chosen store
//   close:  three or four to buy, but at least half the ingredients are in
// Diet rules always apply; favourites come first within a group.
export function cookFromPantry(have, settings, priceFeed, overrides, maxMins) {
  const s = mergeSettings(settings);
  const owned = new Set(have || []);
  const out = { ready: [], almost: [], close: [] };
  if (!owned.size) return out;
  for (const r of RECIPES) {
    if (!allowedRecipe(r, s.diets)) continue;
    if (maxMins && r.mins > maxMins) continue;
    const needed = Object.keys(r.ing).filter(id => !INGREDIENTS[id].staple);
    const got = needed.filter(id => owned.has(id));
    if (!got.length) continue;
    const missing = needed.filter(id => !owned.has(id)).map(id => ({
      id, name: ingredientLabel(id), cost: priceOf(id, s.store, priceFeed, overrides),
    }));
    const entry = {
      recipe: r, have: got, missing,
      missingCost: Math.round(missing.reduce((t, m) => t + m.cost, 0) * 100) / 100,
      coverage: got.length / needed.length,
      favourite: isFavourite(s, r.id),
    };
    if (!missing.length) out.ready.push(entry);
    else if (missing.length <= COOK_LIMIT.almost) out.almost.push(entry);
    else if (missing.length <= COOK_LIMIT.close && entry.coverage >= 0.5) out.close.push(entry);
  }
  const fav = (a, b) => (b.favourite - a.favourite);
  // Cooking now: within each group the quickest meals lead.
  out.ready.sort((a, b) => fav(a, b) || a.recipe.mins - b.recipe.mins || b.have.length - a.have.length);
  out.almost.sort((a, b) => fav(a, b) || a.missing.length - b.missing.length || a.recipe.mins - b.recipe.mins);
  out.close.sort((a, b) => fav(a, b) || b.coverage - a.coverage || a.missingCost - b.missingCost);
  return out;
}

// Put a recipe into a day of the plan (the Cook tab's "Add to the week").
// Returns the new plan; the caller recosts it like any swap.
export function placeRecipe(plan, dayIdx, recipeId, settings, cycle) {
  const r = recipeById(recipeId);
  return applySwap(plan, dayIdx, r.meal, recipeId, settings, cycle);
}
