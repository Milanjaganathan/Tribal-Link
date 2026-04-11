"""Fix missing database columns."""
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'triballink.settings'

import django
django.setup()

from django.db import connection

cursor = connection.cursor()

# Add missing columns to accounts_user
missing_user = [
    ('shop_description', 'TEXT DEFAULT ""'),
    ('seller_approved_at', 'DATETIME NULL'),
    ('is_email_verified', 'BOOLEAN DEFAULT 0'),
    ('email_otp', 'VARCHAR(6) DEFAULT ""'),
    ('email_otp_created_at', 'DATETIME NULL'),
]

for col, dtype in missing_user:
    try:
        cursor.execute(f'ALTER TABLE accounts_user ADD COLUMN {col} {dtype}')
        print(f'  + Added accounts_user.{col}')
    except Exception as e:
        if 'duplicate' in str(e).lower():
            print(f'  = accounts_user.{col} already exists')
        else:
            print(f'  ! accounts_user.{col}: {e}')

# Add missing column to products_category
try:
    cursor.execute('ALTER TABLE products_category ADD COLUMN icon VARCHAR(50) DEFAULT ""')
    print('  + Added products_category.icon')
except Exception as e:
    if 'duplicate' in str(e).lower():
        print('  = products_category.icon already exists')
    else:
        print(f'  ! products_category.icon: {e}')

print('\nDone! Database schema fixed.')
