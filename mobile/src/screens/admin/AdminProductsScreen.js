import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Image,
    Modal,
    ScrollView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Edit2, Trash2, X, Tag, DollarSign, Package, Image as ImageIcon, Upload } from 'lucide-react-native';
import api, { BASE_URL } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../theme/theme';
import MyButton from '../../components/MyButton';
import MyInput from '../../components/MyInput';

const AdminProductsScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProductId, setCurrentProductId] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState('');
    const [countInStock, setCountInStock] = useState('');
    const [colors, setColors] = useState([]); // [{ name, image }]
    const [sizes, setSizes] = useState([]); // [string]
    const [newSize, setNewSize] = useState('');
    const [newColorName, setNewColorName] = useState('');
    const [newColorImage, setNewColorImage] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) {
            console.error('Fetch products error:', error);
            Alert.alert('Error', 'Failed to fetch products');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentProductId(null);
        setName('');
        setPrice('');
        setDescription('');
        setCategory('');
        setImage('');
        setCountInStock('');
        setColors([]);
        setSizes([]);
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setIsEditing(true);
        setCurrentProductId(product._id);
        setName(product.name);
        setPrice(product.price.toString());
        setDescription(product.description);
        setCategory(product.category);
        setImage(product.image);
        setCountInStock(product.countInStock.toString());
        setColors(product.colors || []);
        setSizes(product.sizes || []);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/products/${id}`);
                            Alert.alert('Success', 'Product deleted successfully');
                            fetchProducts();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete product');
                        }
                    }
                }
            ]
        );
    };

    const handleSubmit = async () => {
        if (!name || !price || !category || !image || !countInStock) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        const productData = {
            name,
            price: parseFloat(price),
            description,
            category,
            image,
            countInStock: parseInt(countInStock),
            colors,
            sizes,
            brand: 'MiniBoutique', // Default brand
            rating: 0,
            numReviews: 0
        };

        try {
            if (isEditing) {
                await api.put(`/products/${currentProductId}`, productData);
                Alert.alert('Success', 'Product updated successfully');
            } else {
                await api.post('/products', productData);
                Alert.alert('Success', 'Product created successfully');
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to save product');
        }
    };

    const uploadFileHandler = async (type = 'main') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 4],
            quality: 1,
        });

        if (!result.canceled) {
            const selectedImage = result.assets[0];
            const originalUri = selectedImage.uri;
            const uri = Platform.OS === 'android' ? originalUri : originalUri.replace('file://', '');

            setUploading(true);
            console.log('--- STARTING UPLOAD ---');
            console.log('URI:', uri);

            try {
                const formData = new FormData();

                // Construct file object correctly
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const fileType = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('image', {
                    uri: uri,
                    name: filename,
                    type: fileType,
                });

                const { data } = await api.post('/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                console.log('Server Raw Response:', data);

                if (data && data.image) {
                    let fullUrl = data.image;

                    // If it's not a full URL (does not start with http/https), prepend BASE_URL
                    if (!fullUrl.startsWith('http')) {
                        const imagePath = data.image.startsWith('/') ? data.image.substring(1) : data.image;
                        fullUrl = `${BASE_URL.replace(/\/$/, '')}/${imagePath}`;
                    }

                    console.log('Success! Final URL:', fullUrl);
                    if (type === 'main') {
                        setImage(fullUrl);
                    } else {
                        setNewColorImage(fullUrl);
                    }
                    Alert.alert('Success', 'Image uploaded successfully');
                }
            } catch (error) {
                console.error('SERVER ERROR:', error.response?.data || error.message);
                Alert.alert('Upload Failed', error.response?.data?.message || 'Could not upload image to server.');
            } finally {
                setUploading(false);
            }
        }
    };

    const renderProductItem = ({ item }) => (
        <View style={styles.productCard}>
            <Image
                source={{ uri: item.image || 'https://via.placeholder.com/100' }}
                style={styles.productImage}
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productCategory}>{item.category}</Text>
                <Text style={styles.productPrice}>Kshs {item.price.toFixed(2)}</Text>
                <Text style={[styles.stockStatus, { color: item.countInStock > 0 ? COLORS.success : COLORS.error }]}>
                    {item.countInStock > 0 ? `${item.countInStock} in stock` : 'Out of stock'}
                </Text>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => openEditModal(item)}
                >
                    <Edit2 size={18} color={COLORS.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item._id)}
                >
                    <Trash2 size={18} color={COLORS.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Products</Text>
                <TouchableOpacity onPress={openCreateModal} style={styles.addBtn}>
                    <Plus color={COLORS.accent} size={24} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={products}
                keyExtractor={item => item._id}
                renderItem={renderProductItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Package size={64} color={COLORS.border} />
                        <Text style={styles.emptyText}>No products found.</Text>
                    </View>
                }
            />

            <Modal
                visible={isModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {isEditing ? 'Edit Product' : 'Add New Product'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                                <X size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContent}>
                            <MyInput
                                label="Product Name"
                                placeholder="Enter product name"
                                value={name}
                                onChangeText={setName}
                                icon={Package}
                            />
                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <MyInput
                                        label="Price (Kshs)"
                                        placeholder="0.00"
                                        value={price}
                                        onChangeText={setPrice}
                                        keyboardType="numeric"
                                        icon={DollarSign}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <MyInput
                                        label="Stock Quantity"
                                        placeholder="0"
                                        value={countInStock}
                                        onChangeText={setCountInStock}
                                        keyboardType="numeric"
                                        icon={Tag}
                                    />
                                </View>
                            </View>
                            <MyInput
                                label="Category"
                                placeholder="e.g. Dresses, Shoes"
                                value={category}
                                onChangeText={setCategory}
                                icon={Tag}
                            />

                            <View style={{ marginBottom: 15 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <MyInput
                                            label="Image URL"
                                            placeholder="https://... or upload"
                                            value={image}
                                            onChangeText={setImage}
                                            icon={ImageIcon}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.uploadBtn, uploading && { opacity: 0.7 }]}
                                        onPress={() => uploadFileHandler('main')}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <ActivityIndicator size="small" color={COLORS.white} />
                                        ) : (
                                            <Upload size={20} color={COLORS.white} />
                                        )}
                                        <Text style={styles.uploadBtnText}>
                                            {uploading ? '...' : 'Upload'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <MyInput
                                label="Description"
                                placeholder="Enter product description"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                style={{ height: 100 }}
                            />

                            {/* Colors Management */}
                            <Text style={styles.sectionLabel}>Color Variants</Text>
                            <View style={styles.variantsBox}>
                                <View style={styles.variantInputRow}>
                                    <View style={{ flex: 1 }}>
                                        <MyInput
                                            label="Color Name"
                                            placeholder="Red, Blue..."
                                            value={newColorName}
                                            onChangeText={setNewColorName}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
                                            <View style={{ flex: 1 }}>
                                                <MyInput
                                                    label="Variant Image"
                                                    placeholder="URL..."
                                                    value={newColorImage}
                                                    onChangeText={setNewColorImage}
                                                />
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.miniUploadBtn, uploading && { opacity: 0.7 }]}
                                                onPress={() => uploadFileHandler('variant')}
                                                disabled={uploading}
                                            >
                                                <Upload size={16} color={COLORS.white} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.addVariantBtn}
                                        onPress={() => {
                                            if (newColorName && newColorImage) {
                                                setColors([...colors, { name: newColorName, image: newColorImage }]);
                                                setNewColorName('');
                                                setNewColorImage('');
                                            }
                                        }}
                                    >
                                        <Plus size={20} color={COLORS.white} />
                                    </TouchableOpacity>
                                </View>
                                {colors.map((c, i) => (
                                    <View key={i} style={styles.variantItem}>
                                        <Image source={{ uri: c.image }} style={styles.variantImgPreview} />
                                        <Text style={styles.variantText}>{c.name}</Text>
                                        <TouchableOpacity onPress={() => setColors(colors.filter((_, idx) => idx !== i))}>
                                            <X size={16} color={COLORS.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            {/* Sizes Management */}
                            <Text style={styles.sectionLabel}>Available Sizes</Text>
                            <View style={styles.variantsBox}>
                                <View style={styles.variantInputRow}>
                                    <View style={{ flex: 1 }}>
                                        <MyInput
                                            label="Size"
                                            placeholder="XL, 10, Small..."
                                            value={newSize}
                                            onChangeText={setNewSize}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.addVariantBtn}
                                        onPress={() => {
                                            if (newSize) {
                                                setSizes([...sizes, newSize]);
                                                setNewSize('');
                                            }
                                        }}
                                    >
                                        <Plus size={20} color={COLORS.white} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.sizeTagsContainer}>
                                    {sizes.map((s, i) => (
                                        <View key={i} style={styles.sizeTag}>
                                            <Text style={styles.sizeTagText}>{s}</Text>
                                            <TouchableOpacity onPress={() => setSizes(sizes.filter((_, idx) => idx !== i))}>
                                                <X size={14} color={COLORS.white} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <MyButton
                                title={isEditing ? "Update Product" : "Create Product"}
                                onPress={handleSubmit}
                                style={styles.submitBtn}
                            />
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
    addBtn: { padding: 4 },
    listContent: { padding: 16 },
    productCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: COLORS.background,
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.accent,
        marginBottom: 4,
    },
    stockStatus: {
        fontSize: 12,
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4,
        backgroundColor: COLORS.background,
    },
    emptyState: { alignItems: 'center', marginTop: 64 },
    emptyText: { marginTop: 16, color: COLORS.textLight, fontSize: 16 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        height: '85%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    formContent: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    submitBtn: {
        marginTop: 20,
    },
    uploadBtn: {
        height: 50,
        backgroundColor: COLORS.accent,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15,
        marginBottom: 8,
    },
    uploadBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
    miniUploadBtn: {
        width: 35,
        height: 35,
        backgroundColor: COLORS.accent,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 15,
        marginBottom: 5,
    },
    variantsBox: {
        backgroundColor: COLORS.background,
        padding: 10,
        borderRadius: 12,
        marginBottom: 10,
    },
    variantInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 5,
    },
    addVariantBtn: {
        width: 45,
        height: 45,
        backgroundColor: COLORS.accent,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    variantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 8,
        borderRadius: 8,
        marginTop: 5,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    variantImgPreview: {
        width: 30,
        height: 30,
        borderRadius: 5,
        marginRight: 10,
    },
    variantText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.text,
    },
    sizeTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sizeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    sizeTagText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 5,
    }
});

export default AdminProductsScreen;
