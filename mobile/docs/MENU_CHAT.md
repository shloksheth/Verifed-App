# Menu chat and quick video script — V30

Menu chat is a prepared four-turn conversation, not a live AI service. Every nonempty message advances to the next reply, regardless of wording. After turn four it repeats the closing reply. Restart conversation returns to the welcome message and first reply. The panel identifies itself as a scripted demo.

## Record this exchange

1. “What does Camarones al Ajillo mean?” → Garlic shrimp, followed by the ingredients printed on the Sayola menu.
2. “What should I ask about my milk allergy?” → Ask staff about milk, butter, cream, the sauce and shared equipment. No safety conclusion is inferred from an incomplete description.
3. “Can you help me ask in Spanish?” → A Spanish question for restaurant staff, with its English meaning.
4. “How can I remember this for next time?” → A reminder about Journal notes and taste ratings informing suggestions.

The suggested message button can send each exact prompt without typing; any other input produces the same sequence. Close and reopen to resume. Restart before another take. Nothing is sent to a provider or stored in the database.

## Related code

- `src/chat-demo.js` stores the welcome, replies, suggested prompts and a pure message append function. The user-message count determines the reply index. It trims text, caps it at 600 characters and returns a new array. Empty messages leave the conversation untouched.
- `components/MenuChat.js` renders the smile tab and the right-aligned overlay panel. The transcript scrolls to the newest reply. The composer sends on its button or keyboard submit. A restart action clears the conversation. The existing Typography wrappers provide Clash Grotesk. Forest green and warm paper match the app; salmon identifies the smile and send controls. The composer has a disabled empty state, a keyboard-avoiding container and accessible labels.
- `App.js` owns open/closed state and shares one `openChat` callback with screens. The chat is an overlay; opening it does not change the current route or discard the current menu. It is keyed by the scan owner's guest/account namespace so changing identity resets its local transcript. Welcome, authentication and initial guest setup do not show the tab. Owner changes close the panel. Closing by button, backdrop or platform back preserves the conversation while this instance stays mounted.
- `components/Home.js` adds the header chat bubble. `components/MenuScanner.js` adds a chat bubble entry before capture and after a menu is loaded. Its information copy describes the intended English/Spanish reading experience and the prepared-menu scope; it adds no fabricated translation engine.
- `components/FloatingNavigation.js` adds Menu chat to the plus menu. It closes quick actions and opens the same overlay without routing to a separate screen.

## Verification

`tests/chat-demo.test.js` exercises input-independent reply order, exhaustion, blank input, immutability and input length. All 199 regression tests passed. Expo exported iOS, Android and web bundles. `research/qa/v30/check-chat.mjs` verified all entry points, typed/suggested messages, Enter, transcript retention, restart and closing back to Scan in headless Chrome. Screenshots cover 390x844, 320x640 and desktop layouts. Native iPhone keyboard and touch behavior require a real device check; web preview alone does not establish those results.
