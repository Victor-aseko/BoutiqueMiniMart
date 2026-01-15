const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Category = require('./models/Category');
require('dotenv').config();

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing products and categories
        await Product.deleteMany({});
        await Category.deleteMany({});
        console.log('Cleared existing products and categories');

        // Create categories
        const categories = [
            {
                name: 'Clothing for Men',
                image: 'https://via.placeholder.com/300?text=Mens+Clothing',
                description: 'Premium clothing for men including shirts, jeans, and formal wear'
            },
            {
                name: 'Clothing for Women',
                image: 'https://via.placeholder.com/300?text=Womens+Clothing',
                description: 'Stylish clothing for women including dresses, blouses, and more'
            },
            {
                name: 'Clothing for Children',
                image: 'https://via.placeholder.com/300?text=Kids+Clothing',
                description: 'Comfortable and fun clothing for children'
            },
            {
                name: 'Shoes',
                image: 'https://via.placeholder.com/300?text=Shoes',
                description: 'Quality footwear for all occasions'
            },
            {
                name: 'Beddings',
                image: 'https://via.placeholder.com/300?text=Beddings',
                description: 'Premium bedding and bedroom accessories'
            }
        ];

        const createdCategories = await Category.insertMany(categories);
        console.log('Categories created successfully');

        // Get an admin user or create one
        let adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            adminUser = await User.create({
                name: 'Admin User',
                email: 'admin@boutique.com',
                password: 'admin123',
                role: 'admin'
            });
        }

        const products = [
            // Clothing for Men
            {
                name: 'Classic Mens Shirt',
                price: 2500,
                image: 'https://via.placeholder.com/300?text=Mens+Shirt',
                brand: 'Fashion Hub',
                category: 'Clothing for Men',
                countInStock: 25,
                description: 'Premium quality classic mens shirt perfect for casual and formal occasions'
            },
            {
                name: 'Mens Jeans - Dark Blue',
                price: 3500,
                image: 'https://via.placeholder.com/300?text=Mens+Jeans',
                brand: 'Denim Pro',
                category: 'Clothing for Men',
                countInStock: 30,
                description: 'Comfortable and stylish dark blue jeans for everyday wear'
            },
            {
                name: 'Mens Casual T-Shirt',
                price: 1500,
                image: 'https://via.placeholder.com/300?text=Mens+TShirt',
                brand: 'Cotton Gem',
                category: 'Clothing for Men',
                countInStock: 40,
                description: 'Soft and breathable casual t-shirt in various colors'
            },
            {
                name: 'Mens Formal Blazer',
                price: 8500,
                image: 'https://via.placeholder.com/300?text=Mens+Blazer',
                brand: 'Elite Wear',
                category: 'Clothing for Men',
                countInStock: 15,
                description: 'Professional formal blazer perfect for business meetings'
            },
            {
                name: 'Mens Shorts',
                price: 2000,
                image: 'https://via.placeholder.com/300?text=Mens+Shorts',
                brand: 'Summer Style',
                category: 'Clothing for Men',
                countInStock: 35,
                description: 'Comfortable shorts for summer and casual outings'
            },
            {
                name: 'Mens Polo Shirt',
                price: 2800,
                image: 'https://via.placeholder.com/300?text=Polo+Shirt',
                brand: 'Fashion Hub',
                category: 'Clothing for Men',
                countInStock: 28,
                description: 'Classic polo shirt perfect for casual and semi-formal wear'
            },
            {
                name: 'Mens Sweater - Wool',
                price: 5500,
                image: 'https://via.placeholder.com/300?text=Wool+Sweater',
                brand: 'Winter Wear',
                category: 'Clothing for Men',
                countInStock: 20,
                description: 'Warm wool sweater for cold weather, available in multiple colors'
            },
            {
                name: 'Mens Chinos - Khaki',
                price: 4000,
                image: 'https://via.placeholder.com/300?text=Chinos',
                brand: 'Casual Comfort',
                category: 'Clothing for Men',
                countInStock: 25,
                description: 'Smart casual khaki chinos perfect for everyday wear'
            },

            // Clothing for Women
            {
                name: 'Womens Casual Dress',
                price: 4500,
                image: 'https://via.placeholder.com/300?text=Womens+Dress',
                brand: 'Elegance',
                category: 'Clothing for Women',
                countInStock: 20,
                description: 'Beautiful casual dress perfect for daytime events'
            },
            {
                name: 'Womens Blouse',
                price: 3000,
                image: 'https://via.placeholder.com/300?text=Womens+Blouse',
                brand: 'Fashion Hub',
                category: 'Clothing for Women',
                countInStock: 28,
                description: 'Stylish and comfortable womens blouse in multiple patterns'
            },
            {
                name: 'Womens Jeans',
                price: 4000,
                image: 'https://via.placeholder.com/300?text=Womens+Jeans',
                brand: 'Denim Pro',
                category: 'Clothing for Women',
                countInStock: 25,
                description: 'Trendy womens jeans with perfect fit and style'
            },
            {
                name: 'Womens Evening Gown',
                price: 12000,
                image: 'https://via.placeholder.com/300?text=Womens+Gown',
                brand: 'Luxury Label',
                category: 'Clothing for Women',
                countInStock: 10,
                description: 'Elegant evening gown for special occasions'
            },
            {
                name: 'Womens Skirt',
                price: 3500,
                image: 'https://via.placeholder.com/300?text=Womens+Skirt',
                brand: 'Cotton Gem',
                category: 'Clothing for Women',
                countInStock: 30,
                description: 'Comfortable and stylish skirt for everyday wear'
            },
            {
                name: 'Womens Cardigan',
                price: 5000,
                image: 'https://via.placeholder.com/300?text=Cardigan',
                brand: 'Cozy Wear',
                category: 'Clothing for Women',
                countInStock: 22,
                description: 'Soft cardigan perfect for layering and warmth'
            },
            {
                name: 'Womens Leggings',
                price: 2500,
                image: 'https://via.placeholder.com/300?text=Leggings',
                brand: 'Athletic Pro',
                category: 'Clothing for Women',
                countInStock: 35,
                description: 'Comfortable leggings perfect for yoga and casual wear'
            },
            {
                name: 'Womens Shorts',
                price: 2800,
                image: 'https://via.placeholder.com/300?text=Womens+Shorts',
                brand: 'Summer Style',
                category: 'Clothing for Women',
                countInStock: 28,
                description: 'Stylish shorts for summer and outdoor activities'
            },

            // Clothing for Children
            {
                name: 'Kids Cartoon T-Shirt',
                price: 1200,
                image: 'https://via.placeholder.com/300?text=Kids+TShirt',
                brand: 'Kiddies Zone',
                category: 'Clothing for Children',
                countInStock: 50,
                description: 'Colorful and fun t-shirt with cartoon prints for kids'
            },
            {
                name: 'Kids School Uniform',
                price: 2800,
                image: 'https://via.placeholder.com/300?text=School+Uniform',
                brand: 'School Pride',
                category: 'Clothing for Children',
                countInStock: 40,
                description: 'Official school uniform for boys and girls'
            },
            {
                name: 'Kids Casual Shorts',
                price: 1500,
                image: 'https://via.placeholder.com/300?text=Kids+Shorts',
                brand: 'Play Time',
                category: 'Clothing for Children',
                countInStock: 45,
                description: 'Durable and comfortable shorts for active kids'
            },
            {
                name: 'Kids Hoodie',
                price: 2500,
                image: 'https://via.placeholder.com/300?text=Kids+Hoodie',
                brand: 'Cozy Wear',
                category: 'Clothing for Children',
                countInStock: 35,
                description: 'Warm and cozy hoodie perfect for cold weather'
            },
            {
                name: 'Kids Party Dress',
                price: 4000,
                image: 'https://via.placeholder.com/300?text=Kids+Dress',
                brand: 'Little Princess',
                category: 'Clothing for Children',
                countInStock: 20,
                description: 'Adorable party dress for special occasions'
            },
            {
                name: 'Kids Pajama Set',
                price: 2000,
                image: 'https://via.placeholder.com/300?text=Pajamas',
                brand: 'Dream Time',
                category: 'Clothing for Children',
                countInStock: 40,
                description: 'Comfortable cotton pajama set for kids'
            },
            {
                name: 'Kids Winter Jacket',
                price: 6000,
                image: 'https://via.placeholder.com/300?text=Winter+Jacket',
                brand: 'Warm Kids',
                category: 'Clothing for Children',
                countInStock: 18,
                description: 'Waterproof winter jacket to keep kids warm'
            },
            {
                name: 'Kids Jeans',
                price: 2500,
                image: 'https://via.placeholder.com/300?text=Kids+Jeans',
                brand: 'Denim Kids',
                category: 'Clothing for Children',
                countInStock: 32,
                description: 'Durable jeans perfect for active play'
            },

            // Shoes
            {
                name: 'Running Sports Shoes',
                price: 6500,
                image: 'https://via.placeholder.com/300?text=Running+Shoes',
                brand: 'Athletic Pro',
                category: 'Shoes',
                countInStock: 22,
                description: 'Professional running shoes with excellent comfort and support'
            },
            {
                name: 'Casual Sneakers',
                price: 4500,
                image: 'https://via.placeholder.com/300?text=Sneakers',
                brand: 'Street Style',
                category: 'Shoes',
                countInStock: 30,
                description: 'Stylish casual sneakers for everyday wear'
            },
            {
                name: 'Formal Dress Shoes',
                price: 7500,
                image: 'https://via.placeholder.com/300?text=Formal+Shoes',
                brand: 'Gentleman',
                category: 'Shoes',
                countInStock: 18,
                description: 'Classic formal dress shoes perfect for business and events'
            },
            {
                name: 'Womens Sandals',
                price: 3000,
                image: 'https://via.placeholder.com/300?text=Sandals',
                brand: 'Summer Comfort',
                category: 'Shoes',
                countInStock: 35,
                description: 'Comfortable sandals perfect for summer'
            },
            {
                name: 'Boots - Black Leather',
                price: 9000,
                image: 'https://via.placeholder.com/300?text=Boots',
                brand: 'Premium Leather',
                category: 'Shoes',
                countInStock: 15,
                description: 'Premium black leather boots for style and durability'
            },
            {
                name: 'Canvas High Tops',
                price: 5000,
                image: 'https://via.placeholder.com/300?text=High+Tops',
                brand: 'Street Style',
                category: 'Shoes',
                countInStock: 28,
                description: 'Trendy canvas high-top shoes for casual style'
            },
            {
                name: 'Comfortable Loafers',
                price: 5500,
                image: 'https://via.placeholder.com/300?text=Loafers',
                brand: 'Gentleman',
                category: 'Shoes',
                countInStock: 20,
                description: 'Comfortable slip-on loafers for semi-formal wear'
            },
            {
                name: 'Kids Sneakers',
                price: 3500,
                image: 'https://via.placeholder.com/300?text=Kids+Sneakers',
                brand: 'Kids Step',
                category: 'Shoes',
                countInStock: 32,
                description: 'Colorful and comfortable sneakers for kids'
            },

            // Beddings
            {
                name: 'Double Bed Sheets Set',
                price: 5500,
                image: 'https://via.placeholder.com/300?text=Bed+Sheets',
                brand: 'Comfort Home',
                category: 'Beddings',
                countInStock: 25,
                description: 'Premium quality cotton bed sheet set for double beds'
            },
            {
                name: 'Pillow Covers - Set of 2',
                price: 2000,
                image: 'https://via.placeholder.com/300?text=Pillow+Covers',
                brand: 'Soft Dreams',
                category: 'Beddings',
                countInStock: 40,
                description: 'Comfortable pillow covers in various designs'
            },
            {
                name: 'Quilt - Winter Warm',
                price: 8000,
                image: 'https://via.placeholder.com/300?text=Quilt',
                brand: 'Winter Comfort',
                category: 'Beddings',
                countInStock: 20,
                description: 'Warm and cozy winter quilt for cold nights'
            },
            {
                name: 'Single Bed Sheets',
                price: 3500,
                image: 'https://via.placeholder.com/300?text=Single+Sheets',
                brand: 'Comfort Home',
                category: 'Beddings',
                countInStock: 35,
                description: 'High quality cotton sheets for single beds'
            },
            {
                name: 'Mattress Protector',
                price: 4000,
                image: 'https://via.placeholder.com/300?text=Mattress+Protector',
                brand: 'Protection Plus',
                category: 'Beddings',
                countInStock: 30,
                description: 'Waterproof mattress protector for all bed sizes'
            },
            {
                name: 'Duvet Cover Set - King',
                price: 6500,
                image: 'https://via.placeholder.com/300?text=Duvet+Cover',
                brand: 'Premium Comfort',
                category: 'Beddings',
                countInStock: 22,
                description: 'Luxurious duvet cover set with matching pillowcases'
            },
            {
                name: 'Bed Skirt - Double',
                price: 3000,
                image: 'https://via.placeholder.com/300?text=Bed+Skirt',
                brand: 'Soft Dreams',
                category: 'Beddings',
                countInStock: 28,
                description: 'Elegant bed skirt to add style to your bedroom'
            },
            {
                name: 'Thermal Blanket',
                price: 4500,
                image: 'https://via.placeholder.com/300?text=Thermal+Blanket',
                brand: 'Warm Nights',
                category: 'Beddings',
                countInStock: 25,
                description: 'Temperature-regulating blanket for all seasons'
            }
        ];

        const productsWithUser = products.map(product => ({
            ...product,
            user: adminUser._id
        }));

        const createdProducts = await Product.insertMany(productsWithUser);
        console.log(`${createdProducts.length} products seeded successfully!`);
        console.log('Products by category:');
        console.log('- Clothing for Men: 8 products');
        console.log('- Clothing for Women: 8 products');
        console.log('- Clothing for Children: 8 products');
        console.log('- Shoes: 8 products');
        console.log('- Beddings: 8 products');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
};

seedProducts();
