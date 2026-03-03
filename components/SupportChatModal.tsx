import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Linking,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { X, Send, Phone, MessageCircle, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface SupportChatModalProps {
    visible: boolean;
    onClose: () => void;
}

interface Message {
    id: string;
    text: string;
    sender: 'bot' | 'user';
    type: 'text' | 'options';
    options?: { label: string; value: string }[];
}

const INITIAL_OPTIONS = [
    { label: "Where is my order?", value: "order_status" },
    { label: "Issue with items", value: "item_issue" },
    { label: "Refund/Cancellation", value: "refund" },
    { label: "Payment Issue", value: "payment" },
    { label: "Contact Support", value: "escalate" },
];

export default function SupportChatModal({ visible, onClose }: SupportChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (visible) {
            // Reset chat when opened
            setMessages([
                {
                    id: '1',
                    text: "Hi! I'm Meat Up, your support assistant. How can I help you today?",
                    sender: 'bot',
                    type: 'options',
                    options: INITIAL_OPTIONS,
                },
            ]);
        }
    }, [visible]);

    const handleOptionSelect = (option: { label: string; value: string }) => {
        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            text: option.label,
            sender: 'user',
            type: 'text',
        };

        setMessages((prev) => [...prev, userMsg]);

        // Simulate bot response
        setTimeout(() => {
            let botResponse: Message;

            switch (option.value) {
                case 'order_status':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "You can track your live order status directly on the 'My Orders' card. Just tap the order to see details.",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: "That helped, thanks!", value: "resolved" },
                            { label: "Still need help", value: "escalate" }
                        ]
                    };
                    break;
                case 'item_issue':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "I'm sorry to hear that. For quality issues, please take a photo and contact our support team directly.",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: "Call Support", value: "call_action" },
                            { label: "Cancel", value: "resolved" }
                        ]
                    };
                    break;
                case 'refund':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "Refunds for cancelled orders are processed automatically within 24-48 hours to your original payment method.",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: "Okay, got it", value: "resolved" },
                            { label: "Payment not received", value: "escalate" }
                        ]
                    };
                    break;
                case 'payment':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "If a payment failed but money was deducted, it will be auto-refunded by your bank within 3-5 business days.",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: "Okay, thanks", value: "resolved" },
                            { label: "It's been longer", value: "escalate" }
                        ]
                    };
                    break;
                case 'escalate':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "I understand. Would you like to speak with a support agent directly?",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: "Yes, Call Support", value: "call_action" },
                            { label: "No, I'm good", value: "resolved" }
                        ]
                    };
                    break;
                case 'call_action':
                    Linking.openURL('tel:+918281626692');
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "Calling support...",
                        sender: 'bot',
                        type: 'text'
                    };
                    break;
                case 'resolved':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "Glad I could help! Have a great day.",
                        sender: 'bot',
                        type: 'text',
                    };
                    break;
                default:
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "I didn't quite catch that. Please select an option.",
                        sender: 'bot',
                        type: 'options',
                        options: INITIAL_OPTIONS
                    };
            }
            setMessages((prev) => [...prev, botResponse]);
        }, 600);
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <ChevronLeft size={28} color={Colors.charcoal} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Support Chat</Text>
                        <View style={styles.onlineStatus}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.onlineText}>Online</Text>
                        </View>
                    </View>
                    <View style={{ width: 28 }} />
                </View>

                {/* Chat Area */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.chatContainer}
                    contentContainerStyle={styles.chatContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg) => (
                        <View key={msg.id} style={[
                            styles.messageWrapper,
                            msg.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper
                        ]}>
                            {msg.sender === 'bot' && (
                                <View style={styles.botAvatar}>
                                    <MessageCircle size={16} color={Colors.white} />
                                </View>
                            )}

                            <View>
                                <View style={[
                                    styles.messageBubble,
                                    msg.sender === 'user' ? styles.userBubble : styles.botBubble
                                ]}>
                                    <Text style={[
                                        styles.messageText,
                                        msg.sender === 'user' ? styles.userText : styles.botText
                                    ]}>
                                        {msg.text}
                                    </Text>
                                </View>

                                {/* Options */}
                                {msg.type === 'options' && msg.options && (
                                    <View style={styles.optionsContainer}>
                                        {msg.options.map((option, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.optionButton}
                                                onPress={() => handleOptionSelect(option)}
                                                disabled={messages[messages.length - 1].id !== msg.id} // Disable old options
                                            >
                                                <Text style={styles.optionText}>{option.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.deepTeal,
        borderBottomWidth: 1,
        borderBottomColor: Colors.deepTeal,
    },
    closeBtn: {
        padding: 4,
        color: Colors.cream,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.cream
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        marginRight: 4,
    },
    onlineText: {
        fontSize: 12,
        color: '#dededeff',
    },
    chatContainer: {
        flex: 1,
    },
    chatContent: {
        padding: 16,
        gap: 16,
        paddingBottom: 40,
    },
    messageWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        maxWidth: '85%',
    },
    userMessageWrapper: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    botMessageWrapper: {
        alignSelf: 'flex-start',
    },
    botAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.deepTeal,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderTopLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: Colors.deepTeal,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 4,
    },
    botBubble: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#eee',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: Colors.white,
    },
    botText: {
        color: Colors.charcoal,
    },
    optionsContainer: {
        marginTop: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        backgroundColor: Colors.white,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.tealBlue,
    },
    optionText: {
        color: Colors.tealBlue,
        fontSize: 14,
        fontWeight: '500',
    },
});
