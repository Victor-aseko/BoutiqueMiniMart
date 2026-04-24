import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Share,
    Alert,
    Platform,
    Linking,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown,
    FadeInRight,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import {
    ChevronLeft,
    Bell,
    Share2,
    Mail,
    Shield,
    Info,
    ChevronRight,
    Star,
    Globe,
    Moon,
    Sun,
    Trash2,
    Lock,
    User as UserIcon,
    Smartphone
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const SettingsScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { theme, isDarkMode, toggleTheme } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isClearingCache, setIsClearingCache] = useState(false);
    const [cacheSize, setCacheSize] = useState('Calculating...');

    // Animation values
    const headerOpacity = useSharedValue(0);

    useEffect(() => {
        calculateCacheSize();
        headerOpacity.value = withTiming(1, { duration: 600 });
    }, []);

    const calculateCacheSize = async () => {
        try {
            const cacheDir = FileSystem.cacheDirectory;
            if (!cacheDir) {
                setCacheSize('0 KB');
                return;
            }

            const getDirSize = async (dirUri) => {
                let size = 0;
                const fileList = await FileSystem.readDirectoryAsync(dirUri);

                for (const fileName of fileList) {
                    const fileUri = dirUri + fileName;
                    const fileInfo = await FileSystem.getInfoAsync(fileUri);

                    if (!fileInfo.exists) continue;

                    if (fileInfo.isDirectory) {
                        // Recursively add size of subdirectories (ensure trailing slash)
                        const subDirSize = await getDirSize(fileUri + '/');
                        size += subDirSize;
                    } else {
                        size += fileInfo.size || 0;
                    }
                }
                return size;
            };

            const totalBytes = await getDirSize(cacheDir);
            setCacheSize(formatSize(totalBytes));
        } catch (error) {
            console.error('Error calculating cache size:', error);
            setCacheSize('0 KB');
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 KB';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleClearCache = async () => {
        Alert.alert(
            'Clear Cache',
            `Are you sure you want to clear ${cacheSize} of app cache storage? This will free up space on your device.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Now',
                    style: 'destructive',
                    onPress: async () => {
                        setIsClearingCache(true);
                        try {
                            const cacheDir = FileSystem.cacheDirectory;
                            if (cacheDir) {
                                const files = await FileSystem.readDirectoryAsync(cacheDir);
                                for (const file of files) {
                                    await FileSystem.deleteAsync(cacheDir + file, { idempotent: true });
                                }
                            }
                            // Small delay for UI feel
                            setTimeout(() => {
                                setIsClearingCache(false);
                                setCacheSize('0 KB');
                                Alert.alert('Success', 'App cache has been cleared! ✨');
                            }, 1000);
                        } catch (error) {
                            console.error('Error clearing cache:', error);
                            setIsClearingCache(false);
                            Alert.alert('Error', 'Failed to clear cache fully.');
                        }
                    }
                }
            ]
        );
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: 'Check out MiniBoutique for the best fashion deals in Kenya! Download the app now.',
                url: 'https://miniboutique.co.ke',
                title: 'MiniBoutique'
            });
        } catch (error) {
            Alert.alert(error.message);
        }
    };

    const handleEmailSupport = () => {
        Linking.openURL('mailto:miniboutique043@gmail.com?subject=Support Request&body=Hi Support,');
    };

    const SettingItem = ({
        icon: Icon,
        label,
        value,
        onPress,
        isSwitch,
        switchValue,
        onSwitchChange,
        subLabel,
        color = COLORS.primary,
        delay = 0,
        showChevron = true
    }) => {
        return (
            <Animated.View entering={FadeInRight.delay(delay).springify()}>
                <TouchableOpacity
                    style={styles.settingItem}
                    onPress={onPress}
                    disabled={isSwitch}
                    activeOpacity={0.6}
                >
                    <View style={styles.settingLeft}>
                        <View style={[styles.iconBackground, { backgroundColor: color + '15' }]}>
                            <Icon size={20} color={color} strokeWidth={2.5} />
                        </View>
                        <View style={styles.labelContainer}>
                            <Text style={styles.settingLabel}>{label}</Text>
                            {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
                        </View>
                    </View>

                    <View style={styles.settingRight}>
                        {isSwitch ? (
                            <Switch
                                value={switchValue}
                                onValueChange={onSwitchChange}
                                trackColor={{ false: '#E0E0E0', true: COLORS.accent + '60' }}
                                thumbColor={switchValue ? COLORS.accent : '#f4f3f4'}
                                ios_backgroundColor="#3e3e3e"
                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                            />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {value && <Text style={styles.settingValue}>{value}</Text>}
                                {showChevron && <ChevronRight size={18} color={COLORS.textLight} />}
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={28} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
                <TouchableOpacity
                    style={styles.cleanIconButton}
                    onPress={() => Alert.alert('Device Information', `App: MiniBoutique Shop\nVersion: 1.2.0\nPlatform: ${Platform.OS.toUpperCase()}\nStatus: Stable`)}
                >
                    <Smartphone size={26} color={theme.colors.accent} strokeWidth={2.5} />
                </TouchableOpacity>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <Animated.View
                    entering={FadeInDown.duration(600).springify()}
                    style={styles.profileSummary}
                >
                    <View style={styles.profileIconBg}>
                        <UserIcon size={30} color={COLORS.white} />
                    </View>
                    <View style={styles.profileText}>
                        <Text style={styles.profileName}>{user?.name || 'Guest User'}</Text>
                        <Text style={styles.profileEmail}>{user?.email || 'Login to personalize settings'}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => navigation.navigate('AddressScreen')}
                    >
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                </Animated.View>

                <View style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: 22 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>Preferences</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon={Bell}
                            label="Notifications"
                            subLabel="Alerts on orders & new arrivals"
                            isSwitch
                            switchValue={notificationsEnabled}
                            onSwitchChange={setNotificationsEnabled}
                            color="#FF9800"
                            delay={100}
                        />
                        <SettingItem
                            icon={isDarkMode ? Moon : Sun}
                            label="Dark Mode"
                            subLabel="Easy on the eyes"
                            isSwitch
                            switchValue={isDarkMode}
                            onSwitchChange={toggleTheme}
                            color={isDarkMode ? "#7E57C2" : "#FBC02D"}
                            delay={200}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>System</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon={Trash2}
                            label="Clear Cache"
                            subLabel="Free up space"
                            value={isClearingCache ? '' : cacheSize}
                            onPress={handleClearCache}
                            color={COLORS.error}
                            delay={300}
                            showChevron={!isClearingCache}
                        />
                        {isClearingCache && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="small" color={COLORS.accent} />
                            </View>
                        )}
                        <SettingItem
                            icon={Lock}
                            label="Security & Privacy"
                            onPress={() => Alert.alert('Privacy Policy', 'Your data is secured with AES-256 encryption.')}
                            color="#4CAF50"
                            delay={400}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Social & Help</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon={Share2}
                            label="Share MiniBoutique"
                            onPress={handleShare}
                            color={COLORS.accent}
                            delay={500}
                        />
                        <SettingItem
                            icon={Star}
                            label="Rate Us"
                            subLabel="We appreciate your feedback"
                            onPress={() => Alert.alert('Coming Soon', 'App store links will be available when we go live!')}
                            color="#E91E63"
                            delay={600}
                        />
                        <SettingItem
                            icon={Mail}
                            label="Contact Support"
                            onPress={handleEmailSupport}
                            color="#2196F3"
                            delay={700}
                        />
                        <SettingItem
                            icon={Info}
                            label="About Us"
                            onPress={() => navigation.navigate('AboutUsScreen')}
                            color="#607D8B"
                            delay={800}
                        />
                    </View>
                </View>

                <Animated.View
                    entering={FadeInDown.delay(900)}
                    style={styles.footer}
                >
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>MINI<Text style={{ color: COLORS.accent }}>BOUTIQUE</Text></Text>
                    </View>
                    <Text style={styles.versionText}>Version 1.2.0</Text>
                    <Text style={styles.copyrightText}>© 2026 MiniBoutique Shop. All rights reserved.</Text>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    saveBtn: {
        padding: 5,
    },
    cleanIconButton: {
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    profileSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 20,
        marginBottom: 25,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    profileIconBg: {
        width: 55,
        height: 55,
        borderRadius: 18,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileText: {
        flex: 1,
        marginLeft: 15,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    profileEmail: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    editBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: COLORS.background,
        borderRadius: 10,
    },
    editBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.textLight + '90',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        paddingLeft: 10,
    },
    sectionContent: {
        backgroundColor: COLORS.white,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F8F9FA',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBackground: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    labelContainer: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
    },
    subLabel: {
        fontSize: 11,
        color: COLORS.textLight,
        marginTop: 2,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        fontSize: 13,
        color: COLORS.textLight,
        marginRight: 8,
        fontWeight: '500',
    },
    loadingOverlay: {
        position: 'absolute',
        right: 18,
        top: 18,
    },
    footer: {
        marginTop: 10,
        alignItems: 'center',
        paddingBottom: 60,
    },
    logoContainer: {
        marginBottom: 10,
    },
    logoText: {
        fontSize: 16,
        fontWeight: '900',
        color: COLORS.primary,
        letterSpacing: 2,
    },
    versionText: {
        fontSize: 13,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    copyrightText: {
        fontSize: 11,
        color: COLORS.textLight + '80',
        marginTop: 5,
    }
});

export default SettingsScreen;
