package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

type RequestBody struct {
	Prompt string `json:"prompt"`
	Model  string `json:"model"`
}

type RateBody struct {
	Deskripsi string `json:"deskripsi"`
	Kode      string `json:"kode"`
	Skor      int    `json:"skor"`
}

func main() {
	_ = godotenv.Load()
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY kosong.")
	}

	db := initDB() // Berasal dari database.go
	defer db.Close()

	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.Dir("../frontend")))

	mux.HandleFunc("/api/generate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Metode ditolak", http.StatusMethodNotAllowed)
			return
		}

		var reqBody RequestBody
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
		defer cancel()

		client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
		if err != nil {
			http.Error(w, "Inisialisasi API gagal", http.StatusInternalServerError)
			return
		}
		defer client.Close()

		modelName := "gemini-3.5-flash"
		if reqBody.Model == "lite" {
			modelName = "gemini-3.1-flash-lite"
		}

		model := client.GenerativeModel(modelName)
		model.SystemInstruction = &genai.Content{
			Parts: []genai.Part{genai.Text("Middleware Godot 4. Hasilkan kode GDScript mentah. Fokus interaksi mobile. Dilarang: penjelasan, komentar (#), markdown, spasi berlebih, baris kosong berulang. Tulis logika absolut sependek mungkin.")},
		}

		resp, err := model.GenerateContent(ctx, genai.Text(reqBody.Prompt))
		if err != nil {
			log.Println("Galat API Gemini:", err)
			http.Error(w, "Kegagalan komputasi LLM", http.StatusInternalServerError)
			return
		}

		var generatedText string
		for _, cand := range resp.Candidates {
			if cand.Content != nil {
				for _, part := range cand.Content.Parts {
					if txt, ok := part.(genai.Text); ok {
						generatedText += string(txt)
					}
				}
			}
		}

		// Pemangkasan spasi/enter berlebih
		generatedText = strings.TrimSpace(generatedText)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"result": generatedText,
		})
	})

	mux.HandleFunc("/api/rate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Metode ditolak", http.StatusMethodNotAllowed)
			return
		}

		var reqBody RateBody
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
			return
		}

		query := `INSERT INTO kumpulan_script (kategori, deskripsi, kode_gdscript, skor_kualitas, total_digunakan) VALUES (?, ?, ?, ?, ?)`
		_, err := db.Exec(query, "UI_Animasi", reqBody.Deskripsi, reqBody.Kode, reqBody.Skor, 1)
		if err != nil {
			log.Println("Gagal injeksi SQLite:", err)
			http.Error(w, "Kegagalan database", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "Skor dikunci di SQLite"})
	})

	server := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 20 * time.Second,
	}

	log.Println("Server aktif di port 8080")
	log.Fatal(server.ListenAndServe())
}