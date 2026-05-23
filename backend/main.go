package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

func main() {
	db := initDB()
	defer db.Close()

	mux := http.NewServeMux()
	
	// Rute statis ke folder frontend yang baru saja Anda push
	mux.Handle("/", http.FileServer(http.Dir("../frontend")))

	// Rute penerima prompt
	mux.HandleFunc("/api/generate", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()
		_ = ctx

		if r.Method != http.MethodPost {
			http.Error(w, "Metode ditolak", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status": "Backend Golang siap menerima API Gemini",
		})
	})

	server := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	log.Println("Server aktif di port 8080")
	log.Fatal(server.ListenAndServe())
}