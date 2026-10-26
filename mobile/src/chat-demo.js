// Prepared conversation for the CAC walkthrough. Input never goes to a model.
export const chatWelcome = "Hi! Let's read a menu together. You can try the Sayola example in English or Spanish.";

export const chatScript = Object.freeze([
  "Let's use Camarones al Ajillo from the Sayola menu. In English, that means garlic shrimp. The printed description lists shrimp sautéed with olive oil, garlic, and a touch of hot sauce.",
  "For a milk allergy, the written description is only a starting point. Ask whether the dish or hot sauce contains milk, butter, or cream, and how the kitchen handles shared equipment. The description alone does not establish that it is milk-free.",
  "You can show staff this question:\n\nTengo alergia a la leche. ¿Este plato o la salsa llevan leche, mantequilla o crema? ¿Pueden evitar el contacto cruzado?\n\nIn English: I have a milk allergy. Does this dish or its sauce contain milk, butter, or cream? Can you avoid cross-contact?",
  "Keep that question handy when you speak with staff. After your meal, use Journal to record your taste rating and notes for next time. Your meal ratings also help inform restaurant suggestions.",
]);

export const suggestedDemoMessages = Object.freeze([
  "What does Camarones al Ajillo mean?",
  "What should I ask about my milk allergy?",
  "Can you help me ask in Spanish?",
  "How can I remember this for next time?",
]);

export function addDemoMessage(messages, value) {
  const content = String(value || "").trim().slice(0, 600);
  if (!content) return messages;
  const turn = messages.filter((message) => message.role === "user").length;
  const reply = chatScript[Math.min(turn, chatScript.length - 1)];
  return [
    ...messages,
    { id: `user-${turn}`, role: "user", content },
    { id: `reply-${turn}`, role: "assistant", content: reply },
  ];
}
