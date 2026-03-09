"""
Management command to seed the database with initial categories and products.
Matches the exact data from the frontend HTML.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify

from products.models import Category, Product

User = get_user_model()


SEED_DATA = {
    "Wild Honey": [
        {"name": "Giant Rock Bee Honey", "img": "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400", "price": 750},
        {"name": "Multi-Floral Forest Honey", "img": "https://zemefarms.com/cdn/shop/articles/Honey_A_content.jpg?v=1698004533", "price": 450},
        {"name": "Organic Neem Honey", "img": "https://images.unsplash.com/photo-1471943311424-646960669fbc?w=400", "price": 550},
        {"name": "Raw Unfiltered Honey", "img": "https://tse3.mm.bing.net/th/id/OIP.ELjwEWhiMVNE9-QEoaqT_QHaHa?rs=1&pid=ImgDetMain&o=7&rm=3", "price": 400},
        {"name": "Himalayan Sidr Honey", "img": "https://tse2.mm.bing.net/th/id/OIP.1sjsNk93lALZRjlkKiVHXAHaI0?rs=1&pid=ImgDetMain&o=7&rm=3", "price": 1200},
        {"name": "Wild Litchi Honey", "img": "https://himalayanatural.com/wp-content/uploads/2023/02/Litchi-Honey-1-scaled.jpg", "price": 600},
        {"name": "Sun-Dried Honeycomb", "img": "https://img.freepik.com/premium-photo/dried-honeycomb-isolated-white-background-clipping-path_1308157-115518.jpg?w=2000", "price": 950},
        {"name": "Eucalyptus Forest Honey", "img": "https://images.unsplash.com/photo-1471943311424-646960669fbc?w=400", "price": 380},
        {"name": "Dark Forest Bittersweet", "img": "https://th.bing.com/th/id/R.92c1e726a6d7a6175aa06fb242cc1e89", "price": 520},
        {"name": "Mountain Saffron Honey", "img": "https://tse4.mm.bing.net/th/id/OIP.YRgcdvX0-7hh5JsTo74JmAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3", "price": 1500},
    ],
    "Handicrafts": [
        {"name": "Bamboo Weave Basket", "img": "https://tse1.mm.bing.net/th/id/OIP.9qMymcQEnyM94wgX2QC64AHaIf?rs=1&pid=ImgDetMain&o=7&rm=3", "price": 500},
        {"name": "Cane Sitting Stool", "img": "https://m.media-amazon.com/images/I/71sGmGl4KwL._AC_.jpg", "price": 1200},
        {"name": "Hand-Carved Wood Horse", "img": "https://i.etsystatic.com/37253540/r/il/10b7cb/4169173423/il_1080xN.4169173423_s09o.jpg", "price": 650},
        {"name": "Tribal Wall Mask", "img": "https://tse2.mm.bing.net/th/id/OIP.TS_doGW9iH_Sne0qvuiazgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3", "price": 2200},
        {"name": "Palm Leaf Platter", "img": "https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=400", "price": 120},
        {"name": "Coconut Shell Cup", "img": "https://images.unsplash.com/photo-1611002214172-791c3f2d07ad?w=400", "price": 180},
        {"name": "Terracotta Flower Vase", "img": "https://images.unsplash.com/photo-1590505694030-975058778a48?w=400", "price": 450},
        {"name": "Jute Embroidered Bag", "img": "https://images.unsplash.com/photo-1544816153-12ad5d7133a1?w=400", "price": 550},
        {"name": "Bamboo Hanging Lamp", "img": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400", "price": 900},
        {"name": "Hand-Painted Pottery", "img": "https://images.unsplash.com/photo-1578912995027-3199c0da9836?w=400", "price": 350},
    ],
    "Tribal Jewelry": [
        {"name": "Dokra Brass Necklace", "img": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400", "price": 1250},
        {"name": "Hand-Beaded Naga Bangles", "img": "https://images.unsplash.com/photo-1611085583191-a3b1a6a2e24a?w=400", "price": 400},
        {"name": "Silver Hill Choker", "img": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400", "price": 2800},
        {"name": "Bamboo Carved Ring", "img": "https://images.unsplash.com/photo-1605100804763-247f67b3f416?w=400", "price": 150},
        {"name": "Terra-cotta Earrings", "img": "https://images.unsplash.com/photo-1610433561339-491959779900?w=400", "price": 250},
        {"name": "Feather Headgear", "img": "https://images.unsplash.com/photo-1544450173-8c87979133ca?w=400", "price": 1100},
        {"name": "Shell Tassel Necklace", "img": "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=400", "price": 550},
        {"name": "Coin Belt Waistband", "img": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400", "price": 1900},
        {"name": "Wood-Carved Brooch", "img": "https://images.unsplash.com/photo-1535572290543-960a8046f5af?w=400", "price": 320},
        {"name": "Traditional Thread Anklet", "img": "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400", "price": 200},
    ],
    "Medicinal Herbs": [
        {"name": "Pure Ashwagandha Root", "img": "https://images.unsplash.com/photo-1611073244284-706d1d96a707?w=400", "price": 350},
        {"name": "Sun-Dried Brahmi Leaves", "img": "https://images.unsplash.com/photo-1563293750-681b583cdc0e?w=400", "price": 280},
        {"name": "Organic Shatavari Powder", "img": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400", "price": 420},
        {"name": "Wild Tulsi Extract", "img": "https://images.unsplash.com/photo-1515023115689-589c39d5b0ee?w=400", "price": 150},
        {"name": "Hill Neem Bark", "img": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400", "price": 120},
        {"name": "Fresh Giloy Stems", "img": "https://images.unsplash.com/photo-1540331547168-8b63109225b7?w=400", "price": 190},
        {"name": "Mountain Triphala", "img": "https://images.unsplash.com/photo-1512103522276-50ad58169821?w=400", "price": 300},
        {"name": "Aloe Vera Gel Pure", "img": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400", "price": 220},
        {"name": "Natural Spirulina", "img": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400", "price": 850},
        {"name": "Turmeric Medicinal Root", "img": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400", "price": 180},
    ],
    "Organic Spices": [
        {"name": "Hill Turmeric Powder", "img": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400", "price": 220},
        {"name": "Wild Black Pepper", "img": "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400", "price": 350},
        {"name": "Organic Green Cardamom", "img": "https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?w=400", "price": 450},
        {"name": "Cinnamon Sticks Pure", "img": "https://images.unsplash.com/photo-1599307436098-692791d90f89?w=400", "price": 180},
        {"name": "Hill Clove Buds", "img": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "price": 250},
        {"name": "Red Chili Whole", "img": "https://images.unsplash.com/photo-1588252303782-cb80119f704a?w=400", "price": 150},
        {"name": "Star Anise Organic", "img": "https://images.unsplash.com/photo-1533224376435-01e793931698?w=400", "price": 200},
        {"name": "Natural Nutmeg", "img": "https://images.unsplash.com/photo-1621505961197-44bc711663ec?w=400", "price": 140},
        {"name": "Dry Ginger Root", "img": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400", "price": 180},
        {"name": "Hill Mace Spice", "img": "https://images.unsplash.com/photo-1609130767011-06774903f16f?w=400", "price": 400},
    ],
    "Handwoven Fabrics": [
        {"name": "Organic Cotton Shawl", "img": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400", "price": 1400},
        {"name": "Tribal Silk Saree", "img": "https://images.unsplash.com/photo-1610030469668-93510ec2c321?w=400", "price": 4500},
        {"name": "Indigo Dyed Scarf", "img": "https://images.unsplash.com/photo-1584949514490-73fc1a2aba13?w=400", "price": 850},
        {"name": "Handloom Tunic", "img": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400", "price": 1200},
        {"name": "Tribal Print Stole", "img": "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400", "price": 600},
        {"name": "Woolen Poncho", "img": "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=400", "price": 2200},
        {"name": "Embroidered Fabric", "img": "https://images.unsplash.com/photo-1617146059270-d384b601831d?w=400", "price": 900},
        {"name": "Ikat Woven Cloth", "img": "https://images.unsplash.com/photo-1610030469910-4497e201b1b4?w=400", "price": 1100},
        {"name": "Hand-Spun Khadi", "img": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400", "price": 750},
        {"name": "Traditional Lungi", "img": "https://images.unsplash.com/photo-1610030469668-93510ec2c321?w=400", "price": 500},
    ],
    "Traditional Art": [
        {"name": "Warli Wall Painting", "img": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400", "price": 2500},
        {"name": "Pattachitra Scroll", "img": "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400", "price": 3200},
        {"name": "Madhubani Art Canvas", "img": "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400", "price": 1800},
        {"name": "Tribal Wood Carving", "img": "https://images.unsplash.com/photo-1535572290543-960a8046f5af?w=400", "price": 5500},
        {"name": "Terracotta Figurine", "img": "https://images.unsplash.com/photo-1590505694030-975058778a48?w=400", "price": 450},
        {"name": "Brass Tribal Idol", "img": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400", "price": 1500},
        {"name": "Palm Leaf Etching", "img": "https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=400", "price": 800},
        {"name": "Bamboo Mural", "img": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400", "price": 2100},
        {"name": "Stone Jali Work", "img": "https://images.unsplash.com/photo-1590422207212-326942220721?w=400", "price": 4000},
        {"name": "Folk Clay Mask", "img": "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400", "price": 650},
    ],
    "Wild Seeds": [
        {"name": "Organic Flax Seeds", "img": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400", "price": 180},
        {"name": "Wild Chia Seeds", "img": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400", "price": 250},
        {"name": "Pumpkin Seeds Raw", "img": "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400", "price": 300},
        {"name": "Sunflower Seeds", "img": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400", "price": 220},
        {"name": "Natural Sesame", "img": "https://images.unsplash.com/photo-1590080874088-eec64895b423?w=400", "price": 150},
        {"name": "Mustard Seeds Hill", "img": "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400", "price": 100},
        {"name": "Niger Seeds Pure", "img": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400", "price": 400},
        {"name": "Fenugreek Wild", "img": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400", "price": 120},
        {"name": "Cumin Hill Variety", "img": "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400", "price": 320},
        {"name": "Wild Carom Seeds", "img": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400", "price": 200},
    ],
    "Eco-Utensils": [
        {"name": "Clay Cooking Pot", "img": "https://images.unsplash.com/photo-1590505694030-975058778a48?w=400", "price": 450},
        {"name": "Wooden Spatula Set", "img": "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400", "price": 350},
        {"name": "Bamboo Water Jug", "img": "https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?w=400", "price": 600},
        {"name": "Coconut Shell Eco Cup", "img": "https://images.unsplash.com/photo-1611002214172-791c3f2d07ad?w=400", "price": 150},
        {"name": "Cane Woven Tray", "img": "https://images.unsplash.com/photo-1581557991964-125469da3b8a?w=400", "price": 400},
        {"name": "Leaf Plate Set", "img": "https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=400", "price": 50},
        {"name": "Terracotta Glass", "img": "https://images.unsplash.com/photo-1590505694030-975058778a48?w=400", "price": 200},
        {"name": "Wooden Serving Bowl", "img": "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400", "price": 800},
        {"name": "Bamboo Chopsticks", "img": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400", "price": 100},
        {"name": "Stone Mortar Pestle", "img": "https://images.unsplash.com/photo-1590422207212-326942220721?w=400", "price": 1200},
    ],
    "Hill Tubers": [
        {"name": "Organic Sweet Potato", "img": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "price": 150},
        {"name": "Fresh Yam Root", "img": "https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=400", "price": 200},
        {"name": "Hill Taro Tuber", "img": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "price": 180},
        {"name": "Purple Sweet Potato", "img": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "price": 250},
        {"name": "Wild Arrowroot", "img": "https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=400", "price": 300},
        {"name": "Cassava Fresh", "img": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "price": 120},
        {"name": "Radish Hill Grown", "img": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "price": 80},
        {"name": "Carrot Organic", "img": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "price": 100},
        {"name": "Beetroot Hill", "img": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "price": 120},
        {"name": "Ginger Fresh Root", "img": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400", "price": 220},
    ],
}


class Command(BaseCommand):
    help = 'Seed the database with initial categories and 100 products from the frontend'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear', action='store_true',
            help='Clear existing products and categories before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Product.objects.all().delete()
            Category.objects.all().delete()

        # Create a seller user for seed data
        seller, created = User.objects.get_or_create(
            email='artisan@triballink.com',
            defaults={
                'username': 'tribal_artisan',
                'first_name': 'Tribal',
                'last_name': 'Artisan',
                'role': 'seller',
                'is_verified_seller': True,
                'shop_name': 'TribalLink Official',
            },
        )
        if created:
            seller.set_password('artisan123')
            seller.save()
            self.stdout.write(self.style.SUCCESS(f'Created seller: {seller.email}'))

        product_count = 0
        for cat_name, products in SEED_DATA.items():
            category, _ = Category.objects.get_or_create(
                name=cat_name,
                defaults={
                    'slug': slugify(cat_name),
                    'description': f'Authentic tribal {cat_name.lower()} sourced from hill artisans.',
                },
            )
            self.stdout.write(f'Category: {cat_name}')

            for item in products:
                product, created = Product.objects.get_or_create(
                    name=item['name'],
                    seller=seller,
                    defaults={
                        'category': category,
                        'description': f'Authentic tribal {cat_name.lower()} — {item["name"]}. '
                                       f'Hand-sourced from indigenous artisans in remote hill regions. '
                                       f'Each piece carries the heritage and craftsmanship of generations.',
                        'price': item['price'],
                        'image_url': item['img'],
                        'stock': 50,
                        'status': 'approved',
                        'is_featured': product_count < 12,  # First 12 are featured
                    },
                )
                if created:
                    product_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nSeeded {product_count} products across {len(SEED_DATA)} categories.'
        ))
        self.stdout.write(self.style.SUCCESS(
            'Seller login: artisan@triballink.com / artisan123'
        ))
