import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    ImageBackground,
    TouchableOpacity,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Users,
    Globe2,
    Smile,
    Award,
    History,
    ShieldCheck,
    HeartHandshake,
    Sparkles
} from 'lucide-react-native';
import { COLORS, SIZES } from '../../theme/theme';

const { width } = Dimensions.get('window');

const AboutUsScreen = ({ navigation }) => {
    const StatItem = ({ icon: Icon, value, label }) => (
        <View style={styles.statBox}>
            <View style={styles.iconCircle}>
                <Icon size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Section 1: Header & Intro */}
                <View style={styles.headerSection}>
                    <View style={styles.overlay}>
                        <Text style={styles.headerTitle}>About MiniBoutique Shop</Text>
                        <Text style={styles.introText}>
                            We're passionate about bringing you the best shopping experience with quality Products,
                            exceptional service, and unbeatable prices. Discover why thousands trust us for their
                            shopping needs.
                        </Text>
                    </View>
                </View>

                {/* Section 2: Stats Row */}
                <View style={styles.statsRow}>
                    <StatItem icon={Users} value="1K+" label="Happy Customers" />
                    <StatItem icon={Globe2} value="20+" label="Counties Served" />
                    <StatItem icon={Smile} value="99%" label="Customer Satisfaction" />
                </View>

                {/* Section 3: Our Story & Values */}
                <View style={styles.storySection}>
                    <View style={styles.sectionHeader}>
                        <History size={24} color={COLORS.primary} style={styles.sectionIcon} />
                        <Text style={styles.sectionTitle}>Our Story</Text>
                    </View>

                    <View style={styles.storyContent}>
                        {/* Column Layout */}
                        <View style={styles.gridRow}>
                            {/* Left Column: Text */}
                            <View style={styles.leftCol}>
                                <Text style={styles.storyPara}>
                                    Founded in 2024, <Text style={styles.bold}>MiniBoutique</Text> began with a simple mission:
                                    to make Quality Products accessible to everyone, everywhere. What started as a small
                                    online store has grown into a trusted market place serving customers across the country.
                                </Text>

                                <Text style={styles.storyPara}>
                                    We believe that shopping should be more than a transaction - it should be an experience
                                    that delights and inspires. That's why we carefully curate our product selection,
                                    partner with reliable suppliers, and invest in cutting-edge technology to ensure
                                    every interaction with the platform is seamless.
                                </Text>

                                <Text style={styles.storyPara}>
                                    Today, we're proud to serve over 1000 happy customers countrywide, offering
                                    everything from the latest fashion trends to innovative gadgets, all backed by
                                    our commitment to quality, affordability, and exceptional customer service.
                                </Text>
                            </View>

                            {/* Right Column: Values */}
                            <View style={styles.rightCol}>
                                <View style={styles.valueCard}>
                                    <View style={styles.valueIconContainer}>
                                        <ShieldCheck size={32} color={COLORS.accent} />
                                    </View>
                                    <Text style={styles.valueTitle}>Quality First</Text>
                                    <Text style={styles.valueDesc}>
                                        Every Product is carefully selected to meet our high standards.
                                    </Text>
                                </View>

                                <View style={[styles.valueCard, { marginTop: 15 }]}>
                                    <View style={styles.valueIconContainer}>
                                        <HeartHandshake size={32} color={COLORS.accent} />
                                    </View>
                                    <Text style={styles.valueTitle}>Customer Centric</Text>
                                    <Text style={styles.valueDesc}>
                                        Your satisfaction is our ultimate priority.
                                    </Text>
                                </View>

                                <View style={[styles.valueCard, { marginTop: 15 }]}>
                                    <View style={styles.valueIconContainer}>
                                        <Sparkles size={32} color={COLORS.accent} />
                                    </View>
                                    <Text style={styles.valueTitle}>Innovation</Text>
                                    <Text style={styles.valueDesc}>
                                        Always evolving to bring you the best shopping tech.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* CTA Section */}
                <View style={styles.ctaSection}>
                    <Text style={styles.ctaTitle}>Ready to Start Shopping?</Text>
                    <Text style={styles.ctaSubtitle}>
                        Join thousands of satisfied customers and discover why miniBoutique shop is
                        the preferred choice for online shopping.
                    </Text>
                    <View style={styles.ctaButtons}>
                        <TouchableOpacity
                            style={[styles.btn, styles.shopBtn]}
                            onPress={() => navigation.navigate('ShopTab')}
                        >
                            <Text style={styles.shopBtnText}>Shop Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btn, styles.contactBtn]}
                            onPress={() => navigation.navigate('Contact')}
                        >
                            <Text style={styles.contactBtnText}>Contact Us</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer Quote */}
                <View style={styles.footerQuote}>
                    <Text style={styles.quoteText}>
                        "Elevating your lifestyle, one click at a time."
                    </Text>
                    <View style={styles.underline} />
                </View>

                {/* Footer Content */}
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
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerSection: {
        padding: 25,
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 15,
    },
    introText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 24,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 25,
    },
    statBox: {
        width: (width - 60) / 3,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 15,
        minHeight: 120,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconCircle: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 2,
    },
    storySection: {
        padding: 20,
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionIcon: {
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    leftCol: {
        flex: 1.2,
        paddingRight: 15,
    },
    rightCol: {
        flex: 0.8,
    },
    storyPara: {
        fontSize: 14,
        color: COLORS.primary,
        lineHeight: 22,
        marginBottom: 15,
        textAlign: 'justify',
    },
    bold: {
        fontWeight: 'bold',
        color: COLORS.accent,
    },
    valueCard: {
        backgroundColor: COLORS.white,
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    valueIconContainer: {
        marginBottom: 10,
    },
    valueTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 5,
        textAlign: 'center',
    },
    valueDesc: {
        fontSize: 11,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 16,
    },
    footerQuote: {
        padding: 40,
        alignItems: 'center',
    },
    quoteText: {
        fontSize: 18,
        fontStyle: 'italic',
        color: COLORS.primary,
        textAlign: 'center',
        fontWeight: '500',
    },
    underline: {
        width: 50,
        height: 3,
        backgroundColor: COLORS.accent,
        marginTop: 10,
        borderRadius: 2,
    },
    ctaSection: {
        backgroundColor: COLORS.white,
        padding: 30,
        margin: 20,
        borderRadius: 25,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    ctaTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
        textAlign: 'center',
    },
    ctaSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 25,
    },
    ctaButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
    },
    shopBtn: {
        backgroundColor: COLORS.primary,
    },
    shopBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    contactBtn: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    contactBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    footerBottom: {
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingTop: 20,
        paddingBottom: 30,
        alignItems: 'center',
        marginTop: 10,
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

export default AboutUsScreen;
