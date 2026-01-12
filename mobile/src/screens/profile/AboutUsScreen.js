import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/theme';

const AboutUsScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>About Us</Text>
                <Text style={styles.description}>
                    Welcome to MiniBoutique, your number one source for all things fashion. We're dedicated to giving you the very best of products, with a focus on dependability, customer service and uniqueness.
                </Text>
                <Text style={styles.description}>
                    Founded in 2025, MiniBoutique has come a long way from its beginnings. When we first started out, our passion for boutique fashion drove us to do intense research, and gave us the impetus to turn hard work and inspiration into a booming online store.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 20 },
    description: { fontSize: 16, color: COLORS.text, lineHeight: 24, marginBottom: 15 },
});

export default AboutUsScreen;
