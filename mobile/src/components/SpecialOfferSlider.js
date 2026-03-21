import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
    Animated,
    TouchableOpacity,
    Platform,
    Easing
} from 'react-native';
import { Timer, Tag, Zap, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../theme/theme';

const { width: windowWidth } = Dimensions.get('window');

const SpecialOfferSlider = ({ offers, onOfferPress }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [isGoingForward, setIsGoingForward] = useState(true);
    const [tick, setTick] = useState(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const wiggleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous pulse and glow loops
        Animated.parallel([
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
                ])
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true })
                ])
            )
        ]).start();

        // Periodic wiggle for the badge (now smoother)
        const wiggleInterval = setInterval(() => {
            Animated.sequence([
                Animated.timing(wiggleAnim, { toValue: 1, duration: 120, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(wiggleAnim, { toValue: -1, duration: 200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(wiggleAnim, { toValue: 0.5, duration: 150, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(wiggleAnim, { toValue: 0, duration: 100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]).start();
        }, 4500);

        return () => clearInterval(wiggleInterval);
    }, []);

    // Force re-render every second for the countdown
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Filter out expired offers
    const validOffers = offers.filter(offer => {
        if (!offer.offerEndDate) return true;
        return new Date(offer.offerEndDate) > new Date();
    });

    if (validOffers.length === 0) return null;

    useEffect(() => {
        if (validOffers.length <= 1) return;

        const interval = setInterval(() => {
            let nextIndex;
            let nextDirection = isGoingForward;

            if (isGoingForward) {
                if (currentIndex >= validOffers.length - 1) {
                    nextIndex = currentIndex - 1;
                    nextDirection = false;
                } else {
                    nextIndex = currentIndex + 1;
                }
            } else {
                if (currentIndex <= 0) {
                    nextIndex = currentIndex + 1;
                    nextDirection = true;
                } else {
                    nextIndex = currentIndex - 1;
                }
            }

            setCurrentIndex(nextIndex);
            setIsGoingForward(nextDirection);

            Animated.timing(scrollX, {
                toValue: nextIndex * windowWidth,
                duration: 600, // Reduced from 800 for faster slide speed
                useNativeDriver: true,
            }).start();
        }, 3600);

        return () => clearInterval(interval);
    }, [currentIndex, isGoingForward, validOffers.length]);

    const calculateTimeLeft = (endDate, startDate) => {
        if (!endDate) return null;
        const now = new Date();
        const end = new Date(endDate);
        const diff = end - now;

        if (diff <= 0) return { text: 'Offer Ended', progress: 1 };

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60) % 60));
        const seconds = Math.floor((diff / 1000 % 60));

        let progress = 0;
        if (startDate) {
            const start = new Date(startDate);
            const total = end - start;
            const elapsed = now - start;
            progress = Math.min(Math.max(elapsed / total, 0), 1);
        }

        const timeText = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        return {
            days, hours, minutes, seconds,
            text: timeText,
            progress
        };
    };

    const renderOfferItem = (offer, index) => {
        const timeInfo = calculateTimeLeft(offer.offerEndDate, offer.offerStartDate);
        const timeLeft = timeInfo?.text;
        const progress = timeInfo?.progress || 0;
        const hasOriginalPrice = offer.originalPrice && offer.originalPrice > offer.price;
        const percentage = offer.offerPercentage || (hasOriginalPrice ?
            Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100) : 0);

        return (
            <TouchableOpacity
                key={offer._id}
                activeOpacity={0.9}
                onPress={() => onOfferPress(offer)}
                style={styles.slide}
            >
                <Image source={{ uri: offer.image }} style={styles.offerImage} />
                <View style={styles.overlay}>
                    <View style={styles.badgeContainer}>
                        <Animated.View style={[
                            styles.percentageBadge,
                            {
                                transform: [
                                    { rotate: wiggleAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] }) },
                                    { scale: wiggleAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [1.1, 1, 1.1] }) }
                                ]
                            }
                        ]}>
                            <Tag size={12} color="#fff" />
                            <Text style={styles.percentageText}>{percentage}% OFF</Text>
                        </Animated.View>
                    </View>
                    <View style={styles.contentContainer}>
                        <Text style={styles.offerTitle} numberOfLines={1}>{offer.name}</Text>
                        <View style={styles.priceContainer}>
                            {offer.originalPrice > offer.price && (
                                <View style={styles.priceBox}>
                                    <Text style={styles.priceLabel}>WAS</Text>
                                    <Text style={styles.originalPrice}>Ksh {offer.originalPrice?.toLocaleString()}</Text>
                                </View>
                            )}
                            <View style={[styles.priceBox, { marginLeft: 20 }]}>
                                <Text style={[styles.priceLabel, { color: COLORS.accent }]}>NOW</Text>
                                <Text style={styles.offerPrice}>Ksh {offer.price?.toLocaleString()}</Text>
                            </View>
                        </View>

                        <Animated.View style={[styles.limitedTimeContainer, { opacity: glowAnim }]}>
                            <Zap size={14} color={COLORS.accent} fill={COLORS.accent} />
                            <Text style={styles.limitedTimeText}>LIMITED TIME OFFER</Text>
                        </Animated.View>
                    </View>

                    {offer.offerEndDate && timeInfo && (
                        <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
                            <View style={styles.timerHeader}>
                                <Timer size={10} color={COLORS.error} />
                                <Text style={styles.timerLabel}>OFFER ENDS IN:</Text>
                            </View>
                            <View style={styles.timeRow}>
                                <View style={styles.timeBox}><Text style={styles.timeBoxText}>{timeInfo.days}</Text><Text style={styles.timeLabel}>D</Text></View>
                                <Text style={styles.timeSeparator}>:</Text>
                                <View style={styles.timeBox}><Text style={styles.timeBoxText}>{String(timeInfo.hours).padStart(2, '0')}</Text><Text style={styles.timeLabel}>H</Text></View>
                                <Text style={styles.timeSeparator}>:</Text>
                                <View style={styles.timeBox}><Text style={styles.timeBoxText}>{String(timeInfo.minutes).padStart(2, '0')}</Text><Text style={styles.timeLabel}>M</Text></View>
                                <Text style={styles.timeSeparator}>:</Text>
                                <View style={styles.timeBox}><Text style={styles.timeBoxText}>{String(timeInfo.seconds).padStart(2, '0')}</Text><Text style={styles.timeLabel}>S</Text></View>
                            </View>
                        </Animated.View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[
                styles.sliderContent,
                { transform: [{ translateX: Animated.multiply(scrollX, -1) }] }
            ]}>
                {validOffers.map((offer, index) => renderOfferItem(offer, index))}
            </Animated.View>

            {validOffers.length > 1 && (
                <View style={styles.pagination}>
                    {validOffers.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.paginationDot,
                                currentIndex === i && styles.paginationDotActive
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 240,
        backgroundColor: '#000',
        overflow: 'hidden',
        width: windowWidth,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        marginVertical: 0,
        marginTop: 0,
        borderWidth: 0,
        alignSelf: 'stretch',
    },
    sliderContent: {
        flexDirection: 'row',
        height: '100%',
    },
    slide: {
        width: windowWidth,
        height: '100%',
    },
    offerImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 20,
        justifyContent: 'space-between',
    },
    badgeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    percentageBadge: {
        backgroundColor: COLORS.error,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    percentageText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 4,
    },
    timerContainer: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        alignItems: 'flex-end',
        zIndex: 10,
    },
    timerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    timerLabel: {
        color: COLORS.error,
        fontSize: 7,
        fontWeight: 'bold',
        marginLeft: 3,
        letterSpacing: 0.5,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeBox: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingVertical: 0,
        borderRadius: 0,
        minWidth: 15,
        alignItems: 'center',
    },
    timeBoxText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
    },
    timeLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 5,
        fontWeight: 'bold',
        marginTop: -2,
    },
    timeSeparator: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        marginHorizontal: 2,
    },
    progressBarBg: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        marginTop: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.accent,
        borderRadius: 2,
    },
    contentContainer: {
        marginBottom: 10,
    },
    offerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    priceBox: {
        alignItems: 'flex-start',
    },
    priceLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: -4,
    },
    originalPrice: {
        color: COLORS.error,
        fontSize: 16,
        textDecorationLine: 'line-through',
        fontWeight: 'bold',
    },
    offerPrice: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    limitedTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    limitedTimeText: {
        color: COLORS.accent,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginLeft: 5,
    },
    pagination: {
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
        marginHorizontal: 3,
    },
    paginationDotActive: {
        width: 20,
        backgroundColor: COLORS.accent,
    }
});

export default SpecialOfferSlider;
