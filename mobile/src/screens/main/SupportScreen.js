import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Keyboard,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, Check, CheckCheck } from 'lucide-react-native';
import { COLORS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const SupportScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        {
            id: '1',
            text: `Welcome ${user?.name || 'back'}! I'm your Boutique Assistant. How can I help you today?`,
            sender: 'bot',
            time: new Date(),
            status: 'read'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef(null);

    useEffect(() => {
        if (!user) {
            navigation.navigate('Auth');
        }
    }, [user, navigation]);

    // Robust Keyboard Handling
    useEffect(() => {
        const keyboardShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        );
        return () => keyboardShowListener.remove();
    }, []);

    const shippingData = {
        'nairobi': 'same day or within 24 hours',
        'eldoret': '1 to 2 business days',
        'moi university': '1 to 2 days',
        'uoe': '1 business day',
        'kakamega': '1 to 2 days',
        'mwamba': '1 to 2 days',
        'homabay': '1 to 2 days',
        'oyugis': '1 to 2 days',
        'kisumu': '1 to 2 days',
        'nakuru': '1 business day',
        'mombasa': '2 to 3 business days',
        'kisii': '1 to 2 days',
        'kericho': '1 to 2 days',
    };

    const courierData = {
        'eldoret': 'North Rift, Guardian, CrossRoad, or Psalms transporters',
        'uoe': 'North Rift, Guardian, CrossRoad, or Psalms transporters',
        'moi university': 'North Rift, Guardian, CrossRoad, or Psalms transporters',
        'mombasa': 'Mombasa Courier or Tahmed Couch',
        'nakuru': 'Likana, CrossRoad, or MoloLine',
        'oyugis': 'Premium, EnaCoach or Easy Coach Logistics',
        'homabay': 'Premium, EnaCoach or Easy Coach Logistics',
        'kisumu': 'Premium, EnaCoach or Easy Coach Logistics',
    };

    const defaultCourier = 'G4S or Easy Coach Logistics';

    const notifyAdmin = async (userQuery) => {
        try {
            // This now triggers an in-app Notification for Admins in the dashboard
            await api.post('/inquiries', {
                name: user?.name || 'Unknown User',
                email: user?.email || 'No email',
                subject: 'URGENT: Chat Support Request',
                message: `User is asking about: "${userQuery}". Please reply immediately from the Inquiry section.`
            });
        } catch (error) {
            console.error('Admin notification failed', error);
        }
    };

    const checkProductAvailability = async (query) => {
        try {
            const { data: products } = await api.get('/products');
            const lowerQuery = query.toLowerCase();
            const inStock = products.filter(p => p.countInStock > 0);

            const stopWords = ['and', 'for', 'the', 'with', 'available', 'have', 'stock', 'please', 'mens', 'womens', 'lady', 'gent', 'can', 'get', 'show', 'buy', 'shoes', 'dresses'];
            const keywords = lowerQuery.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));

            let match = inStock.find(p => {
                const name = p.name.toLowerCase();
                return keywords.some(k => name.includes(k));
            });

            if (match) {
                const colors = match.colors?.map(c => c.name).join(', ') || 'various';
                const sizes = match.sizes?.join(', ') || 'standard';
                const priceText = match.price ? `The price is KSh ${match.price.toLocaleString()}.` : "You can check the current price in the Shop.";
                return `Yes! We have exactly what you're looking for. The ${match.name} is available in ${colors} and sizes [${sizes}]. ${priceText} You can find it in the Shop tab!`;
            }

            const categories = [
                { id: 'men', keys: ['men', 'gent', 'male', 'man', 'trouser', 'khaki', 'shirt'] },
                { id: 'women', keys: ['women', 'lady', 'ladies', 'female', 'dress', 'gown', 'skirt', 'tops'] },
                { id: 'shoe', keys: ['shoe', 'sneaker', 'heel', 'boot', 'loafers'] },
                { id: 'bedding', keys: ['bed', 'sheet', 'duvet', 'pillow', 'blanket'] }
            ];

            const detectedCat = categories.find(c => c.keys.some(k => lowerQuery.includes(k)))?.id;

            if (detectedCat) {
                const related = inStock.filter(p => p.category.toLowerCase().includes(detectedCat)).slice(0, 2);
                if (related.length > 0) {
                    const suggestionNames = related.map(r => r.name).join(' or ');
                    return `I couldn't find a specific ${keywords.length > 0 ? keywords[0] : 'item'} matching that in our ${detectedCat}'s collection right now. Did you mean something like our ${suggestionNames}? I have notified our team to help you find precisely what you need!`;
                }
            }

            notifyAdmin(query);
            return "I'm not entirely sure about that specific item. I've sent a priority alert to our management team to check the store for you. Feel free to browse the Shop for more variety!";
        } catch (error) {
            return "I'm having a hard time checking our inventory right now. Tap the 'Shop' tab to see what's available!";
        }
    };

    const handleSend = async (textOverride) => {
        const textToSend = textOverride || inputText;
        if (!textToSend || textToSend.trim() === '') return;

        const userMessage = {
            id: Date.now().toString(),
            text: textToSend.trim(),
            sender: 'user',
            time: new Date(),
            status: 'sent'
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        setTimeout(async () => {
            setMessages(prev => prev.map(msg => msg.id === userMessage.id ? { ...msg, status: 'read' } : msg));

            const lower = textToSend.toLowerCase();
            let botReply = "";

            const cityMatch = Object.keys(shippingData).find(city => lower.includes(city));

            if (cityMatch) {
                const specificCourier = courierData[cityMatch] || defaultCourier;
                botReply = `Shipping to ${cityMatch.toUpperCase()} takes ${shippingData[cityMatch]} via ${specificCourier}.`;
            }
            else if (lower.includes('available') || lower.includes('have') || lower.includes('stock') || lower.includes('buy') ||
                lower.includes('price') || lower.includes('cost') || lower.includes('how much') ||
                ['shoe', 'bedding', 'dress', 'khaki', 'shirt', 'men', 'women'].some(k => lower.includes(k))) {
                botReply = await checkProductAvailability(textToSend);
            }
            else {
                botReply = `I'm here to help! Ask me about boutique items, delivery, or say 'Talk to team' for personal assistance.`;
                if (lower.includes('admin') || lower.includes('human') || lower.includes('team') || lower.includes('talk')) {
                    notifyAdmin(textToSend);
                    botReply = "Priority alert sent! Our staff have been notified in their dashboard and will contact you via your registered details shortly.";
                }
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: botReply,
                sender: 'bot',
                time: new Date()
            }]);
            setIsTyping(false);
        }, 1200);
    };

    const renderMessage = ({ item }) => (
        <View style={[styles.messageWrapper, item.sender === 'user' ? styles.userWrapper : styles.botWrapper]}>
            <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
                <Text style={[styles.messageText, item.sender === 'user' ? styles.userText : styles.botText]}>{item.text}</Text>
                {item.sender === 'user' && (
                    <View style={styles.statusContainer}>
                        {item.status === 'sent' ? <Check size={12} color="rgba(255,255,255,0.7)" /> : <CheckCheck size={12} color="#fff" />}
                    </View>
                )}
            </View>
            <Text style={styles.timeText}>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
    );

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 0, backgroundColor: '#fff' }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, backgroundColor: '#fff' }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
            >
                <View style={styles.header}>
                    <View style={styles.botIcon}><Bot color={COLORS.white} size={20} /></View>
                    <View>
                        <Text style={styles.headerTitle}>Boutique Assistant</Text>
                        <View style={styles.onlineStatus}><View style={styles.statusDot} /><Text style={styles.statusText}>Live Support</Text></View>
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                <View style={styles.inputBar}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ask about items or delivery..."
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            placeholderTextColor="#999"
                            onFocus={() => {
                                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
                            }}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
                            onPress={() => handleSend()}
                            disabled={!inputText.trim()}
                        >
                            <Send size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
            {/* Removed the extra SafeAreaView at the bottom to prevent fighting with KeyboardAvoidingView */}
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
    botIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0984E3', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerTitle: { fontSize: 16, fontWeight: 'bold' },
    onlineStatus: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ecc71', marginRight: 5 },
    statusText: { fontSize: 11, color: '#666' },
    listContent: { padding: 15, paddingBottom: 20 },
    messageWrapper: { marginBottom: 15, maxWidth: '85%' },
    userWrapper: { alignSelf: 'flex-end' },
    botWrapper: { alignSelf: 'flex-start' },
    messageBubble: { padding: 12, borderRadius: 20, position: 'relative' },
    userBubble: { backgroundColor: '#0984E3', borderBottomRightRadius: 4 },
    botBubble: { backgroundColor: '#F0F2F5', borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 21 },
    userText: { color: '#fff' },
    botText: { color: '#2D3436' },
    statusContainer: { position: 'absolute', bottom: 4, right: 8 },
    timeText: { fontSize: 10, color: '#999', marginTop: 4, marginHorizontal: 5 },
    inputBar: {
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 30 : 15, // Extra space for iOS, standard for Android
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 4 },
    input: { flex: 1, fontSize: 15, color: '#2D3436', paddingVertical: 8, maxHeight: 100 },
    sendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#0984E3', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});

export default SupportScreen;
