import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

const Rating = ({ rating, size = 12 }) => {
    return (
        <View style={styles.container}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={size}
                    color="#F1C40F"
                    fill={i <= Math.round(rating) ? "#F1C40F" : "transparent"}
                    style={{ marginRight: 2 }}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default Rating;
