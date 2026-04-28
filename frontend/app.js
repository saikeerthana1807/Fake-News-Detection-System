const API_BASE_URL = "/api";
const FUNCTION_BASE_URL = "/.netlify/functions";
const LOCAL_HISTORY_KEY = "fake_news_detection_history";

const form = document.getElementById("newsForm");
const statusText = document.getElementById("backendStatus");
const resultCard = document.getElementById("resultCard");
const predictionLabel = document.getElementById("predictionLabel");
const confidenceBar = document.getElementById("confidenceBar");
const confidenceText = document.getElementById("confidenceText");
const fakeProb = document.getElementById("fakeProb");
const realProb = document.getElementById("realProb");
const evidenceWords = document.getElementById("evidenceWords");
const historyList = document.getElementById("historyList");
const refreshHistory = document.getElementById("refreshHistory");

function asPercent(value) {
  return `${Math.round(value * 100)}%`;
}

async function checkBackend() {
  try {
    const response = await fetchWithFallback("health");
    const data = await response.json();
    statusText.textContent = `Backend online - trained with ${data.trained_documents} records`;
    statusText.className = "status-dot online";
  } catch {
    statusText.textContent = "Backend offline - run Netlify locally or deploy the project";
    statusText.className = "status-dot offline";
  }
}

async function fetchWithFallback(endpoint, options) {
  try {
    const primaryResponse = await fetch(`${API_BASE_URL}/${endpoint}`, options);
    if (primaryResponse.ok || (primaryResponse.status >= 400 && primaryResponse.status < 500 && primaryResponse.status !== 404)) {
      return primaryResponse;
    }
  } catch {
    // Try the direct Netlify Functions URL below.
  }
  return fetch(`${FUNCTION_BASE_URL}/${endpoint}`, options);
}

function showResult(result) {
  const isFake = result.label === "Fake";
  resultCard.className = `result-card ${isFake ? "fake" : "real"}`;
  predictionLabel.textContent = result.label;
  confidenceBar.style.width = asPercent(result.confidence);
  confidenceBar.style.background = isFake ? "var(--fake)" : "var(--real)";
  confidenceText.textContent = `Confidence: ${asPercent(result.confidence)}`;
  fakeProb.textContent = asPercent(result.fake_probability);
  realProb.textContent = asPercent(result.real_probability);

  evidenceWords.innerHTML = "";
  result.evidence_words.forEach((word) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = word;
    evidenceWords.appendChild(tag);
  });
}

async function loadHistory() {
  const predictions = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || "[]");
  historyList.innerHTML = "";

  if (!predictions.length) {
    historyList.innerHTML = "<p>No predictions yet.</p>";
    return;
  }

  predictions.forEach((item) => {
    const row = document.createElement("div");
    const labelClass = item.predicted_label.toLowerCase();
    row.className = "history-item";
    row.innerHTML = `
      <strong>${item.title}</strong>
      <p><span class="history-label ${labelClass}">${item.predicted_label}</span> confidence ${asPercent(item.confidence)}</p>
    `;
    historyList.appendChild(row);
  });
}

function saveLocalHistory(title, result) {
  const predictions = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || "[]");
  predictions.unshift({
    id: result.id,
    title,
    predicted_label: result.label,
    confidence: result.confidence,
    fake_probability: result.fake_probability,
    real_probability: result.real_probability,
    evidence_words: result.evidence_words,
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(predictions.slice(0, 20)));
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector("button");
  submitButton.disabled = true;
  submitButton.textContent = "Analyzing...";

  const payload = {
    title: document.getElementById("title").value,
    content: document.getElementById("content").value,
  };

  try {
    const response = await fetchWithFallback("predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({ error: "Prediction failed. Please check the Netlify function logs." }));
    if (!response.ok) {
      throw new Error(data.error || "Prediction failed.");
    }

    showResult(data);
    saveLocalHistory(payload.title, data);
    await loadHistory();
  } catch (error) {
    alert(error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Analyze News";
  }
});

refreshHistory.addEventListener("click", loadHistory);

checkBackend();
loadHistory();
