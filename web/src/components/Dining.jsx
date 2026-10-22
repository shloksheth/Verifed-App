import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Heart,
  Info,
  Leaf,
  MapPin,
  MessageCircle,
  Search,
  ScanLine,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Utensils,
} from "lucide-react";
import { api } from "../api";
import { assessDish, rankDishes } from "../domain";
import {
  Button,
  Empty,
  ErrorMessage,
  FoodArt,
  money,
  PageTitle,
  SectionTitle,
  Status,
  useTask,
} from "./UI";

function OfficialSources({ restaurant, provenance }) {
  const sources = [
    ["Official menu", provenance?.menuUrl || restaurant?.menuUrl],
    ["Allergen source", provenance?.allergenUrl || restaurant?.allergenUrl],
    ["Restaurant website", restaurant?.websiteUrl],
  ].filter(
    ([, url], index, all) =>
      /^https?:\/\//i.test(url || "") &&
      all.findIndex(([, other]) => other === url) === index,
  );
  const phone = restaurant?.phone?.replace(/[^\d+]/g, "");
  return (
    <div className="info-block">
      <h3>Official sources & contact</h3>
      <div className="button-row">
        {sources.map(([label, url]) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            {label} <ArrowUpRight size={14} />
          </a>
        ))}
        {phone && <a href={`tel:${phone}`}>Call {restaurant.phone}</a>}
      </div>
      {(provenance?.reviewedAt || restaurant?.source?.reviewedAt) && (
        <p className="fine-print">
          Sources reviewed{" "}
          {provenance?.reviewedAt || restaurant.source.reviewedAt}.
          {provenance?.scope === "chain" ||
          restaurant?.source?.scope === "chain"
            ? " Chain information; confirm local availability and preparation."
            : ""}
        </p>
      )}
      {restaurant?.source?.note && (
        <p className="fine-print">{restaurant.source.note}</p>
      )}
    </div>
  );
}

export function Assessment({ dish, profile, compact = false }) {
  const assessment = assessDish(dish, profile);
  const conflict = assessment.level === "conflict";
  return (
    <div
      className={`assessment ${conflict ? "conflict" : assessment.level === "unknown" ? "unknown" : "review"} ${compact ? "compact" : ""}`}
    >
      {conflict ? <ShieldAlert size={15} /> : <Info size={15} />}
      <span>
        {conflict
          ? `Contains a profile conflict${compact ? "" : ": " + assessment.conflicts.join(", ")}`
          : assessment.level === "unknown"
            ? "Information needs clarification"
            : "Review ingredients & preparation"}
      </span>
    </div>
  );
}

export function DishCard({ dish, state, navigate }) {
  const task = useTask();
  const saved = state.favorites.includes(dish.id);
  const restaurant = state.restaurants.find(
    (item) => item.id === dish.restaurantId,
  );
  const assessment = assessDish(dish, state.profile, state.meals);
  return (
    <article className="dish-card">
      <div className="dish-card-art">
        <button
          className="art-link"
          onClick={() => navigate(`dish/${dish.id}`)}
          aria-label={`View ${dish.name}`}
        >
          <FoodArt dish={dish} />
        </button>
        <button
          className={`save-button ${saved ? "saved" : ""}`}
          aria-label={`${saved ? "Unsave" : "Save"} ${dish.name}`}
          aria-pressed={saved}
          disabled={task.busy}
          onClick={() =>
            state.mode === "guest"
              ? navigate("auth")
              : task.run(() => api.toggleFavorite(dish.id))
          }
        >
          <Heart size={19} fill={saved ? "currentColor" : "none"} />
        </button>
        {assessment.tasteReasons?.length > 0 && (
          <span className="taste-label">
            <Sparkles size={12} />
            Matches your taste
          </span>
        )}
      </div>
      <div className="dish-card-body">
        <div className="dish-meta">
          <span>{restaurant?.name}</span>
          <strong>{money(dish.price)}</strong>
        </div>
        <button
          className="plain dish-name"
          onClick={() => navigate(`dish/${dish.id}`)}
        >
          {dish.name}
        </button>
        <p>{dish.description}</p>
        {dish.provenance?.kind === "component" && (
          <p className="fine-print">
            Component · Review the complete order separately.
          </p>
        )}
        <Assessment dish={dish} profile={state.profile} compact />
        <ErrorMessage error={task.error} />
      </div>
    </article>
  );
}

export function Home({ state, navigate }) {
  const hasRealMenus = state.restaurants.some(
    (restaurant) => restaurant.fictional === false,
  );
  const active = state.requests.filter(
    (request) =>
      request.userId === state.user?.id &&
      !["completed", "cancelled", "declined"].includes(request.status),
  );
  const recommendations = rankDishes(
    state.dishes,
    state.profile,
    state.meals,
  ).slice(0, 3);
  return (
    <>
      <PageTitle
        eyebrow="LET'S FIND YOUR NEXT MEAL"
        title={
          state.profile.name
            ? `Hi, ${state.profile.name.split(" ")[0]}.`
            : "Welcome to Verifed."
        }
        description="A menu that starts with you."
      />
      <section className="start-dining" aria-label="Open a menu">
        <div className="start-dining-copy">
          <span className="dining-step">AT THE RESTAURANT?</span>
          <h2>Pull up the menu.</h2>
          <p>
            Scan a Verifed code to review a menu and its published information.
          </p>
          <Button onClick={() => navigate("scan")}>
            <ScanLine size={20} /> Scan a menu
          </Button>
        </div>
        <div className="scan-motif" aria-hidden="true">
          <ScanLine size={76} strokeWidth={1.3} />
          <img src="/assets/verifed-mark.png" alt="" />
        </div>
      </section>
      <button className="browse-shortcut" onClick={() => navigate("explore")}>
        <span>
          <CompassIcon />{" "}
          {hasRealMenus ? "Browse restaurant menus" : "Browse sample menus"}
        </span>
        <ArrowRight size={20} />
      </button>
      <div className="home-columns">
        <section>
          <SectionTitle
            title="At your table"
            action={active.length ? "View all" : undefined}
            onClick={() => navigate("history?tab=requests")}
          />
          {active.length ? (
            active.slice(0, 2).map((request) => (
              <button
                className="active-request request-link"
                key={request.id}
                onClick={() => navigate(`request/${request.id}`)}
              >
                <div className="request-illustration">
                  <MessageCircle size={23} />
                </div>
                <div className="active-request-copy">
                  <Status status={request.status} />
                  <h3>{request.dishName}</h3>
                  <p>
                    {request.status === "review_required"
                      ? "The meal changed. A fresh response is needed."
                      : `Meal version ${request.revision} · View conversation`}
                  </p>
                </div>
                <ArrowRight size={20} />
              </button>
            ))
          ) : (
            <div className="quiet-card">
              <MessageCircle size={24} />
              <div>
                <h3>No open requests</h3>
                <p>
                  {hasRealMenus
                    ? "Open a menu entry to review its sources and contact the restaurant."
                    : "Open a dish to send your requirements and preparation questions."}
                </p>
              </div>
            </div>
          )}
        </section>
        <aside className="profile-mini">
          <div className="profile-mini-heading">
            <Leaf size={18} />
            <strong>Dining profile</strong>
            <button
              className="text-button"
              onClick={() => navigate("onboarding")}
            >
              Edit
            </button>
          </div>
          <div className="profile-tags">
            {state.profile.allergies.length ? (
              state.profile.allergies
                .slice(0, 3)
                .map((item) => (
                  <span key={item}>Avoid {item.toLowerCase()}</span>
                ))
            ) : (
              <span>No allergies added</span>
            )}
            {state.profile.likes.slice(0, 2).map((item) => (
              <span className="taste" key={item}>
                {item}
              </span>
            ))}
          </div>
          <p>You choose what to share with each kitchen.</p>
        </aside>
      </div>
      <section className="section-space">
        <SectionTitle
          title="Based on your taste"
          action="See menus"
          onClick={() => navigate("explore")}
        />
        <p className="section-caption">
          Suggestions from your preferences and ratings. Check ingredients and
          preparation with the restaurant.
        </p>
        <div className="dish-grid">
          {recommendations.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              state={state}
              navigate={navigate}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function CompassIcon() {
  return <Utensils size={19} />;
}

export function Explore({ state, navigate }) {
  const hasRealMenus = state.restaurants.some(
    (restaurant) => restaurant.fictional === false,
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [noConflict, setNoConflict] = useState(false);
  const categories = [
    "All",
    ...new Set(state.dishes.map((dish) => dish.category)),
  ];
  const search = query.toLowerCase();
  const matches = (dish) =>
    [
      dish.name,
      dish.description,
      ...dish.tags,
      state.restaurants.find((r) => r.id === dish.restaurantId)?.name,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search);
  const dishes = rankDishes(
    state.dishes.filter(
      (dish) =>
        matches(dish) &&
        (category === "All" || dish.category === category) &&
        (!noConflict ||
          assessDish(dish, state.profile, state.meals).level !== "conflict"),
    ),
    state.profile,
    state.meals,
  );
  return (
    <>
      <PageTitle
        eyebrow="FIND A DISH"
        title="Explore menus"
        description="Review menu information, find flavors you like, and contact the restaurant."
      />
      <div className="search-row">
        <label className="search-field">
          <Search size={20} />
          <input
            aria-label="Search dishes and restaurants"
            placeholder="A dish, a flavor, a restaurant…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")}>
              ×
            </button>
          )}
        </label>
        <button
          className={`filter-button ${noConflict ? "selected" : ""}`}
          aria-pressed={noConflict}
          onClick={() => setNoConflict(!noConflict)}
        >
          <SlidersHorizontal size={17} />
          {noConflict ? "Conflicts hidden" : "Hide known conflicts"}
        </button>
      </div>
      <p className="search-note">
        Filtering uses reported ingredients, not a safety guarantee. Unknown
        information stays visible.
      </p>
      <div className="category-tabs" aria-label="Dish categories">
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? "active" : ""}
            onClick={() => setCategory(item)}
            aria-pressed={category === item}
          >
            {item}
          </button>
        ))}
      </div>
      {!query && category === "All" && (
        <section className="section-space">
          <SectionTitle
            title={hasRealMenus ? "Restaurants" : "Sample restaurants"}
          />
          <div className="restaurant-grid">
            {state.restaurants.map((restaurant, index) => (
              <button
                className={`restaurant-card restaurant-${index % 3}`}
                key={restaurant.id}
                onClick={() => navigate(`restaurant/${restaurant.id}`)}
              >
                <span className="restaurant-symbol" aria-hidden="true">
                  {restaurant.emoji || "🍽️"}
                </span>
                <div>
                  <h3>{restaurant.name}</h3>
                  <p>
                    <MapPin size={12} />
                    {restaurant.location}
                  </p>
                  <span className="restaurant-type">
                    {restaurant.fictional === false
                      ? "Published sources · Contact restaurant"
                      : restaurant.confirmed
                        ? "Sample kitchen workspace"
                        : "Unconfirmed sample menu"}
                  </span>
                </div>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </section>
      )}
      <section className="section-space">
        <SectionTitle title={query ? `Results for “${query}”` : "The menu"} />
        <p className="section-caption">
          {dishes.length} menu entries ·{" "}
          {hasRealMenus
            ? "Published source information; prices may be unavailable."
            : "Prices and restaurants are fictional."}
        </p>
        {dishes.length ? (
          <div className="dish-grid">
            {dishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                state={state}
                navigate={navigate}
              />
            ))}
          </div>
        ) : (
          <Empty
            icon={Search}
            title="No dishes on this table yet"
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                  setNoConflict(false);
                }}
              >
                Reset filters
              </Button>
            }
          >
            Try another flavor or clear a filter.
          </Empty>
        )}
      </section>
    </>
  );
}

export function Restaurant({ id, state, navigate }) {
  const restaurant = state.restaurants.find((item) => item.id === id);
  if (!restaurant)
    return (
      <Empty
        icon={Utensils}
        title="Restaurant not found"
        action={
          <Button onClick={() => navigate("explore")}>Explore menus</Button>
        }
      >
        This menu may no longer be available.
      </Empty>
    );
  const dishes = state.dishes.filter((dish) => dish.restaurantId === id);
  return (
    <>
      <PageTitle
        back={() => navigate("explore")}
        eyebrow={
          restaurant.fictional === false
            ? "Restaurant · Published sources"
            : "Fictional restaurant · demonstration"
        }
        title={restaurant.name}
        description={restaurant.description}
      />
      <div className="restaurant-banner">
        <span className="restaurant-big-symbol">
          {restaurant.emoji || "🍽️"}
        </span>
        <div>
          <p>
            <MapPin size={16} />
            {restaurant.address || restaurant.location}
          </p>
          <h3>
            {restaurant.fictional === false
              ? "Review the sources. Contact the restaurant."
              : restaurant.confirmed
                ? "A kitchen conversation, built in."
                : "Explore now. Confirm with the restaurant."}
          </h3>
          <p>
            {restaurant.fictional === false
              ? "Published information does not establish a restaurant partnership or kitchen connection. Confirm your complete order and preparation directly."
              : restaurant.confirmed
                ? "Practice the request and response flow using this sample kitchen."
                : "This sample menu is unconfirmed. Save dishes and log meals; ingredient questions need direct restaurant confirmation."}
          </p>
        </div>
        <span className="badge">
          {restaurant.fictional === false ? "Published menu" : "Sample menu"}
        </span>
      </div>
      {restaurant.fictional === false && (
        <OfficialSources restaurant={restaurant} />
      )}
      <SectionTitle title="The menu" />
      <div className="dish-grid">
        {dishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            state={state}
            navigate={navigate}
          />
        ))}
      </div>
    </>
  );
}

export function DishDetail({ id, state, navigate, onRequest, onMeal }) {
  const task = useTask();
  const dish = state.dishes.find((item) => item.id === id);
  if (!dish)
    return (
      <Empty
        icon={Utensils}
        title="Dish not found"
        action={
          <Button onClick={() => navigate("explore")}>Back to menus</Button>
        }
      >
        The menu may have changed.
      </Empty>
    );
  const restaurant = state.restaurants.find(
    (item) => item.id === dish.restaurantId,
  );
  const assessment = assessDish(dish, state.profile, state.meals);
  const saved = state.favorites.includes(id);
  return (
    <>
      <PageTitle
        back={() => navigate(`restaurant/${restaurant.id}`)}
        eyebrow={restaurant.name}
        title={dish.name}
        description={dish.description}
      />
      <div className="detail-grid">
        <section className="dish-visual-card">
          <FoodArt dish={dish} large />
          <div className="dish-visual-bottom">
            <span>{dish.category}</span>
            <strong>{money(dish.price)}</strong>
            <span className="badge">
              {dish.provenance
                ? dish.provenance.kind === "component"
                  ? "Component"
                  : "Published menu item"
                : "Sample dish"}
            </span>
          </div>
          <div className="dish-taste">
            <Sparkles size={20} />
            <div>
              <h3>Flavor profile</h3>{" "}
              {assessment.learnedReasons?.length > 0 && (
                <p className="fine-print">
                  {assessment.learnedReasons.join(". ")}. Taste suggestions
                  never replace ingredient review.
                </p>
              )}
              <p>
                {dish.tags
                  .filter(
                    (tag) =>
                      !["Vegan", "Vegetarian", "Gluten-free"].includes(tag),
                  )
                  .join(" · ") || "Add your review to remember this meal."}
              </p>
              {assessment.tasteReasons?.length > 0 && (
                <small>
                  Matches your preferences: {assessment.tasteReasons.join(", ")}
                </small>
              )}
            </div>
          </div>
        </section>
        <section className="panel dish-info">
          <div className="panel-heading">
            <h2>Know your dish</h2>
            <span className="badge">Menu v{dish.revision}</span>
          </div>
          <Assessment dish={dish} profile={state.profile} />
          {dish.provenance?.kind === "component" && (
            <p className="inline-notice">
              This listing describes one component, not a complete meal. Review
              all fillings, toppings, sauces and preparation for the full order.
            </p>
          )}
          <h3>Reported ingredients</h3>
          {dish.ingredients.length ? (
            <div className="ingredient-tags">
              {dish.ingredients.map((ingredient) => (
                <span key={ingredient}>{ingredient}</span>
              ))}
            </div>
          ) : (
            <p>
              Full ingredients are not available in this listing. Review the
              official source and ask the restaurant.
            </p>
          )}
          <div className="info-block">
            <h3>Declared allergens</h3>
            <p>
              {dish.allergens.length
                ? dish.allergens.join(", ")
                : "No allergens declared in this listing. This does not establish absence."}
            </p>
          </div>
          {dish.provenance && (
            <>
              <OfficialSources
                restaurant={restaurant}
                provenance={dish.provenance}
              />
              {dish.provenance.evidenceNote && (
                <p>{dish.provenance.evidenceNote}</p>
              )}
              {dish.provenance.coverage?.length > 0 && (
                <p className="fine-print">
                  Recorded source categories:{" "}
                  {dish.provenance.coverage.join(", ")}. Unlisted categories
                  remain unknown.
                </p>
              )}
              {dish.provenance.freeFromClaims?.length > 0 && (
                <div className="info-block">
                  <h3>Restaurant labels</h3>
                  <p>{dish.provenance.freeFromClaims.join(" · ")}</p>
                  <p className="fine-print">
                    These published claims do not establish absence or resolve
                    cross-contact.
                  </p>
                </div>
              )}
            </>
          )}
          <div className="info-block">
            <h3>Preparation & cross-contact</h3>
            <p>
              {dish.preparation ||
                "Preparation information has not been supplied. Ask the kitchen."}
            </p>
          </div>
          {dish.modifications.length > 0 && (
            <div className="info-block">
              <h3>Modifications to ask about</h3>
              <ul className="simple-list">
                {dish.modifications.map((item) => (
                  <li key={item}>
                    <Check size={14} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="fine-print">
            Actual ingredients and preparation can change. A kitchen response
            records communication, not a guarantee about the meal.
          </p>
          <div className="button-stack">
            {restaurant.confirmed && restaurant.fictional !== false ? (
              <Button
                onClick={() =>
                  state.mode === "guest" ? navigate("auth") : onRequest(dish)
                }
              >
                Ask the kitchen <MessageCircle size={18} />
              </Button>
            ) : (
              <div className="inline-notice">
                <Info size={18} />
                <p>
                  This restaurant has no kitchen connection. Contact the
                  restaurant directly.
                </p>
              </div>
            )}
            <div className="button-row">
              <Button
                variant="secondary"
                busy={task.busy}
                onClick={() =>
                  state.mode === "guest"
                    ? navigate("auth")
                    : task.run(() => api.toggleFavorite(id))
                }
              >
                <Heart size={17} fill={saved ? "currentColor" : "none"} />
                {saved ? "Saved" : "Save dish"}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  state.mode === "guest" ? navigate("auth") : onMeal(dish)
                }
              >
                Log a meal
              </Button>
            </div>
            <ErrorMessage error={task.error} />
          </div>
        </section>
      </div>
    </>
  );
}
