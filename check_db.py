import psycopg2
from psycopg2 import sql

# Database connection
conn_string = "postgresql://postgres.bxfqjnokvzdvomuzsupz:dlwpdnjs!004@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

try:
    # Connect to database
    conn = psycopg2.connect(conn_string)
    cur = conn.cursor()

    print("=" * 80)
    print("EXISTING TABLES IN SUPABASE")
    print("=" * 80)

    # Get all tables
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)

    tables = cur.fetchall()

    if not tables:
        print("No tables found in public schema.")
    else:
        print(f"\nFound {len(tables)} table(s):\n")

        for table in tables:
            table_name = table[0]
            print(f"\n{'=' * 80}")
            print(f"TABLE: {table_name}")
            print(f"{'=' * 80}")

            # Get columns for each table
            cur.execute("""
                SELECT
                    column_name,
                    data_type,
                    character_maximum_length,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = %s
                ORDER BY ordinal_position;
            """, (table_name,))

            columns = cur.fetchall()

            print("\nColumns:")
            print("-" * 80)
            for col in columns:
                col_name, data_type, max_length, nullable, default = col
                length_info = f"({max_length})" if max_length else ""
                null_info = "NULL" if nullable == "YES" else "NOT NULL"
                default_info = f"DEFAULT {default}" if default else ""

                print(f"  {col_name:30} {data_type}{length_info:15} {null_info:10} {default_info}")

            # Get primary keys
            cur.execute("""
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = %s::regclass
                AND i.indisprimary;
            """, (table_name,))

            pkeys = cur.fetchall()
            if pkeys:
                print(f"\nPrimary Key(s): {', '.join([pk[0] for pk in pkeys])}")

            # Get foreign keys
            cur.execute("""
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = %s;
            """, (table_name,))

            fkeys = cur.fetchall()
            if fkeys:
                print("\nForeign Keys:")
                for fk in fkeys:
                    print(f"  {fk[0]} -> {fk[1]}.{fk[2]}")

    cur.close()
    conn.close()

    print("\n" + "=" * 80)
    print("DATABASE CHECK COMPLETE")
    print("=" * 80)

except Exception as e:
    print(f"Error connecting to database: {e}")
