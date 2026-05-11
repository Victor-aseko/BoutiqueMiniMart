import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BrandLogo from './BrandLogo';

const { width } = Dimensions.get('window');

const adverts = [
  {
    id: '1',
    title: "SHOP SMARTER. ORDER FASTER.",
    subtitle: "Experience luxury fashion shopping strictly tailored for your device.",
    action: "DISCOVER NOW",
    image: require('../../assets/UserCard.png'),
    bgColors: ['#0F2027', '#203A43', '#2C5364'], // Sleek Dark Slate
    highlightColor: '#56CCF2', // Bright Blue
    imageMode: 'cover', // Protect head
    imageWidth: '75%' // Reduces the card image width natively
  },
  {
    id: '2',
    title: "DID YOU KNOW...?",
    subtitle: "You can seamlessly browse and order 24/7! The phone on the right shows just how easy it is inside the MiniBoutique App.",
    action: "TRY IT NOW",
    image: require('../../assets/onboarding_trio_phone.png'), // Placing the phone graphic on the right
    bgColors: ['#000428', '#004E92'], // Rich Blue Gradient Background
    highlightColor: '#00E5FF', // Bright Aqua 
    imageMode: 'cover'
  },
  {
    id: '3',
    title: "PREMIUM EXCLUSIVE ACCESS",
    subtitle: " Shop Smart with MiniBoutique and Deliver Fast",
    action: "SHOP NOW",
    image: require('../../assets/User 5.png'),
    bgColors: ['#2F0743', '#41295A'], // Deep Luxury Purple
    highlightColor: '#F8CBA6', // Rose Gold
    imageMode: 'cover'
  },
  {
    id: '4',
    title: "WE'RE JUST A CHAT AWAY!",
    subtitle: "Need style advice or order help? Tap into our live chat feature! Our friendly support team is ready to assist you instantly.",
    action: "START CHATTING",
    image: require('../../assets/Chats2.jpeg'),
    bgColors: ['#FF416C', '#FF4B2B'], // Vibrant Red/Orange Linear Gradient
    highlightColor: '#FFFFFF', // Clean White
    imageMode: 'cover'
  },
  {
    id: '5',
    title: "EMPOWER YOUR BUSINESS",
    subtitle: "Sellers, command your growth! Generate gorgeous, comprehensive sales analytics with just a single tap of a button.",
    action: "VIEW REPORTS",
    image: require('../../assets/SalesReport.jpeg'),
    bgColors: ['#0F172A', '#0F172A'], // NOT Linear: Pure solid sophisticated deep slate color (matched values)
    highlightColor: '#10B981', // Analytics Green
    imageMode: 'cover'
  }
];

const AnimatedAdverts = () => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  // Smooth bidirectional auto-scroll 
  useEffect(() => {
    let index = 0;
    let direction = 1; // 1 means moving forward, -1 means moving backward

    const timer = setInterval(() => {
      // Reverse direction if we hit the boundaries
      if (index === adverts.length - 1) {
        direction = -1;
      } else if (index === 0) {
        direction = 1;
      }

      index += direction;

      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
      });
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  const renderItem = ({ item, index }) => {
    // Defines exactly when the card should transition into/out of view
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    // Smoothly sizes the card up and down based on screen position
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.93, 1, 0.93],
      extrapolate: 'clamp',
    });

    // Smoothly fades the card in and out
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.cardContainer}>
        <Animated.View style={{ flex: 1, width: '100%', transform: [{ scale }], opacity }}>
          <LinearGradient
            colors={item.bgColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.cardInner}
          >
            {/* Top Section: High-Impact Catchy Advertisement Text */}
            <View style={styles.textSection}>
              <View style={styles.logoAuth}>
                <BrandLogo size="small" />
              </View>
              <Text style={[styles.title, { color: item.highlightColor }]}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: item.highlightColor }]}>
                <Text style={[styles.actionText, { color: item.highlightColor }]}>{item.action}</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Section: The Provided Featured Poster */}
            <View style={styles.imageSection}>
              <Image
                source={item.image}
                style={[styles.image, item.imageWidth ? { width: item.imageWidth } : null]}
                resizeMode={item.imageMode}
              />
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <Animated.FlatList
        ref={flatListRef}
        data={adverts}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={true}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  cardContainer: {
    width: width, // ENTIRE screen width
    height: 250,  // Reduced height, streamlined for side-by-side proportions
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8, // Set to exactly an eight point margin per user request
  },
  cardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row', // Forces Side-by-Side layout
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  textSection: {
    flex: 1.05, // Almost half text
    padding: 15,
    paddingTop: 45, // Accommodate the logo sitting above 
    justifyContent: 'center',
    alignItems: 'flex-start', // Left align text naturally
    position: 'relative',
  },
  logoAuth: {
    width: 60,
    height: 30,
    position: 'absolute',
    top: 15,
    left: 15,
    opacity: 0.85,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'left', // Keep text to the left
    letterSpacing: 0.5,
    marginBottom: 6,
    lineHeight: 20,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    textAlign: 'left',
    marginBottom: 12,
    lineHeight: 15,
  },
  actionBtn: {
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  imageSection: {
    flex: 0.95, // Remaining half for image
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end', // Strictly forces graphic alignment to hug the RIGHT margin
    paddingRight: 0,
    marginRight: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    right: 0,
  }
});

export default AnimatedAdverts;
