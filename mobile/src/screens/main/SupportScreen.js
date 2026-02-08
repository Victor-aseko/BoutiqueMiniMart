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
    StatusBar,
    ScrollView
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
            //text: `Hey there! 👋 I'm your Dedicated Boutique Assistant. How's your day going?`,
            sender: 'bot',
            time: new Date(),
            status: 'read'
        },
        {
            id: '2',
            text: `Are you looking to place a new order today, or do you need assistance with something else? Just let me know what you're looking for! 😊`,
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
            // navigation.navigate('Auth'); // Don't force redirect if we want them to see the bot first
        } else {
            // Update the welcome message if they just logged in
            setMessages(prev => {
                if (prev.length > 0 && prev[0].id === '1') {
                    const newMessages = [...prev];
                    newMessages[0] = {
                        ...newMessages[0],
                        text: `Welcome ${user.name}! I'm your Boutique Assistant. How can I help you today?`
                    };
                    return newMessages;
                }
                return prev;
            });
        }
    }, [user]);

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
        'nairobi': '2 to 3 hours',
        'kitengela': '2 to 3 hours',
        'utawala': '2 to 3 hours',
        'runda': '2 to 3 hours',
        'ruaka': '2 to 3 hours',
        'karen': '2 to 3 hours',
        'ngong': '2 to 3 hours',
        'kasarani': '2 to 3 hours',
        'kayole': '2 to 3 hours',
        'kangemi': '2 to 3 hours',
        'kinoo': '2 to 3 hours',
        'githurai': '2 to 3 hours',
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
        'kitengela': 'Rembo',
        'kayole': 'Kani or Forward Travellers',
        'kangemi': 'Enabled or Super Metro',
        'kinoo': 'Enabled or Super Metro',
        'githurai': 'Nico',
        'utawala': 'Local Rapid Courier',
        'runda': 'Local Rapid Courier',
        'ruaka': 'Local Rapid Courier',
        'karen': 'Local Rapid Courier',
        'ngong': 'Local Rapid Courier',
        'kasarani': 'Local Rapid Courier',
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



    const notifyAdmin = async (userQuery, type = 'General') => {
        try {
            await api.post('/inquiries', {
                name: user?.name || 'Guest User',
                email: user?.email || 'guest@boutiqueminimart.com',
                subject: `URGENT: ${type} Request`,
                message: `The customer is asking: "${userQuery}".\nUser Details: ${user?.name} (${user?.email || 'N/A'}).\nPlease jump in to assist them as soon as possible!`
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

            // Special case for general "shoes" query
            if (lowerQuery.includes('shoes') && !lowerQuery.includes('men') && !lowerQuery.includes('women') && !lowerQuery.includes('lady') && !lowerQuery.includes('gent')) {
                const menShoes = inStock.filter(p => {
                    const name = p.name.toLowerCase();
                    const cat = p.category.toLowerCase();
                    return (cat.includes('shoe') || name.includes('shoe')) && (name.includes('men') || name.includes('male') || cat.includes('men'));
                }).slice(0, 4);

                const womenShoes = inStock.filter(p => {
                    const name = p.name.toLowerCase();
                    const cat = p.category.toLowerCase();
                    return (cat.includes('shoe') || name.includes('shoe')) && (name.includes('women') || name.includes('lady') || name.includes('heel') || cat.includes('women'));
                }).slice(0, 4);

                const formatItem = (p) => {
                    const colors = p.colors?.map(c => c.name).join(', ') || 'Various shades';
                    return `• ${p.name}\n  - Price: KSh ${p.price.toLocaleString()}\n  - Colors: ${colors}`;
                };

                let responseText = "I've scanned our vault! 🛍️ Here are our top shoe picks for you:\n\n";
                if (menShoes.length > 0) {
                    responseText += `👟 **For Men:**\n${menShoes.map(formatItem).join('\n\n')}\n\n`;
                }
                if (womenShoes.length > 0) {
                    responseText += `👠 **For Women:**\n${womenShoes.map(formatItem).join('\n\n')}\n\n`;
                }

                if (menShoes.length === 0 && womenShoes.length === 0) {
                    notifyAdmin(query, 'General Shoe Inquiry');
                    return "Our shoe collection is flying off the shelves! 🏃‍♂️ I don't see a match in live stock right now, but I've notified our team to check the arrivals for you. Is there another style you're interested in?";
                }

                return {
                    text: responseText + "Tap the button below to see our full Ultra-Modern Shoe Collection!",
                    action: {
                        type: 'NAVIGATE_SHOP',
                        label: 'View All Shoes',
                        params: { category: 'Shoes' }
                    }
                };
            }

            // Targeted categories requested by user
            const boutiqueCategories = [
                { id: 'shoes_men', label: "Men's Shoes", keys: ['men shoe', 'gent shoe', 'male shoe', 'mens sneakers', 'men footwear', 'shoes for men', 'mens shoes', "men's shoes"] },
                { id: 'shoes_women', label: "Women's Shoes", keys: ['women shoe', 'lady shoe', 'female shoe', 'heels', 'flats', 'sandals', 'ladies sneakers', 'shoes for women', 'womens shoes', "women's shoes"] },
                { id: 'women_dress', label: "Women's Dresses", keys: ['dress', 'gown', 'skirt', 'maxi', 'mini dress', 'women attire', 'ladies clothes', "women's clothes", "women's dresses", "womens dresses"] },
                { id: 'menwares', label: "Men's Clothes", keys: ['khaki', 'shirt', 'men cloth', 'tshirt', 'trouser', 'suit', 'menswear', 'clothes for men', 'mens clothes', "men's clothes", "men'swares"] },
                { id: 'kids', label: "Kids' Collection", keys: ['child', 'kids', 'baby', 'toddler', 'pajama', 'kids shoe', 'children clothes', "kids' clothes"] },
                { id: 'bags', label: "Boutique Bags", keys: ['bag', 'handbag', 'purse', 'clutch', 'suitcase', 'backpack'] }
            ];

            const detected = boutiqueCategories.find(c => c.keys.some(k => lowerQuery.includes(k)));

            if (detected) {
                const categoryProducts = inStock.filter(p => {
                    const name = p.name.toLowerCase();
                    const cat = p.category.toLowerCase();
                    const desc = (p.description || '').toLowerCase();

                    if (detected.id === 'shoes_men') {
                        return (cat.includes('shoe') || name.includes('shoe') || desc.includes('shoe')) &&
                            (name.includes('men') || name.includes('male') || cat.includes('men'));
                    }
                    if (detected.id === 'shoes_women') {
                        return (cat.includes('shoe') || name.includes('shoe') || desc.includes('shoe')) &&
                            (name.includes('women') || name.includes('lady') || name.includes('heel') || cat.includes('women'));
                    }
                    if (detected.id === 'women_dress') {
                        return (name.includes('dress') || name.includes('gown') || cat.includes('women') || cat.includes('dress')) &&
                            (name.includes('dress') || name.includes('gown') || name.includes('skirt'));
                    }
                    if (detected.id === 'kids') {
                        return cat.includes('child') || cat.includes('kid') || name.includes('kids') || name.includes('baby');
                    }
                    if (detected.id === 'bags') {
                        return cat.includes('bag') || name.includes('bag') || name.includes('handbag') || name.includes('purse');
                    }
                    if (detected.id === 'menwares') {
                        // Check specifically for MEN or Clothing For MEN categories
                        return (cat === 'men' || cat.includes('clothing for men') || name.includes('men wear') || name.includes('gent')) && !name.includes('shoe');
                    }
                    return false;
                });

                if (categoryProducts.length > 0) {
                    const detailedItems = categoryProducts.slice(0, 4).map(p => {
                        const colors = p.colors?.map(c => c.name).join(', ') || 'Various shades';
                        const sizes = p.sizes?.join(', ') || 'Standard';
                        return `• ${p.name}\n  - Price: KSh ${p.price.toLocaleString()}\n  - Colors: ${colors}\n  - Sizes: ${sizes}`;
                    }).join('\n\n');

                    let actionParams = {};
                    if (detected.id === 'shoes_men') actionParams = { category: 'Shoes', search: 'Men' };
                    else if (detected.id === 'shoes_women') actionParams = { category: 'Shoes', search: 'Women' };
                    else if (detected.id === 'women_dress') actionParams = { category: 'Women' };
                    else if (detected.id === 'menwares') actionParams = { category: 'Men' };
                    else if (detected.id === 'kids') actionParams = { category: 'Children' };
                    else if (detected.id === 'bags') actionParams = { category: 'Bags' };

                    return {
                        text: `I've checked our live boutique inventory for ${detected.label}!\n\nHere are some stunning options available right now:\n\n${detailedItems}\n\nTap the button below to view the full collection in our shop.`,
                        action: {
                            type: 'NAVIGATE_SHOP',
                            label: `View All ${detected.label}`,
                            params: actionParams
                        }
                    };
                } else {
                    notifyAdmin(query, 'Availability Inquiry');
                    return `Currently, our premium ${detected.label} collection is moving very fast! 🏃‍♂️💨 I don't see a direct match in the live stock, but I've just notified our floor manager to check the backroom for you. \n\nThey'll reach out once they find it! Is there anything else you'd like to see?`;
                }
            }

            // Check if user is asking how to order
            if (lowerQuery.includes('how to order') || lowerQuery.includes('place an order') || lowerQuery.includes('how do i buy') || lowerQuery.includes('making an order')) {
                return `I'd be absolutely delighted to walk you through our seamless ordering process! 🛍️✨ It's designed to be quick and easy:\n\n` +
                    `1️⃣ **Explore Our Collection**: Tap the **Shop** tab at the bottom. You can browse all items or use the **Category** filters at the top to find exactly what you need (like Men's shoes or Women's dresses).\n\n` +
                    `2️⃣ **The Perfect Fit**: Click on any product to see its details. Here, you can select your preferred **Color** and **Size**. We want to make sure it's perfect for you! 🎨📏\n\n` +
                    `3️⃣ **Add to Your Bag**: Once you've customized your item, tap **'Add to Cart'**. You can continue exploring or head straight to your bag by clicking the **Cart** icon.\n\n` +
                    `4️⃣ **Secure Checkout**: In your Cart, review your items and tap **'Proceed'**. If you're not signed in, you'll be prompted to quickly join us or continue with Google. 🔐\n\n` +
                    `5️⃣ **Where Should We Deliver?**: Select your **Shipping Address** (or add a new one). We'll show you the delivery expectations for your location right then and there. 🚚\n\n` +
                    `6️⃣ **Final Confirmation**: Review your order summary one last time and click **'Place Order'**. \n\n` +
                    `🎉 **Success!**: You'll see a 'Thank You' confirmation, and your order will appear in your **My Orders** section! Our team will receive a notification immediately to begin preparing your boutique items. \n\nIs there a specific category I can help you find to get started?`;
            }

            // Check for general delivery/shipping info
            if (lowerQuery.includes('delivery info') || lowerQuery.includes('shipping') || lowerQuery.includes('how long') || lowerQuery.includes('delivery time')) {
                return `We pride ourselves on lightning-fast delivery! 🚚💨 Here is our current schedule:\n\n` +
                    `📍 **Nairobi & Environs**: Just **2 to 3 hours**! This includes Kitengela, Utawala, Runda, Ruaka, Karen, Ngong, Kasarani, Kayole, and Githurai.\n\n` +
                    `📍 **Eldoret, Nakuru & UoE**: Within **1 business day**.\n\n` +
                    `📍 **Mombasa**: **2 to 3 business days**.\n\n` +
                    `📍 **Other Major Towns**: Usually **1 to 2 business days** (Kisumu, Kakamega, Kisii, etc.).\n\n` +
                    `We use reliable couriers like Rembo, Nico, Super Metro, and Easy Coach to ensure your luxury items arrive safely. You can specify your location in the chat for more details!`;
            }

            // Fallback for general searches
            const stopWords = ['and', 'for', 'the', 'with', 'available', 'have', 'stock', 'please', 'mens', 'womens', 'lady', 'gent', 'can', 'get', 'show', 'buy', 'shoes', 'dresses'];
            const searchTerms = lowerQuery.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));

            const match = inStock.find(p => searchTerms.some(k => p.name.toLowerCase().includes(k)));

            if (match) {
                const colors = match.colors?.map(c => c.name).join(', ') || 'various gorgeous shades';
                const sizes = match.sizes?.join(', ') || 'Standard';
                return {
                    text: `That's an excellent choice! The *${match.name}* is in stock.\n\n• Price: KSh ${match.price.toLocaleString()}\n• Colors: ${colors}\n• Sizes: ${sizes}\n\nWould you like to see it in the Shop?`,
                    action: {
                        type: 'NAVIGATE_SHOP',
                        label: 'View in Shop',
                        params: { search: match.name }
                    }
                };
            }

            notifyAdmin(query, 'General Assistance');
            return "I'm not finding a direct match for that in our current system, but don't worry! I've just pinged our team 📱. They are the experts and will get back to you personally with the best options we have. Is there anything else you'd like to ask about?";
        } catch (error) {
            return "Ah, I'm having a little trouble accessing our inventory records at the moment. Would you mind checking the 'Shop' tab for a second while I refresh our system? 🔄";
        }
    };

    const handleAction = (action) => {
        if (action.type === 'NAVIGATE_SHOP') {
            navigation.navigate('ShopTab', {
                screen: 'ShopScreen',
                params: action.params
            });
        }
    };

    const suggestions = [
        { id: '1', text: 'How to order?', icon: '•' },
        { id: '2', text: 'Latest Shoes', icon: '•' },
        { id: '3', text: "Men's clothes", icon: '•' },
        { id: '4', text: "Women's dresses", icon: '•' },
        { id: '5', text: "Bags", icon: '•' },
        { id: '6', text: "Kids' Collection", icon: '•' },
        { id: '7', text: 'Delivery info', icon: '•' },
        { id: '8', text: 'Talk to team', icon: '•' },
    ];

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
            let messageAction = null;

            const cityMatch = Object.keys(shippingData).find(city => lower.includes(city));

            if (cityMatch) {
                const specificCourier = courierData[cityMatch] || defaultCourier;
                botReply = `Great news! Shipping to ${cityMatch.toUpperCase()} is handled professionally and usually takes ${shippingData[cityMatch]} via ${specificCourier}. 🚚`;
            }
            else if (lower.includes('available') || lower.includes('have') || lower.includes('stock') || lower.includes('buy') ||
                lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('order') ||
                lower.includes('place') || lower.includes('how to') || lower.includes('delivery') || lower.includes('shipping') ||
                ['shoe', 'bag', 'dress', 'khaki', 'shirt', 'men', 'women', 'kid', 'child'].some(k => lower.includes(k))) {
                const response = await checkProductAvailability(textToSend);
                if (typeof response === 'object') {
                    botReply = response.text;
                    messageAction = response.action;
                } else {
                    botReply = response;
                }
            }
            else {
                if (lower.includes('admin') || lower.includes('human') || lower.includes('team') || lower.includes('talk') || lower.includes('special assistance')) {
                    notifyAdmin(textToSend, 'Personal Support');
                    botReply = "Understood! I've just sent a direct link to our team. A manager will reach out to you personally via your contact details or jump into this chat if they're available. Is there anything I can help you with in the meantime? 🤝";
                } else {
                    botReply = `I'm here to ensure you have the best experience! 💎 You can ask me about our current stock (like shoes, dresses, or bags), delivery timelines, or just say 'Connect me to the team' to talk to a human! What's on your mind?`;
                }
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: botReply,
                sender: 'bot',
                time: new Date(),
                action: messageAction
            }]);
            setIsTyping(false);
        }, 1200);
    };

    const renderMessage = ({ item }) => (
        <View style={[styles.messageWrapper, item.sender === 'user' ? styles.userWrapper : styles.botWrapper]}>
            <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
                <Text style={[styles.messageText, item.sender === 'user' ? styles.userText : styles.botText]}>{item.text}</Text>
                {item.action && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleAction(item.action)}
                    >
                        <Text style={styles.actionButtonText}>{item.action.label}</Text>
                    </TouchableOpacity>
                )}
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
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.suggestionsContainer}
                    >
                        {suggestions.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.suggestionChip}
                                onPress={() => handleSend(item.text)}
                            >
                                <Text style={styles.suggestionIcon}>{item.icon}</Text>
                                <Text style={styles.suggestionText}>{item.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

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
    header: { paddingHorizontal: 15, paddingVertical: 2, marginTop: 35, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
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
        paddingHorizontal: 0,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 55 : 45, // Increased padding to ensure visibility above tab bar
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    suggestionsContainer: {
        paddingHorizontal: 15,
        paddingBottom: 12,
        flexDirection: 'row',
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E1E4E8'
    },
    suggestionIcon: {
        marginRight: 6,
        fontSize: 14,
    },
    suggestionText: {
        fontSize: 13,
        color: '#2D3436',
        fontWeight: '500',
    },
    actionButton: {
        marginTop: 10,
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 1
    },
    actionButtonText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 13
    },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 25, marginHorizontal: 10, paddingHorizontal: 15, paddingVertical: 4 },
    input: { flex: 1, fontSize: 15, color: '#2D3436', paddingVertical: 8, maxHeight: 100 },
    sendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#0984E3', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});

export default SupportScreen;
