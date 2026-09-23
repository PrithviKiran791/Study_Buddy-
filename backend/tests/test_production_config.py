import os
import sys
import sqlite3
import unittest
import tempfile
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from config import DATABASE_FILE, get_db_connection


class TestProductionConfig(unittest.TestCase):
    def test_database_connection(self):
        """Verify get_db_connection returns an active SQLite connection with Row factory."""
        conn = get_db_connection()
        self.assertIsNotNone(conn)
        cursor = conn.cursor()
        cursor.execute("SELECT 1 AS test_val")
        row = cursor.fetchone()
        self.assertEqual(row["test_val"], 1)
        conn.close()

    def test_database_directory_creation(self):
        """Verify that nested paths for persistent volumes auto-create parent directories."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            nested_db = pathlib.Path(tmp_dir) / "subfolder" / "data" / "test.db"
            import config
            original_db = config.DATABASE_FILE

            try:
                config.DATABASE_FILE = str(nested_db)
                conn = config.get_db_connection()
                self.assertIsNotNone(conn)
                self.assertTrue(nested_db.parent.exists())
                conn.close()
            finally:
                config.DATABASE_FILE = original_db


if __name__ == "__main__":
    unittest.main()
