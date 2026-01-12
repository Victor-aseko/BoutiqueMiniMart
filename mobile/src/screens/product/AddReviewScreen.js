import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Star } from 'lucide-react-native';
import api from '../../services/api';
import { COLORS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

const RatingStar = ({ value, selected, onPress }) => (
    <TouchableOpacity onPress={() => onPress(value)} style={styles.starBtn}>
        <Star size={28} color={COLORS.star} fill={selected ? COLORS.star : 'transparent'} />
    </TouchableOpacity>
);

const AddReviewScreen = ({ route, navigation }) => {
    const { product } = route.params;
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');

    const fetchReviews = async () => {
        try {
            const resp = await api.get(`/products/${product._id}/reviews`);
            setReviews(resp.data || []);
        } catch (e) {
            console.error('Error fetching reviews', e?.response?.data || e.message);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    // Refresh reviews whenever this screen regains focus so other users' reviews appear
    useFocusEffect(
        React.useCallback(() => {
            fetchReviews();
        }, [product?._id])
    );

    const submitReview = async () => {
        if (!user) {
            Alert.alert('Sign in required', 'Please sign in to submit a review');
            // send user to the Login screen and after login redirect back to AddReview with pending review
            navigation.navigate('Auth', { screen: 'Login', params: { redirectTo: { tab: 'HomeTab', screen: 'AddReview', params: { product, pendingReview: { rating, comment } } } } });
            return;
        }
        if (user.isAdmin) {
            Alert.alert('Not Allowed', 'Only customers are allowed to rate products and share their reviews.');
            return;
        }
        if (rating < 0 || rating > 5) {
            Alert.alert('Invalid rating', 'Rating must be between 0 and 5');
            return;
        }
        try {
            setStatusMessage('Submitting review...');
            await api.post(`/products/${product._id}/reviews`, { rating, comment });

            // fetch updated product data
            let updated = product;
            try {
                const resp = await api.get(`/products/${product._id}`);
                updated = resp.data;
            } catch (e) {
                // ignore
            }

            // refresh reviews for this screen (so the new review appears)
            await fetchReviews();

            setStatusMessage('Review submitted');
            // Show confirmation and stay on this screen so user can see their review.
            Alert.alert('Thank you', 'Your review has been submitted', [
                { text: 'View Product', onPress: () => navigation.replace('ProductDetails', { product: updated }) },
                { text: 'Close', style: 'cancel' },
            ]);
        } catch (err) {
            console.error('Error submitting review', err.response?.data || err.message);
            const msg = err.response?.data?.message || 'Failed to submit review';
            setStatusMessage(msg);
            Alert.alert('Error', msg);
        }
    };

    // If this screen was opened after login with a pending review, auto-submit it
    React.useEffect(() => {
        const pending = route?.params?.pendingReview;
        if (pending && user) {
            if (pending.rating !== undefined) setRating(pending.rating);
            if (pending.comment !== undefined) setComment(pending.comment);
            setTimeout(() => submitReview(), 300);
        }
    }, [route?.params, user]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Add Review</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Rating (0 - 5)</Text>
                <View style={styles.ratingRow}>
                    <TouchableOpacity onPress={() => setRating(0)} style={styles.zeroBtn}>
                        <Text style={styles.zeroText}>0</Text>
                    </TouchableOpacity>
                    {[1, 2, 3, 4, 5].map(v => (
                        <RatingStar key={v} value={v} selected={v <= rating} onPress={setRating} />
                    ))}
                    <Text style={styles.selectedNumber}>{rating}</Text>
                </View>

                <Text style={styles.label}>Comment</Text>
                <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={6}
                    placeholder="Write your review here..."
                    value={comment}
                    onChangeText={setComment}
                />
                <TouchableOpacity style={styles.submitBtn} onPress={submitReview}>
                    <Text style={styles.submitText}>Submit Review</Text>
                </TouchableOpacity>

                {statusMessage ? <Text style={{ marginTop: 8, color: COLORS.textLight }}>{statusMessage}</Text> : null}

                <Text style={[styles.label, { marginTop: 20 }]}>Previous Reviews</Text>
                <FlatList
                    data={reviews}
                    keyExtractor={(item, index) => item._id || item.id || String(index)}
                    style={{ maxHeight: 220, marginTop: 10 }}
                    renderItem={({ item }) => (
                        <View style={styles.reviewItem}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.reviewName}>{item.name}</Text>
                                <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} size={12} color={COLORS.star} fill={i <= item.rating ? COLORS.star : 'transparent'} />
                                    ))}
                                </View>
                            </View>
                            <Text style={styles.reviewComment}>{item.comment}</Text>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    backBtn: { padding: 8, backgroundColor: COLORS.background, borderRadius: 8 },
    title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: COLORS.primary },
    content: { padding: 16 },
    label: { fontSize: 14, color: COLORS.textLight, marginBottom: 8 },
    ratingRow: { flexDirection: 'row', marginBottom: 16 },
    zeroBtn: { paddingHorizontal: 8, paddingVertical: 6, marginRight: 8, backgroundColor: COLORS.background, borderRadius: 6 },
    zeroText: { color: COLORS.textLight, fontWeight: '700' },
    starBtn: { marginRight: 6 },
    selectedNumber: { marginLeft: 8, fontWeight: '700', color: COLORS.primary, alignSelf: 'center' },
    ratingBtn: { padding: 10, borderRadius: 6, backgroundColor: COLORS.background, marginRight: 8 },
    ratingBtnActive: { backgroundColor: COLORS.accent },
    ratingText: { color: COLORS.primary, fontWeight: '700' },
    ratingTextActive: { color: COLORS.white },
    textArea: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, textAlignVertical: 'top', backgroundColor: COLORS.background },
    submitBtn: { marginTop: 20, backgroundColor: COLORS.accent, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    submitText: { color: COLORS.white, fontWeight: '700' }
    ,
    reviewItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    reviewName: { fontWeight: '700', color: COLORS.primary, marginRight: 6 },
    reviewComment: { color: COLORS.textLight, marginTop: 4 }
});

export default AddReviewScreen;
