package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/generative-ai-go/genai"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

type RequestBody struct {
	Prompt string `json:"prompt"`
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Peringatan: File .env tidak ditemukan.")
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY kosong. Eksekusi dihentikan.")
	}

	db := initDB()
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

		model := client.GenerativeModel("gemini-1.5-pro-latest")
		
		// Instruksi absolut: Blokir format markdown, paksa output GDScript murni
		model.SystemInstruction = &genai.Content{
			Parts: []genai.Part{genai.Text("Kamu adalah middleware Godot 4. Hasilkan hanya kode GDScript mentah. Fokus pada interaksi mobile (button_down/button_up). Dilarang menulis penjelasan, dilarang menggunakan markdown ```gdscript.")},
		}

		resp, err := model.GenerateContent(ctx, genai.Text(reqBody.Prompt))
		if err != nil {
			log.Println("Galat API Gemini:", err) // Injeksi pelacak
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

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"result": generatedText,
		})
	})

	server := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 20 * time.Second,
	}

	log.Println("Server LLM aktif di port 8080")
	log.Fatal(server.ListenAndServe())
}