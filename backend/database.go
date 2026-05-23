package main

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

func initDB() *sql.DB {
	db, err := sql.Open("sqlite3", "./knowledge_base.db")
	if err != nil {
		log.Fatal("Koneksi gagal:", err)
	}

	query := `
	CREATE TABLE IF NOT EXISTS kumpulan_script (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		kategori TEXT NOT NULL,
		deskripsi TEXT NOT NULL,
		kode_gdscript TEXT NOT NULL,
		skor_kualitas INTEGER DEFAULT 0,
		total_digunakan INTEGER DEFAULT 0
	);`

	_, err = db.Exec(query)
	if err != nil {
		log.Fatal("Skema gagal:", err)
	}

	log.Println("Database SQLite aktif.")
	return db
}