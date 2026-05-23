document.getElementById('btnGenerate').addEventListener('click', async () => {
    const promptText = document.getElementById('userInput').value;
    const btn = document.getElementById('btnGenerate');

    if (!promptText.trim()) return;

    btn.textContent = "Mengeksekusi AI...";
    btn.disabled = true;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: promptText })
        });

        if (!response.ok) throw new Error("Gagal merespons dari server backend");

        const data = await response.json();
        
        // Merender hasil ke dalam iframe dengan tema charcoal
        const iframe = document.getElementById('godotFrame');
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <style>
                body { background-color: #2b2b2b; color: #E0E0E0; font-family: monospace; font-size: 14px; padding: 15px; margin: 0; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
            <pre>${data.result}</pre>
        `);
        iframeDoc.close();

        // Memicu kemunculan tombol Mode 2
        document.getElementById('mode2').style.display = 'block';

    } catch (error) {
        alert("Terjadi kesalahan: " + error.message);
    } finally {
        btn.textContent = "Eksekusi Kode";
        btn.disabled = false;
    }
});

// Placeholder logika metrik penilaian
document.querySelectorAll('.btn-rate').forEach(button => {
    button.addEventListener('click', (e) => {
        const score = e.target.getAttribute('data-score');
        console.log("Skor diinput:", score);
        alert(`Skor ${score} dicatat untuk evaluasi performa!`);
        document.getElementById('mode2').style.display = 'none';
    });
});