import React, { useState } from "react";
import { Text, View } from "react-native";
import { api } from "../src/api";
import { ALLERGENS, RESTRICTIONS } from "../src/data";
import { s } from "../styles";
import {
  Button,
  Chips,
  closedRequest,
  date,
  Empty,
  ErrorText,
  Field,
  Notice,
  Section,
  Sheet,
  Status,
  Tags,
  Title,
  useTask,
} from "./UI";

export function RequestComposer({ dish, existing, state, onClose, navigate }) {
  // Hold the version that was read when the composer opened.
  const [expectedRevision] = useState(existing?.revision);
  const source = existing?.snapshot || state.profile;
  const [allergies, setAllergies] = useState(source.allergies || []);
  const [restrictions, setRestrictions] = useState(source.restrictions || []);
  const [modifications, setModifications] = useState(
    existing?.snapshot.modifications || [],
  );
  const [question, setQuestion] = useState(existing?.snapshot.question || "");
  const task = useTask();
  async function submit() {
    const input = {
      dishId: dish.id,
      allergies,
      restrictions,
      modifications,
      question,
    };
    task.run(
      () =>
        existing
          ? api.actOnRequest(existing.id, "resubmit", input, expectedRevision)
          : api.createRequest(input),
      (result) => {
        onClose();
        navigate(`request/${existing?.id || result.id}`);
      },
    );
  }
  return (
    <Sheet
      title={existing ? "Update your request" : "A note to the kitchen"}
      onClose={onClose}
    >
      <Text style={s.body}>
        {dish.name} · Choose what to share for this meal.
      </Text>
      <Chips
        label="Allergies to share"
        options={ALLERGENS}
        value={allergies}
        onChange={setAllergies}
      />
      <Chips
        label="Dietary requirements"
        options={RESTRICTIONS}
        value={restrictions}
        onChange={setRestrictions}
      />
      {dish.modifications.length > 0 && (
        <Chips
          label="Requested modifications"
          options={dish.modifications}
          value={modifications}
          onChange={setModifications}
        />
      )}
      <Field
        label="What would you like to ask?"
        multiline
        maxLength={1500}
        value={question}
        onChangeText={setQuestion}
        placeholder="Can you confirm the dressing ingredients and use separate utensils?"
      />
      <Notice>
        This sends a request, not a confirmed order. Wait for the kitchen
        response and discuss your needs with staff.
      </Notice>
      <ErrorText error={task.error} />
      <Button busy={task.busy} icon="send-outline" onPress={submit}>
        {existing ? "Send updated requirements" : "Send request"}
      </Button>
      <Button variant="quiet" onPress={onClose}>
        Keep browsing
      </Button>
    </Sheet>
  );
}

export function RequestSnapshot({ request }) {
  const snapshot = request.snapshot;
  return (
    <View style={s.card}>
      <Text style={s.h3}>This meal · version {request.revision}</Text>
      <Text style={s.label}>Shared allergies</Text>
      <Tags values={snapshot.allergies} />
      <Text style={s.label}>Dietary requirements</Text>
      <Tags values={snapshot.restrictions} />
      <Text style={s.label}>Requested modifications</Text>
      <Tags values={snapshot.modifications} />
      <Text style={s.label}>Diner's question</Text>
      <Text style={s.body}>
        {snapshot.question || "No additional question."}
      </Text>
      <View style={s.divider} />
      <Text style={s.label}>Reported ingredients</Text>
      <Tags values={snapshot.ingredients} />
      <Text style={s.label}>Declared allergens</Text>
      <Tags
        values={snapshot.allergens}
        fallback="None declared. This does not establish absence."
      />
      <Text style={s.label}>Preparation & cross-contact</Text>
      <Text style={s.body}>
        {snapshot.preparation || "Preparation details not supplied."}
      </Text>
      <Text style={s.small}>
        Menu revision {snapshot.dishRevision} · A snapshot of the information
        shared for this meal.
      </Text>
    </View>
  );
}

export function RequestTimeline({ request }) {
  return (
    <Section title="The conversation">
      <View style={s.card}>
        <View style={s.timeline}>
          {request.events.map((event) => (
            <View key={event.id} style={s.stack}>
              <Text style={s.label}>
                {event.type.replace(/_/g, " ")} · v{event.revision}
              </Text>
              <Text style={s.body}>{event.message}</Text>
              <Text style={s.small}>
                {event.actor} · {date(event.at)}
              </Text>
              {event.snapshot && (
                <Text style={s.small}>
                  Recorded ingredients:{" "}
                  {event.snapshot.ingredients?.join(", ") || "Not supplied"}
                  {event.snapshot.preparation
                    ? ` · Preparation: ${event.snapshot.preparation}`
                    : ""}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </Section>
  );
}

export function RequestDetail({ id, state, navigate, openSheet }) {
  const task = useTask();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const request = state.requests.find((item) => item.id === id);
  if (!request)
    return (
      <Empty
        title="Conversation not found"
        action="View history"
        onPress={() => navigate("history?tab=requests")}
      >
        This request is unavailable to your account.
      </Empty>
    );
  const own = request.userId === state.user?.id;
  const staff = state.memberships.some(
    (item) => item.restaurantId === request.restaurantId,
  );
  const dish = state.dishes.find((item) => item.id === request.dishId);
  const responseCurrent = request.response?.revision === request.revision;
  const canAcknowledge =
    own && request.status === "responded" && responseCurrent;
  const act = (action, payload = {}) =>
    task.run(() => api.actOnRequest(id, action, payload, request.revision));
  return (
    <>
      <Title eyebrow="Your kitchen conversation" title={request.dishName}>
        Meal version {request.revision} · {date(request.updatedAt)}
      </Title>
      <Status status={request.status} />
      {request.status === "review_required" && (
        <Notice conflict>
          The reported meal changed. Earlier responses and acknowledgments no
          longer apply. Wait for a new kitchen review.
        </Notice>
      )}
      <View style={s.card}>
        <Text style={s.h2}>From the kitchen</Text>
        {request.response ? (
          <>
            <Text style={s.eyebrow}>
              {request.response.decision === "accommodate"
                ? "Kitchen response recorded"
                : request.response.decision === "clarify"
                  ? "The kitchen has a question"
                  : "Unable to accommodate"}
            </Text>
            <Text style={s.body}>{request.response.message}</Text>
            <Text style={s.small}>
              {date(request.response.createdAt)} · Response for meal version{" "}
              {request.response.revision}
              {!responseCurrent ? " · Outdated response" : ""}
            </Text>
            {canAcknowledge && (
              <>
                <Text style={s.small}>
                  Acknowledge that you read this response. This does not
                  guarantee the food is suitable.
                </Text>
                <Button
                  icon="checkmark-done-outline"
                  busy={task.busy}
                  onPress={() =>
                    act("acknowledge", { responseId: request.response.id })
                  }
                >
                  I've read this response
                </Button>
              </>
            )}
            {request.status === "acknowledged" && (
              <Notice>You acknowledged the current response.</Notice>
            )}
          </>
        ) : (
          <>
            <Text style={s.body}>
              {request.status === "review_required"
                ? "Waiting for a fresh review of this meal version."
                : "Your message is at the kitchen. Staff can respond, ask a question, or explain a limitation."}
            </Text>
            {(staff || state.mode === "demo") && (
              <Button
                variant="secondary"
                onPress={() => navigate(`kitchen-request/${id}`)}
              >
                Try the kitchen view
              </Button>
            )}
          </>
        )}
        <ErrorText error={task.error} />
      </View>
      <RequestSnapshot request={request} />
      {own && (
        <View style={s.card}>
          <Text style={s.h3}>Your next step</Text>
          {!closedRequest(request) && dish && (
            <Button
              variant="secondary"
              icon="chatbubble-outline"
              onPress={() =>
                openSheet({ type: "request", dish, existing: request })
              }
            >
              {request.status === "clarification"
                ? "Answer the kitchen"
                : "Update your requirements"}
            </Button>
          )}
          {request.status === "acknowledged" && (
            <Button busy={task.busy} onPress={() => act("complete")}>
              Finish this request
            </Button>
          )}
          {request.status === "completed" && dish && (
            <Button
              onPress={() =>
                openSheet({
                  type: "meal",
                  dish: { ...dish, name: request.snapshot.dishName },
                })
              }
            >
              Remember this meal
            </Button>
          )}
          {!closedRequest(request) && (
            <Button variant="quiet" onPress={() => setConfirmCancel(true)}>
              Cancel request
            </Button>
          )}
          <Text style={s.small}>
            Always discuss uncertainty directly with restaurant staff.
          </Text>
        </View>
      )}
      {staff && (
        <Button
          variant="secondary"
          onPress={() => navigate(`kitchen-request/${id}`)}
        >
          Open kitchen tools
        </Button>
      )}
      <RequestTimeline request={request} />
      {confirmCancel && (
        <Sheet
          title="Cancel this request?"
          onClose={() => setConfirmCancel(false)}
        >
          <Text style={s.body}>
            This closes your conversation for this meal. You can create a new
            request from the menu.
          </Text>
          <ErrorText error={task.error} />
          <Button
            variant="danger"
            busy={task.busy}
            onPress={() =>
              task.run(
                () => api.actOnRequest(id, "cancel", {}, request.revision),
                () => setConfirmCancel(false),
              )
            }
          >
            Cancel request
          </Button>
          <Button variant="secondary" onPress={() => setConfirmCancel(false)}>
            Keep request open
          </Button>
        </Sheet>
      )}
    </>
  );
}
