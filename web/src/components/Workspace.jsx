import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChefHat,
  ClipboardList,
  Clock3,
  Download,
  FilePenLine,
  Info,
  MessageCircle,
  Plus,
  QrCode,
  RefreshCw,
  Settings,
  Utensils,
} from "lucide-react";
import { api } from "../api";
import { ALLERGENS, RESTRICTIONS, TASTE_TAGS } from "../data";
import { RequestSnapshot, RequestTimeline } from "./Requests";
import {
  Button,
  Dialog,
  Empty,
  ErrorMessage,
  Field,
  FoodArt,
  formatDate,
  money,
  PageTitle,
  Status,
  ToggleChips,
  useTask,
} from "./UI";

function RestaurantSetup({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("Orlando");
  const [description, setDescription] = useState("");
  const task = useTask();
  return (
    <Dialog title="Your sample restaurant space" onClose={onClose}>
      <p className="dialog-intro">
        Create a fictional workspace you own. It includes a starter menu so you
        can test requests with another account.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          task.run(
            () =>
              api.createRestaurant({
                name: name.trim(),
                location: location.trim(),
                description: description.trim(),
              }),
            (result) => {
              onClose();
              onCreated(result);
            },
          );
        }}
      >
        <Field label="Sample restaurant name">
          <input
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your sample kitchen"
          />
        </Field>
        <Field label="Location">
          <input
            required
            maxLength={150}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </Field>
        <Field label="A little about your menu">
          <textarea
            required
            rows={3}
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Bright bowls and fresh seasonal flavors…"
          />
        </Field>
        <ErrorMessage error={task.error} />
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={task.busy}>
            Create sample workspace <Plus size={16} />
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function DishEditor({ dish, restaurantId, onClose }) {
  const [draft, setDraft] = useState(
    dish || {
      restaurantId,
      name: "",
      description: "",
      price: 0,
      emoji: "🍽️",
      category: "Plates",
      ingredients: [],
      allergens: [],
      tags: [],
      modifications: [],
      preparation: "",
      informationComplete: false,
    },
  );
  const [ingredients, setIngredients] = useState(draft.ingredients.join(", "));
  const [modifications, setModifications] = useState(
    draft.modifications.join("\n"),
  );
  const task = useTask();
  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  return (
    <Dialog
      title={dish ? "Edit the menu item" : "Add something delicious"}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = {
            ...draft,
            ingredients: ingredients
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            modifications: modifications
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          };
          task.run(
            () => (dish ? api.saveDish(value) : api.addDish(value)),
            onClose,
          );
        }}
      >
        <div className="form-columns">
          <Field label="Dish name">
            <input
              required
              maxLength={120}
              value={draft.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </Field>
          <Field label="Category">
            <input
              required
              maxLength={50}
              value={draft.category}
              onChange={(event) => update("category", event.target.value)}
            />
          </Field>
          <Field label="Price (USD)">
            <input
              type="number"
              min="0"
              max="1000"
              step="0.01"
              required
              value={draft.price}
              onChange={(event) => update("price", Number(event.target.value))}
            />
          </Field>
          <Field
            label="Dish symbol"
            hint="An emoji for the sample menu artwork."
          >
            <input
              required
              maxLength={12}
              value={draft.emoji}
              onChange={(event) => update("emoji", event.target.value)}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            rows={2}
            required
            maxLength={500}
            value={draft.description}
            onChange={(event) => update("description", event.target.value)}
          />
        </Field>
        <Field
          label="Reported ingredients"
          hint="Separate ingredients with commas."
        >
          <textarea
            rows={2}
            required
            value={ingredients}
            onChange={(event) => setIngredients(event.target.value)}
          />
        </Field>
        <fieldset>
          <legend>Declared allergens</legend>
          <ToggleChips
            options={ALLERGENS}
            value={draft.allergens}
            onChange={(value) => update("allergens", value)}
            label="Declared dish allergens"
          />
        </fieldset>
        <fieldset>
          <legend>Flavor and dietary tags</legend>
          <ToggleChips
            options={[...TASTE_TAGS, ...RESTRICTIONS]}
            value={draft.tags}
            onChange={(value) => update("tags", value)}
            label="Dish flavor and dietary tags"
          />
        </fieldset>
        <Field label="Offered modifications" hint="One modification per line.">
          <textarea
            rows={2}
            value={modifications}
            onChange={(event) => setModifications(event.target.value)}
          />
        </Field>
        <Field label="Preparation & cross-contact information">
          <textarea
            rows={3}
            required
            maxLength={1500}
            value={draft.preparation}
            onChange={(event) => update("preparation", event.target.value)}
          />
        </Field>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={draft.informationComplete}
            onChange={(event) =>
              update("informationComplete", event.target.checked)
            }
          />
          Ingredient information has been entered for this sample dish.
        </label>
        {dish && (
          <div className="inline-notice">
            <Info size={18} />
            <p>
              Saving creates a new menu revision and requires a fresh review of
              every active request for this dish.
            </p>
          </div>
        )}
        <ErrorMessage error={task.error} />
        <div className="dialog-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={task.busy}>
            {dish ? "Save new menu revision" : "Add to menu"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function ChangeForm({ request, onClose }) {
  const [expectedRevision] = useState(request.revision);
  const [ingredients, setIngredients] = useState(
    request.snapshot.ingredients.join(", "),
  );
  const [allergens, setAllergens] = useState(request.snapshot.allergens);
  const [preparation, setPreparation] = useState(request.snapshot.preparation);
  const [reason, setReason] = useState("");
  const task = useTask();
  return (
    <Dialog title="Record a meal change" onClose={onClose}>
      <p className="dialog-intro">
        Update this meal's reported information. The earlier response and
        acknowledgment will no longer apply.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          task.run(
            () =>
              api.actOnRequest(
                request.id,
                "change",
                {
                  ingredients: ingredients
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  allergens,
                  preparation,
                  reason,
                },
                expectedRevision,
              ),
            onClose,
          );
        }}
      >
        <Field label="Ingredients (comma separated)">
          <textarea
            required
            rows={3}
            value={ingredients}
            onChange={(event) => setIngredients(event.target.value)}
          />
        </Field>
        <fieldset>
          <legend>Declared allergens</legend>
          <ToggleChips
            options={ALLERGENS}
            value={allergens}
            onChange={setAllergens}
            label="Changed allergens"
          />
        </fieldset>
        <Field label="Preparation details">
          <textarea
            required
            rows={3}
            value={preparation}
            onChange={(event) => setPreparation(event.target.value)}
          />
        </Field>
        <Field label="Explain what changed">
          <textarea
            required
            rows={3}
            maxLength={1500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="For example: the citrus dressing was replaced with a yogurt dressing containing milk."
          />
        </Field>
        <ErrorMessage error={task.error} />
        <div className="dialog-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={task.busy}>
            Record change & require review
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function StaffRequest({ request, navigate }) {
  // A draft belongs to the meal the staff member actually read, not a later poll.
  const [expectedRevision, setExpectedRevision] = useState(request.revision);
  const [decision, setDecision] = useState("accommodate");
  const [message, setMessage] = useState("");
  const [changing, setChanging] = useState(false);
  const task = useTask();
  const closed = ["completed", "cancelled", "declined"].includes(
    request.status,
  );
  return (
    <div className="staff-detail">
      <div className="staff-detail-heading">
        <div>
          <span className="eyebrow">Meal version {request.revision}</span>
          <h2>{request.dishName}</h2>
        </div>
        <Status status={request.status} />
      </div>
      <RequestSnapshot request={request} staff />
      {!closed && (
        <section className="panel staff-response">
          <div className="panel-heading">
            <h2>
              <MessageCircle size={20} />
              Write a kitchen response
            </h2>
          </div>
          {request.status === "acknowledged" ? (
            <div className="inline-success">
              <Check size={18} />
              <p>
                The diner read the current response. Record any change before
                issuing a new response. The diner completes the request.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                task.run(
                  () =>
                    api.actOnRequest(
                      request.id,
                      "respond",
                      { decision, message },
                      expectedRevision,
                    ),
                  () => {
                    setMessage("");
                    setExpectedRevision(request.revision);
                  },
                );
              }}
            >
              {expectedRevision !== request.revision && (
                <div className="inline-notice" role="alert">
                  <p>
                    This meal changed while you were writing. Review the latest
                    snapshot, then start a new response.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setMessage("");
                      setExpectedRevision(request.revision);
                    }}
                  >
                    Review version {request.revision} and start again
                  </Button>
                </div>
              )}
              <Field label="Response type">
                <select
                  value={decision}
                  onChange={(event) => setDecision(event.target.value)}
                >
                  <option value="accommodate">
                    Can accommodate as described below
                  </option>
                  <option value="clarify">Need more information</option>
                  <option value="decline">Unable to accommodate</option>
                </select>
              </Field>
              <Field label="Ingredients, preparation, and limitations">
                <textarea
                  required
                  rows={4}
                  maxLength={1500}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Explain what staff reviewed, what can be changed, and any uncertainty or preparation limitations."
                />
              </Field>
              <Button
                busy={task.busy}
                disabled={expectedRevision !== request.revision}
                type="submit"
              >
                Send kitchen response <ArrowRight size={16} />
              </Button>
            </form>
          )}
          <div className="staff-change-action">
            <p>Ingredient or preparation change?</p>
            <Button variant="secondary" onClick={() => setChanging(true)}>
              <RefreshCw size={16} />
              Record a change
            </Button>
          </div>
          <ErrorMessage error={task.error} />
        </section>
      )}
      {request.response && (
        <section className="panel">
          <h3>Latest kitchen response</h3>
          <p>{request.response.message}</p>
          <p className="fine-print">
            Version {request.response.revision} ·{" "}
            {formatDate(request.response.createdAt)}
          </p>
        </section>
      )}
      <RequestTimeline request={request} staff />
      <button
        className="text-button"
        onClick={() => navigate(`request/${request.id}`)}
      >
        Open conversation detail <ArrowRight size={16} />
      </button>
      {changing && (
        <ChangeForm request={request} onClose={() => setChanging(false)} />
      )}
    </div>
  );
}

function ShareMenu({ restaurant }) {
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}${window.location.pathname}#/restaurant/${restaurant.id}`;
  useEffect(() => {
    let active = true;
    import("qrcode")
      .then((module) =>
        module.default.toDataURL(link, {
          width: 280,
          margin: 2,
          color: { dark: "#30291F", light: "#FFFFFF" },
        }),
      )
      .then((value) => {
        if (active) setQr(value);
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [link]);
  return (
    <section className="panel share-menu">
      <div>
        <span className="eyebrow">MENU ACCESS</span>
        <h2>Share your menu</h2>
        <p>
          Share this QR code or menu link with a test diner. They can browse on
          their phone and create a request after signing in.
        </p>
        <Field label="Menu link">
          <input
            readOnly
            value={link}
            onFocus={(event) => event.target.select()}
          />
        </Field>
        <Button
          variant="secondary"
          onClick={async () => {
            setError("");
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            } catch {
              setError(
                "Clipboard access is unavailable. Select the menu link above and copy it.",
              );
            }
          }}
        >
          {copied ? "Link copied" : "Copy menu link"}
        </Button>
        {copied && (
          <p role="status" className="fine-print">
            Menu link copied to your clipboard.
          </p>
        )}
        <Field label="Restaurant code">
          <input
            readOnly
            value={restaurant.id}
            onFocus={(event) => event.target.select()}
          />
        </Field>
        {qr && (
          <a
            className="button secondary"
            download={`${restaurant.id}-menu-qr.png`}
            href={qr}
          >
            <Download size={17} />
            Download QR code
          </a>
        )}
        <ErrorMessage error={error} />
      </div>
      {qr ? (
        <img
          src={qr}
          alt={`QR code opening the ${restaurant.name} sample menu`}
        />
      ) : (
        <div className="qr-loading">
          <QrCode size={44} />
          <p>Preparing menu code…</p>
        </div>
      )}
    </section>
  );
}

export default function Workspace({ state, navigate, initialRequest }) {
  const owned = state.restaurants.filter((restaurant) =>
    state.memberships.some(
      (membership) => membership.restaurantId === restaurant.id,
    ),
  );
  const [restaurantId, setRestaurantId] = useState(
    owned.find((restaurant) =>
      state.requests.some(
        (request) =>
          request.id === initialRequest &&
          request.restaurantId === restaurant.id,
      ),
    )?.id ||
      owned[0]?.id ||
      "",
  );
  const [tab, setTab] = useState("queue");
  const [filter, setFilter] = useState("active");
  const [selected, setSelected] = useState(initialRequest || "");
  const [setup, setSetup] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const task = useTask();
  const restaurant = owned.find((item) => item.id === restaurantId) || owned[0];
  const allRequests = state.requests.filter(
    (request) => request.restaurantId === restaurant?.id,
  );
  const active = allRequests.filter(
    (request) =>
      !["completed", "cancelled", "declined"].includes(request.status),
  );
  const shown = (
    filter === "active"
      ? active
      : filter === "review"
        ? active.filter((request) => request.status === "review_required")
        : allRequests
  ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const request = allRequests.find((item) => item.id === selected) || shown[0];
  const dishes = state.dishes.filter(
    (dish) => dish.restaurantId === restaurant?.id,
  );
  if (state.mode === "guest")
    return (
      <>
        <PageTitle
          eyebrow="A clearer kitchen conversation"
          title="Welcome to the other side of the table."
          description="A focused workspace for dietary requests, meal changes, and your sample menu."
        />
        <Empty
          icon={ChefHat}
          title="Open your restaurant space"
          action={
            <div className="button-row">
              <Button onClick={() => navigate("auth")}>Sign in</Button>
              <Button
                variant="secondary"
                busy={task.busy}
                onClick={() => task.run(() => api.enterDemo())}
              >
                Try the sample kitchen
              </Button>
            </div>
          }
        >
          Sign in to create an owned sample workspace, or explore with local
          demo data.
        </Empty>
        <ErrorMessage error={task.error} />
      </>
    );
  return (
    <>
      <PageTitle
        eyebrow="Restaurant space · fictional demonstration"
        title={restaurant?.name || "Your kitchen. A clearer conversation."}
        description="Every request, every requirement, every reported change — together."
        action={
          <Button variant="secondary" onClick={() => setSetup(true)}>
            <Plus size={17} />
            New sample workspace
          </Button>
        }
      />
      {owned.length > 1 && (
        <Field label="Workspace">
          <select
            value={restaurant?.id}
            onChange={(event) => {
              setRestaurantId(event.target.value);
              setSelected("");
            }}
          >
            {owned.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {restaurant ? (
        <>
          <div className="workspace-tabs">
            {[
              { id: "queue", label: "Request queue", icon: ClipboardList },
              { id: "menu", label: "Menu manager", icon: Utensils },
              { id: "share", label: "Share menu", icon: QrCode },
            ].map((item) => (
              <button
                key={item.id}
                className={tab === item.id ? "active" : ""}
                onClick={() => setTab(item.id)}
              >
                <item.icon size={18} />
                {item.label}
                {item.id === "queue" && <span>{active.length}</span>}
              </button>
            ))}
          </div>
          {tab === "queue" && (
            <>
              <div className="workspace-overview">
                <div>
                  <span>Open conversations</span>
                  <strong>{active.length}</strong>
                </div>
                <div>
                  <span>Need a fresh review</span>
                  <strong>
                    {
                      active.filter((item) => item.status === "review_required")
                        .length
                    }
                  </strong>
                </div>
                <div>
                  <span>Awaiting a kitchen response</span>
                  <strong>
                    {
                      active.filter((item) =>
                        ["submitted", "review_required"].includes(item.status),
                      ).length
                    }
                  </strong>
                </div>
                <p>
                  <Info size={17} />
                  Counts reflect this workspace's actual sample requests.
                </p>
              </div>
              <div className="queue-layout">
                <section className="queue-list">
                  <div className="queue-filter">
                    <select
                      aria-label="Filter request queue"
                      value={filter}
                      onChange={(event) => {
                        setFilter(event.target.value);
                        setSelected("");
                      }}
                    >
                      <option value="active">Active requests</option>
                      <option value="review">Changes to review</option>
                      <option value="all">All requests</option>
                    </select>
                    <button
                      className="icon-button"
                      aria-label="Refresh requests"
                      disabled={task.busy}
                      onClick={() => task.run(() => api.refresh())}
                    >
                      <RefreshCw
                        size={17}
                        className={task.busy ? "spin" : ""}
                      />
                    </button>
                  </div>
                  <ErrorMessage error={task.error} />
                  {shown.length ? (
                    shown.map((item) => (
                      <button
                        key={item.id}
                        className={`queue-card ${request?.id === item.id ? "selected" : ""}`}
                        onClick={() => setSelected(item.id)}
                      >
                        <div>
                          <span className="eyebrow">
                            #{item.id.slice(0, 6)} · v{item.revision}
                          </span>
                          <span className="queue-time">
                            {new Date(item.updatedAt).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h3>{item.dishName}</h3>
                        <p>
                          {item.snapshot.allergies.length
                            ? item.snapshot.allergies.join(" · ")
                            : "No allergies shared"}
                        </p>
                        <Status status={item.status} />
                      </button>
                    ))
                  ) : (
                    <Empty icon={Clock3} title="A quiet moment in the kitchen">
                      No requests match this view.
                    </Empty>
                  )}
                </section>
                {request ? (
                  <StaffRequest
                    key={request.id}
                    request={request}
                    navigate={navigate}
                  />
                ) : (
                  <Empty
                    icon={MessageCircle}
                    title="Your next conversation starts with a menu"
                    action={
                      <Button
                        onClick={() => navigate(`restaurant/${restaurant.id}`)}
                      >
                        Open diner menu <ArrowRight size={16} />
                      </Button>
                    }
                  >
                    Create a sample request from the diner view, then return
                    here to respond.
                  </Empty>
                )}
              </div>
            </>
          )}
          {tab === "menu" && (
            <>
              <div className="section-title">
                <div>
                  <h2>A menu with the details that matter</h2>
                  <p className="section-caption">
                    Editing a dish requires fresh review of its active requests.
                  </p>
                </div>
                <Button onClick={() => setAdding(true)}>
                  <Plus size={17} />
                  Add dish
                </Button>
              </div>
              <div className="menu-management">
                {dishes.map((dish) => (
                  <article key={dish.id} className="menu-item-row">
                    <FoodArt dish={dish} />
                    <div>
                      <h3>{dish.name}</h3>
                      <p>
                        {dish.allergens.length
                          ? `Declared: ${dish.allergens.join(", ")}`
                          : "No allergens declared"}
                      </p>
                      <span className="fine-print">
                        {dish.category} · Menu v{dish.revision} ·{" "}
                        {money(dish.price)}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setEditing(dish)}
                    >
                      <FilePenLine size={16} />
                      Edit dish
                    </Button>
                  </article>
                ))}
              </div>
            </>
          )}
          {tab === "share" && <ShareMenu restaurant={restaurant} />}
        </>
      ) : (
        <Empty
          icon={ChefHat}
          title="Let's set your table"
          action={
            <Button onClick={() => setSetup(true)}>
              Create a sample workspace <Plus size={17} />
            </Button>
          }
        >
          Your account does not belong to a restaurant yet. Create a fictional
          workspace to test menu management and real shared requests.
        </Empty>
      )}
      {setup && (
        <RestaurantSetup
          onClose={() => setSetup(false)}
          onCreated={(result) => {
            if (result?.id) setRestaurantId(result.id);
            setTab("menu");
          }}
        />
      )}
      {(editing || adding) && (
        <DishEditor
          dish={editing}
          restaurantId={restaurant?.id}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
        />
      )}
    </>
  );
}
