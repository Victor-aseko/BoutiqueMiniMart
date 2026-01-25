import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Linking,
    Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Mail, Clock, Send, MessageSquare, User, Tag, Facebook, Instagram } from 'lucide-react-native';
import { COLORS, SIZES } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import MyInput from '../../components/MyInput';
import MyButton from '../../components/MyButton';

const whatsappIcon = require('../../../assets/icons/whatsapp.png');
const facebookIcon = require('../../../assets/icons/facebook.png');


const ContactScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!user) {
            Alert.alert('Authentication Required', 'Please Login to your Account to send us a message.');
            return;
        }

        if (!subject || !message) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await api.post('/inquiries', {
                name,
                email,
                subject,
                message
            });

            Alert.alert('Message Sent', "Your message has been sent successfully. We'll get back to you soon.");
            setSubject('');
            setMessage('');
        } catch (err) {
            console.error('Error sending message:', err.response?.data || err.message || err);
            Alert.alert('Error', 'Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const InfoItem = ({ icon: Icon, title, content, onPress }) => {
        const Wrapper = onPress ? TouchableOpacity : View;
        return (
            <Wrapper style={[styles.infoBox, onPress && { padding: 12 }]} onPress={onPress}>
                <View style={styles.infoIconContainer}>
                    <Icon size={24} color={COLORS.accent} />
                </View>
                <Text style={styles.infoTitle}>{title}</Text>
                {Array.isArray(content) ? (
                    content.map((line, i) => <Text key={i} style={styles.infoContent}>{line}</Text>)
                ) : (
                    <Text style={styles.infoContent}>{content}</Text>
                )}
            </Wrapper>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header Section */}
                    <View style={styles.headerRowTop}>
                        <TouchableOpacity onPress={() => navigation.goBack && navigation.goBack()} style={styles.backBtn}>
                            <ChevronLeft color={COLORS.primary} size={24} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Contact Us</Text>
                    </View>
                    <View style={styles.headerSubtitleRow}>
                        <Text style={styles.subtitle}>
                            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </Text>
                    </View>

                    {/* Contact Info Row */}
                    <View style={styles.infoRow}>
                        <InfoItem
                            icon={Phone}
                            title="Call Us"
                            content={["+254759108018", "+254723281004"]}
                            onPress={() => Linking.openURL('tel:+254759108018')}
                        />
                        <InfoItem
                            icon={Mail}
                            title="Email Us"
                            content={"miniboutique043@gmail.com"}
                            onPress={() => Linking.openURL('mailto:miniboutique043@gmail.com')}
                        />
                        <InfoItem
                            icon={Clock}
                            title="Business Hours"
                            content={[
                                'Mon - Fri: 7am - 8pm',
                                'Sat - Sun: 9am - 5pm'
                            ]}
                        />
                    </View>

                    {/* Message Form */}
                    <View style={styles.formSection}>
                        <View style={styles.formCard}>
                            <View style={styles.formHeader}>
                                <MessageSquare size={24} color={COLORS.primary} />
                                <Text style={styles.formTitle}>Send us a Message</Text>
                            </View>

                            {!user && (
                                <View style={styles.authNotice}>
                                    <Text style={styles.noticeText}>To send us a message, Need to Login to your Account</Text>
                                </View>
                            )}

                            <MyInput
                                label="Name"
                                placeholder="Your full name"
                                value={name}
                                onChangeText={setName}
                                icon={User}
                                editable={!user}
                            />
                            <MyInput
                                label="Email"
                                placeholder="miniboutique043@gmail.com"
                                value={email}
                                onChangeText={setEmail}
                                icon={Mail}
                                keyboardType="email-address"
                                editable={!user}
                            />
                            <MyInput
                                label="Subject"
                                placeholder="What is this regarding?"
                                value={subject}
                                onChangeText={setSubject}
                                icon={Tag}
                            />
                            <MyInput
                                label="Message"
                                placeholder="Write your message here..."
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                numberOfLines={4}
                                style={styles.textArea}
                            />

                            <MyButton
                                title="Send Message"
                                onPress={handleSendMessage}
                                loading={loading}
                                icon={Send}
                                style={styles.submitBtn}
                            />
                        </View>
                    </View>

                    <View style={styles.mainFooter}>
                        <Text style={styles.footerBrand}>MiniBoutique Shop</Text>
                        <Text style={styles.footerSlogan}>Your ultimate destination for quality & style.</Text>

                        <View style={styles.footerLinks}>
                            <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://chat.whatsapp.com/IVGjYlhsLZb4h0oeXbJ98P')}>
                                <Image source={whatsappIcon} style={styles.socialIconImage} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.facebook.com/yourpage')}>
                                <Image source={facebookIcon} style={styles.socialIconImage} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.instagram.com/yourpage')}>
                                <Instagram size={24} color={COLORS.accent} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.tiktok.com/@yourpage')}>
                                <Send size={24} color={'#000'} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footerBottom}>
                            <Text style={styles.footerCopyright}>© 2025 MiniBoutique. All rights reserved.</Text>
                            <View style={styles.footerPolicies}>
                                <TouchableOpacity onPress={() => Linking.openURL('https://www.blueberiboutique.com/pages/privacy-policy?')}>
                                    <Text style={styles.policyText}>Privacy Policy</Text>
                                </TouchableOpacity>
                                <Text style={styles.dot}>•</Text>
                                <TouchableOpacity onPress={() => Linking.openURL('https://www.blueberiboutique.com/pages/privacy-policy?')}>
                                    <Text style={styles.policyText}>Terms of Use</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerRowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: COLORS.white,
    },
    headerSubtitleRow: {
        paddingHorizontal: 20,
        marginBottom: 10,
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.white,
    },
    backBtn: { padding: 8, marginRight: 8 },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        marginTop: 20,
    },
    infoBox: {
        flex: 1,
        backgroundColor: COLORS.white,
        marginHorizontal: 5,
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    infoIconContainer: {
        marginBottom: 10,
    },
    infoTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 5,
        textAlign: 'center',
    },
    infoContent: {
        fontSize: 10,
        color: COLORS.textLight,
        textAlign: 'center',
    },
    formSection: {
        padding: 20,
        marginTop: 10,
    },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginLeft: 10,
    },
    authNotice: {
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(231, 76, 60, 0.3)',
    },
    noticeText: {
        color: COLORS.error,
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    submitBtn: {
        marginTop: 10,
    },
    mainFooter: {
        backgroundColor: 'rgba(229, 231, 235, 0.2)',
        paddingVertical: 25,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 30, // Added margin top for separation
    },
    footerBrand: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 2,
    },
    footerSlogan: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 15,
        textAlign: 'center',
    },
    footerLinks: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    socialIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    socialIconImage: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
    footerBottom: {
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingTop: 20,
        alignItems: 'center',
    },
    footerCopyright: {
        color: COLORS.textLight,
        fontSize: 12,
        marginBottom: 10,
    },
    footerPolicies: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    policyText: {
        color: COLORS.textLight,
        fontSize: 12,
    },
    dot: {
        color: COLORS.textLight,
        marginHorizontal: 10,
    }
});

export default ContactScreen;
