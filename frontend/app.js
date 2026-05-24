let lastGeneratedCode = "";

document.getElementById('btnGenerate').addEventListener('click', async () => {
    const promptText = document.getElementById('userInput').value;
    const selectedModel = document.getElementById('modelSelect').value;
    const btn = document.getElementById('btnGenerate');

    if (!promptText.trim()) return;

    btn.textContent = "Mengeksekusi AI...";
    btn.disabled = true;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText, model: selectedModel })
        });

        if (!response.ok) throw new Error("Gagal merespons dari server");

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
            
            if (!response.ok) throw new Error("Penolakan server lokal");
            
            alert(`Skor ${score} berhasil dikunci.`);
            document.getElementById('mode2').style.display = 'none';
        } catch (error) {
            alert("Gagal menyimpan metrik: " + error.message);
        }
    });
});

document.getElementById('btnHistory').addEventListener('click', async () => {
    const modal = document.getElementById('historyModal');
    const content = document.getElementById('historyContent');
    content.innerHTML = '<p style="color: #E0E0E0;">Memindai SQLite...</p>';
    modal.style.display = 'block';

    try {
        const response = await fetch('/api/history');
        if (!response.ok) throw new Error("Gagal mengambil data server");
        const data = await response.json();

        if (!data || data.length === 0) {
            content.innerHTML = '<p style="color: #888;">Belum ada skrip yang dikunci ke database.</p>';
            return;
        }

        content.innerHTML = data.map(item => {
            let borderColor = item.skor > 0 ? '#4CAF50' : item.skor < 0 ? '#d9534f' : '#f0ad4e';
            let safeCode = item.kode.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
            return `
            <div style="background-color: #333; margin-bottom: 15px; padding: 15px; border-radius: 4px; border-left: 5px solid ${borderColor};">
                <h4 style="margin: 0 0 10px 0; color: #E0E0E0;">Prompt: ${item.deskripsi} <span style="font-size: 12px; color: ${borderColor};">(Skor: ${item.skor})</span></h4>
                <pre style="background: #1e1e1e; padding: 10px; color: #d4d4d4; overflow-x: auto; border-radius: 4px;"><code>${safeCode}</code></pre>
            </div>`;
        }).join('');
    } catch (err) {
        content.innerHTML = `<p style="color: #d9534f;">Galat eksekusi: ${err.message}</p>`;
    }
});

document.getElementById('btnCloseHistory').addEventListener('click', () => {
    document.getElementById('historyModal').style.display = 'none';
});