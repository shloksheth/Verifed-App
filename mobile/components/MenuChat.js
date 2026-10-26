import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, View, useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, TextInput } from "./Typography";
import { Icon } from "./UI";
import { forest } from "../src/warm-forest";
import { addDemoMessage, chatWelcome, suggestedDemoMessages } from "../src/chat-demo";

const salmon = "#F2A18E";
const initialMessages = () => [{ id: "welcome", role: "assistant", content: chatWelcome }];

export function ChatTab({ onPress }) {
  const { height } = useWindowDimensions();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Open menu chat"
      onPress={onPress} style={[look.peek, { top: Math.max(150, height * 0.43) }]}>
      <Icon name="happy-outline" size={29} color={forest.ink} />
    </Pressable>
  );
}

export default function MenuChat({ visible, onClose }) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const transcript = useRef(null);
  const insets = useSafeAreaInsets();
  const turn = messages.filter((message) => message.role === "user").length;
  const suggestion = suggestedDemoMessages[turn];

  function send(value = draft) {
    if (!String(value).trim()) return;
    setMessages((current) => addDemoMessage(current, value));
    setDraft("");
  }
  function restart() {
    setMessages(initialMessages());
    setDraft("");
  }
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={look.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}
          accessibilityRole="button" accessibilityLabel="Close menu chat backdrop" />
        <View style={[look.position, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 24 }]}
          pointerEvents="box-none">
          <View style={look.panel} accessibilityViewIsModal>
            <View style={look.header}>
              <View style={look.avatar}><Icon name="happy-outline" size={29} color={forest.ink} /></View>
              <View style={look.heading}>
                <Text accessibilityRole="header" style={look.title}>Menu chat</Text>
                <Text style={look.subtitle}>Scripted demo · English / Español</Text>
              </View>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu chat"
                style={look.iconButton}><Icon name="close" size={23} color={forest.lightText} /></Pressable>
            </View>
            <View style={look.note}>
              <Icon name="chatbubbles-outline" size={17} color={forest.green} />
              <Text style={look.noteText}>A prepared conversation about the Sayola menu.</Text>
            </View>
            <ScrollView ref={transcript} style={look.transcript} contentContainerStyle={look.messages}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => transcript.current?.scrollToEnd({ animated: false })}>
              {messages.map((message) => (
                <View key={message.id} style={[look.bubble, message.role === "user" && look.userBubble]}>
                  <Text style={look.author}>{message.role === "user" ? "You" : "Verifed"}</Text>
                  <Text selectable style={look.message}>{message.content}</Text>
                </View>
              ))}
            </ScrollView>
            {suggestion && (
              <Pressable accessibilityRole="button" accessibilityLabel={`Send example: ${suggestion}`}
                onPress={() => send(suggestion)} style={look.suggestion}>
                <Text style={look.suggestionText}>{suggestion}</Text>
                <Icon name="arrow-up-outline" size={18} color={forest.green} />
              </Pressable>
            )}
            <View style={look.composer}>
              <TextInput accessibilityLabel="Message menu chat" placeholder="Write a message…"
                placeholderTextColor={forest.muted} value={draft} onChangeText={setDraft}
                maxLength={600} style={look.input} returnKeyType="send" onSubmitEditing={() => send()} />
              <Pressable accessibilityRole="button" accessibilityLabel="Send chat message"
                accessibilityState={{ disabled: !draft.trim() }} disabled={!draft.trim()}
                onPress={() => send()} style={[look.send, !draft.trim() && look.disabled]}>
                <Icon name="arrow-up" size={22} color={forest.ink} />
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Restart chat demo" onPress={restart}
              style={look.restart}><Text style={look.restartText}>Restart conversation</Text></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const look = StyleSheet.create({
  peek: { position: "absolute", right: 0, zIndex: 6, width: 48, height: 60,
    borderTopLeftRadius: 22, borderBottomLeftRadius: 22, backgroundColor: salmon,
    alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(16,47,37,0.22)" },
  position: { flex: 1, justifyContent: "flex-end", alignItems: "flex-end", paddingHorizontal: 12 },
  panel: { width: "100%", maxWidth: 420, height: 620, maxHeight: "100%", flexShrink: 1,
    borderRadius: 24, overflow: "hidden", backgroundColor: forest.card },
  header: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10, backgroundColor: forest.green },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: salmon, alignItems: "center", justifyContent: "center" },
  heading: { flex: 1 }, title: { fontSize: 21, lineHeight: 27, fontWeight: "700", color: forest.lightText },
  subtitle: { fontSize: 12, lineHeight: 18, color: forest.sage },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  note: { flexDirection: "row", gap: 8, paddingHorizontal: 15, paddingVertical: 11, backgroundColor: forest.sage },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, color: forest.ink },
  transcript: { flex: 1, minHeight: 70 }, messages: { padding: 14, gap: 12 },
  bubble: { maxWidth: "94%", alignSelf: "flex-start", backgroundColor: forest.surface, borderRadius: 15, padding: 13, gap: 4 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#F8D4C9" },
  author: { color: forest.green, fontSize: 11, lineHeight: 16, fontWeight: "600" },
  message: { color: forest.ink, fontSize: 15, lineHeight: 22 },
  suggestion: { flexDirection: "row", alignItems: "center", marginHorizontal: 14, marginBottom: 8,
    minHeight: 44, padding: 10, gap: 8, borderRadius: 12, backgroundColor: forest.sage },
  suggestionText: { flex: 1, color: forest.green, fontSize: 13, lineHeight: 19, fontWeight: "500" },
  composer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 8 },
  input: { flex: 1, minWidth: 0, height: 48, borderRadius: 14, backgroundColor: forest.background,
    color: forest.ink, paddingHorizontal: 13, fontSize: 15 },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: salmon, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.45 }, restart: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  restartText: { color: forest.muted, fontSize: 12, lineHeight: 18, textDecorationLine: "underline" },
});
