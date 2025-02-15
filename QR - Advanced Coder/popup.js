document.addEventListener("DOMContentLoaded", function () {
    const inputField = document.getElementById("qr-input");
    const trackedInputs = document.querySelectorAll("input, select");
    const qrContainer = document.getElementById("qr-container");
    const downloadBtn = document.getElementById("download-btn");
    const copyBtn = document.getElementById("copy-btn");
    const fgColorPicker = document.getElementById("fg-color");
    const bgColorPicker = document.getElementById("bg-color");
    const sizeSelector = document.getElementById("qr-size");
    const historyList = document.getElementById("history-list");
    const clearHistoryBtn = document.getElementById("clear-history-btn");
    const themeToggle = document.getElementById("theme-toggle");

    // Generate QR Code
    function generateQRCode(text) {
        qrContainer.innerHTML = "";
        const size = parseInt(sizeSelector.value);

        new QRCode(qrContainer, {
            text: text,
            width: size,
            height: size,
            colorDark: fgColorPicker.value,
            colorLight: bgColorPicker.value,
            correctLevel: QRCode.CorrectLevel.H
        });

        downloadBtn.style.display = "block";
        copyBtn.style.display = "block";
        saveToHistory(text);
    }

    // Get Current Tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
            inputField.value = tabs[0].url;
            generateQRCode(tabs[0].url);
        }
    });

    // Generate QR Code on every input change
    trackedInputs.forEach(trackedInput => {
        trackedInput.addEventListener("input", function () {
            const text = inputField.value.trim();
            if (text) {
                generateQRCode(text);
            }
        })
    });

    // Download QR Code
    downloadBtn.addEventListener("click", function () {
        const canvas = qrContainer.querySelector("canvas");
        if (canvas) {
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = "qrcode.png";
            link.click();
        }
    });

    // Copy QR Code to Clipboard
    copyBtn.addEventListener("click", function () {
        const canvas = qrContainer.querySelector("canvas");
        if (canvas) {
            canvas.toBlob(blob => {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]);
                alert("QR Code copied to clipboard!");
            });
        }
    });

    // Save QR Code to History
    function saveToHistory(text) {
        chrome.storage.local.get(["qrHistory"], function (result) {
            let history = result.qrHistory || [];
            if (!history.includes(text)) {
                history.unshift(text);
                if (history.length > 10) history.pop();
                chrome.storage.local.set({ qrHistory: history });
            }
            displayHistory();
        });
    }

    // Display QR History
    function displayHistory() {
        chrome.storage.local.get(["qrHistory"], function (result) {
            const history = result.qrHistory || ["No recent QR codes to show"];
            historyList.innerHTML = "";

            if (history.length > 0) {
                clearHistoryBtn.style.display = "block"; // Show Clear History button
            } else {
                clearHistoryBtn.style.display = "none"; // Hide Clear History button
            }

            history.forEach(text => {
                const listItem = document.createElement("li");
                listItem.textContent = text;
                listItem.addEventListener("click", function () {
                    inputField.value = text;
                    generateQRCode(text);
                });
                historyList.appendChild(listItem);
            });
        });
    }

    // Clear QR History
    clearHistoryBtn.addEventListener("click", function () {
        chrome.storage.local.set({ qrHistory: [] }, () => {
            displayHistory();
        });
    });

    // Theme Toggle
    themeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");
        if (document.body.classList.contains("dark-mode")) {
            themeToggle.textContent = "☀️";
            localStorage.setItem("theme", "dark");
        } else {
            themeToggle.textContent = "🌙";
            localStorage.setItem("theme", "light");
        }
    });

    // Load Theme Preference
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "☀️";
    }

    displayHistory();
});
