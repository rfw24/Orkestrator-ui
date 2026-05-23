let lastGeneratedCode = "";

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
        lastGeneratedCode = data.result;
        
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

        document.getElementById('mode2').style.display = 'block';

    } catch (error) {
        alert("Terjadi kesalahan: " + error.message);
    } finally {
        btn.textContent = "Eksekusi Kode";
        btn.disabled = false;
    }
});

document.querySelectorAll('.btn-rate').forEach(button => {
    button.addEventListener('click', async (e) => {
        const score = parseInt(e.target.getAttribute('data-score'));
        const promptText = document.getElementById('userInput').value;
        
        try {
            const response = await fetch('/api/rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    deskripsi: promptText, 
                    kode: lastGeneratedCode, 
                    skor: score 
                })
            });
            
            if (!response.ok) throw new Error("Penolakan dari server lokal");
            
            alert(`Skor ${score} berhasil dikunci ke SQLite.`);
            document.getElementById('mode2').style.display = 'none';
        } catch (error) {
            alert("Gagal menyimpan metrik: " + error.message);
        }
    });
});