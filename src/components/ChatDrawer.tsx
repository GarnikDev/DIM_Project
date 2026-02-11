import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const RASA_URL = "https://upgraded-space-goldfish-pj4p5v4rv4pv264q7-5005.app.github.dev";

export default function ChatDrawer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    try {
      const response = await fetch(`${RASA_URL}/webhooks/rest/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'user', // Can be dynamic, e.g., currentUserId from Supabase
          message: inputText,
        }),
      });

      if (!response.ok) {
        throw new Error('Rasa response error');
      }

      const data: { text?: string }[] = await response.json();
      data.forEach((msg) => {
        if (msg.text) {
          const botMessage: Message = {
            id: Date.now().toString(),
            text: msg.text,
            isUser: false,
          };
          setMessages((prev) => [...prev, botMessage]);
        }
        // TODO: Handle other response types like images if needed (e.g., <Image source={{uri: msg.image}} />)
      });
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Error connecting to Rasa. Please try again.',
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat with Rasa</Text>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your question..."
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  messageContainer: { marginVertical: 5, padding: 10, borderRadius: 10, maxWidth: '80%' },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#dcf8c6' },
  botMessage: { alignSelf: 'flex-start', backgroundColor: '#ececec' },
  messageText: { fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginRight: 10 },
});