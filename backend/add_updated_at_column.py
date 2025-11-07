"""
Add updated_at column to topics table
"""
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres.ynmcbdvcwmppctqthdkp:wkrendbtnr12!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres')

def add_updated_at_column():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        # Check if column exists
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='topics' AND column_name='updated_at'
        """)

        if cur.fetchone() is None:
            print("Adding updated_at column to topics table...")
            cur.execute("""
                ALTER TABLE topics
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """)

            # Set updated_at to created_at for existing rows
            cur.execute("""
                UPDATE topics
                SET updated_at = created_at
                WHERE updated_at IS NULL
            """)

            conn.commit()
            print("Successfully added updated_at column!")
        else:
            print("updated_at column already exists")

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    add_updated_at_column()
