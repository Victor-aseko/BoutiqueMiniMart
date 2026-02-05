import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Dimensions,
    Animated,
    StatusBar,
    Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, ChevronRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const CYCLE_DATA = [
    {
        title: 'Curated\nCollections',
        description: 'Exclusive designs and high-quality craftsmanship, hand-picked just for you to elevate your style.',
        image: require('../../../assets/onboarding/collections_1.jpg'),
    },
    {
        title: 'Premium Quality',
        description: 'Discover the touch of elegance and superior craftsmanship in every piece.',
        image: require('../../../assets/onboarding/collections_2.png'),
    },
    {
        title: 'Elegant Style',
        description: 'Elevate your wardrobe with our sophisticated fashion picks for every occasion.',
        image: require('../../../assets/onboarding/collections_3.png'),
    }
];

const OnboardingScreen = ({ navigation }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cycleIndex, setCycleIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Animation valves for content
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const neonColors = [
        '#FFD700', // Gold
        '#FFFFFF', // White
        '#FFC107', // Amber Gold
        '#00D4FF', // Cyan
        '#FF9800', // Deep Orange Gold
        '#FF00E5', // Magenta
        '#FFD700', // Gold
        '#00FF9C', // Spring Green
    ];
    const [neonCycle, setNeonCycle] = useState(0);

    const slidesRef = useRef(null);
    const { completeOnboarding } = useAuth();

    // Reset animations whenever the main slide or the sub-cycle changes
    useEffect(() => {
        animateContent();
    }, [currentIndex, cycleIndex]);

    // Automatic cycling for the second screen
    useEffect(() => {
        let interval;
        if (currentIndex === 1) {
            interval = setInterval(() => {
                setCycleIndex((prev) => (prev + 1) % CYCLE_DATA.length);
            }, 4000); // Change image/text every 4 seconds
        }
        return () => clearInterval(interval);
    }, [currentIndex]);

    // Complex "Sailing" animation for the phone (Float + Zoom + Swing)
    useEffect(() => {
        if (currentIndex === 0) {
            Animated.loop(
                Animated.parallel([
                    // Vertical Float (Sailing)
                    Animated.sequence([
                        Animated.timing(floatAnim, {
                            toValue: -30,
                            duration: 4000,
                            easing: Easing.bezier(0.42, 0, 0.58, 1),
                            useNativeDriver: true,
                        }),
                        Animated.timing(floatAnim, {
                            toValue: 20,
                            duration: 4000,
                            easing: Easing.bezier(0.42, 0, 0.58, 1),
                            useNativeDriver: true,
                        })
                    ]),
                    // Scaling (Zooming)
                    Animated.sequence([
                        Animated.timing(scaleAnim, {
                            toValue: 1.1,
                            duration: 4500,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(scaleAnim, {
                            toValue: 0.9,
                            duration: 4500,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        })
                    ]),
                    // Rotating (Swinging)
                    Animated.sequence([
                        Animated.timing(rotateAnim, {
                            toValue: 1,
                            duration: 5500,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(rotateAnim, {
                            toValue: -1,
                            duration: 5500,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        })
                    ])
                ])
            ).start();

            const neonInterval = setInterval(() => {
                setNeonCycle(prev => (prev + 1) % neonColors.length);
            }, 600); // Slightly faster for more "shimmer"
            return () => clearInterval(neonInterval);
        }
    }, [currentIndex]);

    const animateContent = () => {
        fadeAnim.setValue(0);
        slideUpAnim.setValue(30);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleAction = () => {
        if (currentIndex === 0) {
            slidesRef.current.scrollToIndex({ index: 1 });
        } else {
            completeOnboarding();
        }
    };

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const NeonTitle = ({ text }) => {
        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                {text.split('').map((char, i) => (
                    <Text
                        key={i}
                        style={[
                            styles.title,
                            {
                                color: neonColors[(i + neonCycle) % neonColors.length],
                                textShadowColor: neonColors[(i + neonCycle) % neonColors.length],
                                textShadowRadius: 18,
                                marginBottom: 0,
                                fontSize: 28,
                                textAlign: 'center',
                                fontWeight: '900'
                            }
                        ]}
                    >
                        {char === ' ' ? '\u00A0' : char}
                    </Text>
                ))}
            </View>
        );
    };

    const StaticSlide = () => {
        const rotation = rotateAnim.interpolate({
            inputRange: [-1, 1],
            outputRange: ['-5deg', '5deg']
        });

        return (
            <View style={[styles.container, { width }]}>
                <View style={[styles.imageContainer, { alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#000', paddingTop: 40 }]}>
                    <Animated.Image
                        source={require('../../../assets/onboarding/onboarding_trio_phone.png')}
                        style={[
                            styles.image,
                            {
                                width: width * 1.3, // Increased from 1.15
                                height: height * 0.75, // Increased from 0.65
                                transform: [
                                    { scale: scaleAnim },
                                    { translateY: floatAnim },
                                    { rotate: rotation }
                                ],
                                zIndex: 10
                            }
                        ]}
                        resizeMode="contain"
                    />
                    <View style={[styles.overlay, { backgroundColor: 'transparent' }]} />
                </View>
                <Animated.View style={[styles.content, {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }],
                    bottom: height * 0.12,
                    alignItems: 'center',
                    zIndex: 20
                }]}>
                    <NeonTitle text="Welcome to MiniBoutique’s Collections" />
                    <Text style={[styles.description, {
                        marginTop: 15,
                        textAlign: 'center',
                        fontSize: 16,
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: '500',
                    }]}>
                        Experience luxury at your fingertips. Discover the heartbeat of fashion in our curated halls.
                    </Text>
                </Animated.View>
            </View>
        );
    };

    const CycleSlide = () => {
        const item = CYCLE_DATA[cycleIndex];
        return (
            <View style={[styles.container, { width }]}>
                <View style={styles.imageContainer}>
                    <Animated.Image
                        key={cycleIndex}
                        source={item.image}
                        style={[styles.image, { opacity: fadeAnim }]}
                        resizeMode="cover"
                    />
                    <View style={styles.overlay} />
                </View>
                <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </Animated.View>
            </View>
        );
    };

    const DATA = [{ id: '1' }, { id: '2' }];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <FlatList
                data={DATA}
                renderItem={({ index }) => index === 0 ? <StaticSlide /> : <CycleSlide />}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                bounces={false}
                keyExtractor={(item) => item.id}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                })}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
                ref={slidesRef}
                scrollEnabled={currentIndex === 0} // Restrict scroll on second page if desired, or keep for UX
            />

            <View style={[styles.footer, currentIndex === 0 && { justifyContent: 'flex-end' }]}>
                {currentIndex !== 0 && (
                    <View style={styles.paginator}>
                        <View style={[styles.dot, { width: currentIndex === 0 ? 20 : 10, opacity: currentIndex === 0 ? 1 : 0.4 }]} />
                        <View style={[styles.dot, { width: currentIndex === 1 ? 20 : 10, opacity: currentIndex === 1 ? 1 : 0.4 }]} />
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        currentIndex === 0 && {
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            paddingHorizontal: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                        }
                    ]}
                    onPress={handleAction}
                    activeOpacity={0.8}
                >
                    {currentIndex === 0 ? (
                        <ChevronRight size={32} color={COLORS.white} />
                    ) : (
                        <>
                            <Text style={styles.actionText}>Get Started</Text>
                            <ArrowRight size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.black,
    },
    container: {
        flex: 1,
    },
    imageContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    image: {
        width: width,
        height: height,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    content: {
        width: width,
        paddingHorizontal: 40,
        position: 'absolute',
        bottom: height * 0.22,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'left',
        lineHeight: 44,
        marginBottom: 15,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    description: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'left',
        lineHeight: 26,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        height: 100,
        position: 'absolute',
        bottom: 30,
        width: '100%',
    },
    paginator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.accent,
        marginHorizontal: 4,
    },
    actionButton: {
        flexDirection: 'row',
        paddingHorizontal: 25,
        paddingVertical: 14,
        borderRadius: 30,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    actionText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OnboardingScreen;
