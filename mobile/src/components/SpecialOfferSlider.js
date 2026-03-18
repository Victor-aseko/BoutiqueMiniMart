import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
    Animated,
    TouchableOpacity,
    Platform
} from 'react-native';
import { Timer, Tag, Zap, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../theme/theme';

const { width: windowWidth } = Dimensions.get('window');

const SpecialOfferSlider = ({ offers, onOfferPress }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [isGoingForward, setIsGoingForward] = useState(true);
    const [tick, setTick] = useState(0);

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
                duration: 800, // Slightly slower for reverse move to look smoother
                useNativeDriver: true,
            }).start();
        }, 5000);

        return () => clearInterval(interval);
    }, [currentIndex, isGoingForward, validOffers.length]);

    const calculateTimeLeft = (endDate) => {
        if (!endDate) return null;
        const diff = new Date(endDate) - new Date();
        if (diff <= 0) return 'Offer Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60) % 60));
        const seconds = Math.floor((diff / 1000 % 60));
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m LEFT`;
        return `${hours}h ${minutes}m ${seconds}s LEFT`;
    };

    const renderOfferItem = (offer, index) => {
        const timeLeft = calculateTimeLeft(offer.offerEndDate);
        const hasOriginalPrice = offer.originalPrice && offer.originalPrice > offer.price;
        const percentage = offer.offerPercentage || (hasOriginalPrice ? 
            Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100) : 5);

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
                        <View style={styles.percentageBadge}>
                            <Tag size={12} color="#fff" />
                            <Text style={styles.percentageText}>{percentage}% OFF</Text>
                        </View>
                        {timeLeft && (
                            <View style={styles.timerBadge}>
                                <Timer size={12} color="#fff" />
                                <View style={{ marginLeft: 4 }}>
                                    <Text style={styles.timerSubText}>ENDS IN:</Text>
                                    <Text style={styles.timerText}>{timeLeft}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.contentContainer}>
                        <Text style={styles.offerTitle} numberOfLines={1}>{offer.name}</Text>
                        <View style={styles.priceContainer}>
                            {hasOriginalPrice && (
                                <>
                                    <Text style={styles.originalPrice}>Ksh {offer.originalPrice.toLocaleString()}</Text>
                                    <ChevronRight size={14} color="rgba(255,255,255,0.7)" style={{ marginHorizontal: 4 }} />
                                </>
                            )}
                            <Text style={styles.offerPrice}>Ksh {offer.price?.toLocaleString()}</Text>
                        </View>
                        
                        <Animated.View style={styles.limitedTimeContainer}>
                            <Zap size={14} color={COLORS.accent} fill={COLORS.accent} />
                            <Text style={styles.limitedTimeText}>LIMITED TIME OFFER</Text>
                        </Animated.View>
                    </View>
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
        height: 220,
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
    timerBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    timerText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    timerSubText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: 0.5,
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
    originalPrice: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        textDecorationLine: 'line-through',
    },
    offerPrice: {
        color: '#fff',
        fontSize: 20,
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
