import { useState } from "react";
import {
  ArrowRight,
  Clock3,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Star,
  Utensils,
} from "lucide-react";
import { api } from "../api";
import { TASTE_TAGS } from "../data";
import { DishCard } from "./Dining";
import {
  Button,
  Dialog,
  Empty,
  ErrorMessage,
  Field,
  FoodArt,
  formatDate,
  PageTitle,
  Status,
  ToggleChips,
  useTask,
} from "./UI";

export function MealComposer({ dish, entry, state, onClose, navigate }) {
  const restaurant = state.restaurants.find(
    (item) => item.id === dish?.restaurantId,
  );
  const [name, setName] = useState(entry?.dishName || dish?.name || "");
  const [place, setPlace] = useState(
    entry?.restaurantName || restaurant?.name || "",
  );
  const [rating, setRating] = useState(entry?.rating || 0);
  const [notes, setNotes] = useState(entry?.notes || "");
  const [tags, setTags] = useState(entry?.tags || []);
  const task = useTask();
  function submit(event) {
    event.preventDefault();
    if (!rating) {
      task.setError("Choose a rating from one to five.");
      return;
    }
    task.run(
      () =>
        api.saveMeal({
          id: entry?.id,
          dishId: entry?.dishId || dish?.id,
          restaurantId: entry?.restaurantId || restaurant?.id,
          dishName: name.trim(),
          restaurantName: place.trim(),
          rating,
          notes,
          tags,
        }),
      () => {
        onClose();
        navigate("history");
      },
    );
  }
  return (
    <Dialog title={entry ? "Edit meal" : "Log a meal"} onClose={onClose}>
      <p className="dialog-intro">
        Save the flavors. Next time, you'll know what you loved.
      </p>
      <form onSubmit={submit}>
        <Field label="What did you eat?">
          <input
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your dish name"
          />
        </Field>
        <Field label="Where was it?">
          <input
            required
            maxLength={120}
            value={place}
            onChange={(event) => setPlace(event.target.value)}
            placeholder="Restaurant, home, or somewhere special"
          />
        </Field>
        <fieldset>
          <legend>How was the taste?</legend>
          <div className="star-rating" role="group" aria-label="Taste rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`Rate ${value} ${value === 1 ? "star" : "stars"}`}
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
              >
                <Star
                  size={32}
                  fill={value <= rating ? "currentColor" : "none"}
                  className={value <= rating ? "filled" : ""}
                />
              </button>
            ))}
            <span>
              {
                [
                  "Tap a star",
                  "Not for me",
                  "It was okay",
                  "Pretty good",
                  "Loved it",
                  "A new favorite",
                ][rating]
              }
            </span>
          </div>
        </fieldset>
        <fieldset>
          <legend>What stood out?</legend>
          <ToggleChips
            options={TASTE_TAGS}
            value={tags}
            onChange={setTags}
            label="Meal flavors"
          />
        </fieldset>
        <Field label="A note for next time">
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={1500}
            placeholder="The citrus dressing was the best part…"
          />
        </Field>
        <p className="fine-print">
          Ratings describe taste. They do not verify allergy suitability.
        </p>
        <ErrorMessage error={task.error} />
        <div className="dialog-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button busy={task.busy} type="submit">
            {entry ? "Save changes" : "Save meal"} <Heart size={16} />
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function HistoryPage({ state, navigate, onMeal, initialTab }) {
  const [tab, setTab] = useState(
    initialTab === "requests" ? "requests" : "meals",
  );
  const [query, setQuery] = useState("");
  const meals = state.meals.filter((meal) =>
    `${meal.dishName} ${meal.restaurantName}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const requests = state.requests.filter(
    (request) =>
      request.userId === state.user?.id &&
      request.dishName.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        eyebrow="Your dining journal"
        title="History"
        description="Your favorites, your feedback, and every kitchen conversation."
        action={
          <Button
            onClick={() =>
              state.mode === "guest" ? navigate("auth") : onMeal()
            }
          >
            <Plus size={17} />
            Log a meal
          </Button>
        }
      />
      <div className="history-toolbar">
        <div className="segmented" aria-label="History type">
          <button
            className={tab === "meals" ? "active" : ""}
            onClick={() => setTab("meals")}
            aria-pressed={tab === "meals"}
          >
            <Utensils size={16} />
            Meals <span>{state.meals.length}</span>
          </button>
          <button
            className={tab === "requests" ? "active" : ""}
            onClick={() => setTab("requests")}
            aria-pressed={tab === "requests"}
          >
            <MessageCircle size={16} />
            Requests{" "}
            <span>
              {
                state.requests.filter(
                  (request) => request.userId === state.user?.id,
                ).length
              }
            </span>
          </button>
        </div>
        <label className="search-field compact-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a memory…"
            aria-label="Search history"
          />
        </label>
      </div>
      {tab === "meals" ? (
        meals.length ? (
          <div className="meal-grid">
            {[...meals]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((meal) => (
                <button
                  className="meal-card"
                  key={meal.id}
                  onClick={() => navigate(`meal/${meal.id}`)}
                >
                  <FoodArt
                    dish={
                      state.dishes.find((dish) => dish.id === meal.dishId) || {
                        name: meal.dishName,
                        emoji: "🍽️",
                      }
                    }
                  />
                  <div>
                    <div
                      className="meal-stars"
                      aria-label={`${meal.rating} out of 5 stars`}
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          size={13}
                          key={value}
                          fill={value <= meal.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                    <h3>{meal.dishName}</h3>
                    <p>{meal.restaurantName}</p>
                    <span className="meal-date">
                      {formatDate(meal.createdAt)}
                    </span>
                  </div>
                  <ArrowRight size={18} />
                </button>
              ))}
          </div>
        ) : (
          <Empty
            icon={Clock3}
            title={
              query ? "No matching memories" : "Your next favorite starts here"
            }
            action={
              <Button
                onClick={() =>
                  state.mode === "guest" ? navigate("auth") : onMeal()
                }
              >
                Log your first meal <Plus size={16} />
              </Button>
            }
          >
            {query
              ? "Try another dish or restaurant name."
              : "Keep a little journal of flavors you love. Even meals outside the sample menus belong here."}
          </Empty>
        )
      ) : requests.length ? (
        <div className="request-history">
          {[...requests]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((request) => (
              <button
                className="history-request-row"
                key={request.id}
                onClick={() => navigate(`request/${request.id}`)}
              >
                <div className="request-row-icon">
                  <MessageCircle size={23} />
                </div>
                <div>
                  <h3>{request.dishName}</h3>
                  <p>
                    Version {request.revision} · {formatDate(request.updatedAt)}
                  </p>
                </div>
                <Status status={request.status} />
                <ArrowRight size={18} />
              </button>
            ))}
        </div>
      ) : (
        <Empty
          icon={MessageCircle}
          title="Your conversations will live here"
          action={
            <Button onClick={() => navigate("explore")}>Explore a menu</Button>
          }
        >
          Find a dish and send a request to a participating sample kitchen.
        </Empty>
      )}
    </>
  );
}

export function MealDetail({ id, state, navigate, onEdit }) {
  const meal = state.meals.find((item) => item.id === id);
  if (!meal)
    return (
      <Empty
        icon={Utensils}
        title="Meal not found"
        action={
          <Button onClick={() => navigate("history")}>Back to history</Button>
        }
      >
        This entry is unavailable in the current account.
      </Empty>
    );
  const dish = state.dishes.find((item) => item.id === meal.dishId);
  return (
    <>
      <PageTitle
        back={() => navigate("history")}
        eyebrow="A page from your food journal"
        title={meal.dishName}
        description={`${meal.restaurantName} · ${formatDate(meal.createdAt)}`}
        action={
          <Button variant="secondary" onClick={() => onEdit(meal)}>
            Edit meal
          </Button>
        }
      />
      <div className="detail-grid">
        <div className="dish-visual-card">
          <FoodArt dish={dish || { name: meal.dishName, emoji: "🍽️" }} large />
        </div>
        <div className="panel meal-memory">
          <div
            className="meal-stars large"
            aria-label={`${meal.rating} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                size={27}
                fill={value <= meal.rating ? "currentColor" : "none"}
              />
            ))}
          </div>
          <h2>
            {meal.rating >= 4 ? "One to remember." : "A note for next time."}
          </h2>
          <p>{meal.notes || "No notes added for this meal."}</p>
          <div className="ingredient-tags">
            {meal.tags.map((tag) => (
              <span key={tag}>
                <Sparkles size={13} />
                {tag}
              </span>
            ))}
          </div>
          <p className="fine-print">
            A personal taste memory, not a record of allergy safety.
          </p>
          {dish && (
            <Button onClick={() => navigate(`dish/${dish.id}`)}>
              Find this dish again <ArrowRight size={17} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export function Favorites({ state, navigate }) {
  const dishes = state.dishes.filter((dish) =>
    state.favorites.includes(dish.id),
  );
  return (
    <>
      <PageTitle
        title="Saved dishes"
        description="Dishes that caught your eye. Ingredient information may change before your next visit."
      />
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
          icon={Heart}
          title="Make room for your favorites"
          action={
            <Button onClick={() => navigate("explore")}>Find a favorite</Button>
          }
        >
          Tap the heart on any dish to keep it here.
        </Empty>
      )}
    </>
  );
}
