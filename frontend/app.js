document.getElementById('btnGenerate').addEventListener('click', async () => {
    const prompt = document.getElementById('userInput').value;
    if (!prompt) return;

    // Ubah status tombol menjadi loading
    const btn = document.getElementById('btnGenerate');
    btn.innerText = "Memproses di Cloud...";
    btn.disabled = true;

    // KODE FUNGSI SIMULASI: Efek Tween pada TextureButton Godot 4
    const mockGDScript = `extends TextureButton

func _ready() -> void:
    # Sinyal spesifik interaksi layar sentuh (Android)
    button_down.connect(_on_touch_down)
    button_up.connect(_on_touch_up)
    
    # Mitigasi cacat logika jika jari ditarik keluar area sebelum dilepas
    mouse_exited.connect(_on_touch_up) 

func _on_touch_down() -> void:
    # Visualisasi tombol tertekan ke dalam (mengecil)
    var tween = create_tween()
    tween.tween_property(self, "scale", Vector2(0.9, 0.9), 0.1)

func _on_touch_up() -> void:
    # Visualisasi tombol memantul kembali ke ukuran awal
    var tween = create_tween()
    tween.tween_property(self, "scale", Vector2(1.0, 1.0), 0.1)
`;

    // Jeda 1.5 detik seolah-olah sedang menunggu balasan AI
    setTimeout(() => {
        // Suntikkan kode simulasi ke dalam iframe (panel hitam di bawah)
        const iframeDoc = document.getElementById('godotFrame').contentWindow.document;
        iframeDoc.open();
        // Membungkus kode dengan style agar senada dengan tema charcoal
        iframeDoc.write('<pre style="color: #5D8AA8; font-family: monospace; padding: 15px; font-size: 14px; white-space: pre-wrap;">' + mockGDScript + '</pre>');
        iframeDoc.close();

        // Munculkan Mode 2 (Sistem Penilaian)
        document.getElementById('mode2').style.display = 'block';

        // Kembalikan tombol ke kondisi semula
        btn.innerText = "Eksekusi Kode";
        btn.disabled = false;
    }, 1500);
});

// Deteksi input nilai metrik untuk melatih instruksi negatif/positif
document.querySelectorAll('.btn-rate').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const score = e.target.getAttribute('data-score');
        console.log("Skor metrik dikirim ke database:", score);
        
        // Sembunyikan panel nilai setelah dievaluasi
        document.getElementById('mode2').style.display = 'none';
        document.getElementById('userInput').value = '';
        
        // Bersihkan proyektor sandbox
        const iframeDoc = document.getElementById('godotFrame').contentWindow.document;
        iframeDoc.open();
        iframeDoc.write('');
        iframeDoc.close();
    });
});
