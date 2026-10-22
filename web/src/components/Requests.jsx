import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChefHat,
  Clock3,
  FileText,
  History,
  Info,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldAlert,
} from "lucide-react";
import { api } from "../api";
import { ALLERGENS, RESTRICTIONS } from "../data";
import {
  Button,
  Dialog,
  Empty,
  ErrorMessage,
  Field,
  formatDate,
  PageTitle,
  Status,
  ToggleChips,
  useTask,
} from "./UI";

export function RequestComposer({ dish, state, onClose, navigate, existing }) {
  const task = useTask();
  const source = existing?.snapshot || state.profile;
  const [allergies, setAllergies] = useState(source.allergies || []);
  const [restrictions, setRestrictions] = useState(source.restrictions || []);
  const [modifications, setModifications] = useState(
    existing?.snapshot.modifications || [],
  );
  const [question, setQuestion] = useState(existing?.snapshot.question || "");
  async function submit(event) {
    event.preventDefault();
    const input = {
      dishId: dish.id,
      allergies,
      restrictions,
      modifications,
      question,
    };
    await task.run(
      () =>
        existing
          ? api.actOnRequest(existing.id, "resubmit", input, existing.revision)
          : api.createRequest(input),
      (result) => {
        onClose();
        navigate(`request/${existing?.id || result.id}`);
      },
    );
  }
  return (
    <Dialog
      title={existing ? "Update your request" : "A note to the kitchen"}
      onClose={onClose}
    >
      <p className="dialog-intro">
        {dish.name} · Choose what to share for this meal.
      </p>
      <form onSubmit={submit}>
        <fieldset>
          <legend>Allergies to share</legend>
          <ToggleChips
            options={ALLERGENS}
            value={allergies}
            onChange={setAllergies}
            label="Allergies to share"
          />
        </fieldset>
        <fieldset>
          <legend>Dietary requirements</legend>
          <ToggleChips
            options={RESTRICTIONS}
            value={restrictions}
            onChange={setRestrictions}
            label="Dietary requirements to share"
          />
        </fieldset>
        {dish.modifications.length > 0 && (
          <fieldset>
            <legend>Requested modifications</legend>
            <ToggleChips
              options={dish.modifications}
              value={modifications}
              onChange={setModifications}
              label="Requested modifications"
            />
          </fieldset>
        )}
        <Field
          label="What would you like to ask?"
          hint="Be specific about ingredients and preparation. Staff may need more information."
        >
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={1500}
            rows={4}
            placeholder="For example: could you confirm the dressing ingredients and use separate utensils?"
          />
        </Field>
        <div className="inline-notice">
          <Info size={18} />
          <p>
            Submitting sends a request, not a confirmed order. Wait for the
            kitchen's response and discuss your needs with staff.
          </p>
        </div>
        <ErrorMessage error={task.error} />
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Keep browsing
          </Button>
          <Button type="submit" busy={task.busy}>
            {existing ? "Send updated request" : "Send to kitchen"}
            <Send size={16} />
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function RequestSnapshot({ request, staff = false }) {
  const snapshot = request.snapshot;
  return (
    <section className="panel snapshot">
      <div className="panel-heading">
        <h2>The meal snapshot</h2>
        <span className="badge">Version {request.revision}</span>
      </div>
      <p className="fine-print">
        This is the information attached to this request.
      </p>
      <div className="snapshot-section requirements">
        <span className="eyebrow">Shared requirements</span>
        <h3>
          {snapshot.allergies.length
            ? snapshot.allergies.join(" · ")
            : "No allergies shared"}
        </h3>
        <p>
          {snapshot.restrictions.length
            ? snapshot.restrictions.join(" · ")
            : "No dietary restrictions shared"}
        </p>
      </div>
      <div className="snapshot-section">
        <h3>Requested modifications</h3>
        <p>
          {snapshot.modifications.length
            ? snapshot.modifications.join(", ")
            : "No modifications requested"}
        </p>
      </div>
      <div className="snapshot-section">
        <h3>{staff ? "Diner question" : "Your question"}</h3>
        <p>{snapshot.question || "No additional question"}</p>
      </div>
      <details>
        <summary>
          Ingredients & preparation <span>View details</span>
        </summary>
        <div className="snapshot-section">
          <h3>Reported ingredients</h3>
          <p>{snapshot.ingredients.join(", ")}</p>
          <h3>Declared allergens</h3>
          <p>
            {snapshot.allergens.length
              ? snapshot.allergens.join(", ")
              : "None declared in this sample listing"}
          </p>
          <h3>Preparation</h3>
          <p>{snapshot.preparation || "Not provided"}</p>
        </div>
      </details>
    </section>
  );
}

export function RequestTimeline({ request, staff = false }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Every step, together</h2>
        <History size={19} />
      </div>
      <ol className="timeline">
        {[...request.events].reverse().map((event) => (
          <li key={event.id}>
            <span
              className={`timeline-icon ${event.type === "change" || event.type === "menu_changed" ? "amber" : ""}`}
            >
              {event.actor === "staff" ? (
                <ChefHat size={14} />
              ) : (
                <MessageCircle size={14} />
              )}
            </span>
            <div>
              <div className="timeline-meta">
                <strong>
                  {event.actor === "staff"
                    ? "Kitchen"
                    : staff
                      ? "Diner"
                      : "You"}{" "}
                  · Version {event.revision}
                </strong>
                <time>{formatDate(event.at)}</time>
              </div>
              <p>{event.message}</p>
              {event.response &&
                (event.revision < request.revision ||
                  event.response.id !== request.response?.id) && (
                  <span className="outdated-label">
                    Earlier response · no longer current
                  </span>
                )}
              {event.snapshot && event.revision < request.revision && (
                <details>
                  <summary>View earlier meal snapshot</summary>
                  <p>Ingredients: {event.snapshot.ingredients.join(", ")}</p>
                  <p>Preparation: {event.snapshot.preparation}</p>
                </details>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ChangeSummary({ request }) {
  const previous = [...request.events]
    .reverse()
    .find(
      (event) => event.revision < request.revision && event.snapshot,
    )?.snapshot;
  if (!previous) return null;
  const fields = {
    ingredients: "Ingredients",
    allergens: "Declared allergens",
    preparation: "Preparation",
    allergies: "Shared allergies",
    restrictions: "Dietary requirements",
    modifications: "Requested changes",
    question: "Question",
    dishName: "Dish name",
  };
  const changed = Object.entries(fields).filter(
    ([key]) =>
      JSON.stringify(previous[key]) !== JSON.stringify(request.snapshot[key]),
  );
  const readable = (value) =>
    Array.isArray(value)
      ? value.join(", ") || "None listed"
      : value || "Not provided";
  return (
    <section className="panel change-comparison">
      <h2>What changed?</h2>
      {changed.length ? (
        changed.map(([key, label]) => (
          <div className="changed-field" key={key}>
            <h3>{label}</h3>
            <p>
              <strong>Before:</strong> {readable(previous[key])}
            </p>
            <p>
              <strong>Now:</strong> {readable(request.snapshot[key])}
            </p>
          </div>
        ))
      ) : (
        <p>
          The kitchen requested a new review. Read the change note and ask staff
          to clarify.
        </p>
      )}
    </section>
  );
}

export function RequestDetail({ id, state, navigate, onEdit, onMeal }) {
  const task = useTask();
  const request = state.requests.find((item) => item.id === id);
  if (!request)
    return (
      <Empty
        icon={FileText}
        title="This request isn't here"
        action={<Button onClick={() => navigate("home")}>Back home</Button>}
      >
        Sign in with the account that created the request, or open a sample
        request in demo mode.
      </Empty>
    );
  const dish = state.dishes.find((item) => item.id === request.dishId);
  const closed = ["completed", "cancelled", "declined"].includes(
    request.status,
  );
  const changed = request.status === "review_required";
  const own = request.userId === state.user?.id;
  const canAcknowledge =
    own &&
    request.status === "responded" &&
    request.response?.revision === request.revision;
  const currentResponse = request.response?.revision === request.revision;
  const lastChange = [...request.events]
    .reverse()
    .find((event) => ["change", "menu_changed"].includes(event.type));
  return (
    <>
      <PageTitle
        back={() => navigate("home")}
        eyebrow="Your kitchen conversation"
        title={request.dishName}
        description={`Started ${formatDate(request.createdAt)} · Request ${request.id.slice(0, 8)}`}
        action={<Status status={request.status} />}
      />
      <div className="detail-grid request-detail">
        <div className="stack">
          {changed && (
            <section className="change-banner">
              <RefreshCw size={25} />
              <div>
                <span className="eyebrow">A fresh look is needed</span>
                <h2>Something changed.</h2>
                <p>
                  {lastChange?.message ||
                    "The reported meal information has changed."}
                </p>
                <p>
                  The earlier kitchen response no longer applies. Version{" "}
                  {request.revision} needs a new review.
                </p>
              </div>
            </section>
          )}
          {changed && <ChangeSummary request={request} />}
          <section
            className={`panel response-panel ${changed ? "needs-review" : ""}`}
          >
            <div className="panel-heading">
              <h2>
                <ChefHat size={21} />
                From the kitchen
              </h2>
              <span className="badge">Version {request.revision}</span>
            </div>
            {currentResponse ? (
              <>
                <span className="response-decision">
                  {request.response.decision === "accommodate"
                    ? "Kitchen response recorded"
                    : request.response.decision === "clarify"
                      ? "The kitchen has a question"
                      : "The kitchen cannot accommodate this request"}
                </span>
                <blockquote>{request.response.message}</blockquote>
                <p className="fine-print">
                  {formatDate(request.response.createdAt)} · Applies only to
                  this meal version.
                </p>
                {canAcknowledge && (
                  <>
                    <p className="acknowledge-note">
                      Confirm that you have read this response. This records
                      your acknowledgment, not a guarantee about the food.
                    </p>
                    <Button
                      busy={task.busy}
                      onClick={() =>
                        task.run(() =>
                          api.actOnRequest(
                            id,
                            "acknowledge",
                            { responseId: request.response.id },
                            request.revision,
                          ),
                        )
                      }
                    >
                      <CheckCheck size={18} />
                      I've read this response
                    </Button>
                  </>
                )}
                {request.status === "acknowledged" && (
                  <div className="inline-success">
                    <CheckCheck size={19} />
                    You acknowledged the current response.
                  </div>
                )}
              </>
            ) : (
              <div className="response-wait">
                <Clock3 size={28} />
                <h3>
                  {changed
                    ? "Waiting for a new kitchen review"
                    : "Your message is at the kitchen"}
                </h3>
                <p>
                  {changed
                    ? "A new response is required before you can acknowledge this version."
                    : "Staff can respond, ask a question, or explain if they cannot accommodate your request."}
                </p>
                {state.mode === "demo" && (
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`workspace?request=${id}`)}
                  >
                    Try the kitchen view <ArrowRight size={16} />
                  </Button>
                )}
              </div>
            )}
            <ErrorMessage error={task.error} />
          </section>
          <RequestTimeline request={request} staff={!own} />
        </div>
        <div className="stack">
          <RequestSnapshot request={request} staff={!own} />
          {own && (
            <section className="panel">
              <h3>Your next step</h3>
              <div className="button-stack">
                {!closed && dish && (
                  <Button
                    variant="secondary"
                    onClick={() => onEdit(dish, request)}
                  >
                    <MessageCircle size={17} />
                    {request.status === "clarification"
                      ? "Answer the kitchen"
                      : "Update your requirements"}
                  </Button>
                )}
                {request.status === "acknowledged" && (
                  <Button
                    busy={task.busy}
                    onClick={() =>
                      task.run(() =>
                        api.actOnRequest(id, "complete", {}, request.revision),
                      )
                    }
                  >
                    <Check size={18} />
                    Finish this request
                  </Button>
                )}
                {request.status === "completed" && (
                  <Button onClick={() => onMeal(dish)}>
                    Remember this meal <ArrowRight size={17} />
                  </Button>
                )}
                {!closed && (
                  <Button
                    variant="quiet"
                    busy={task.busy}
                    onClick={() =>
                      task.run(() =>
                        api.actOnRequest(id, "cancel", {}, request.revision),
                      )
                    }
                  >
                    Cancel request
                  </Button>
                )}
              </div>
              <p className="fine-print">
                Verifed records communication. Always discuss any uncertainty
                directly with restaurant staff.
              </p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
