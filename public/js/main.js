const form = document.getElementById("studyForm");
const statusDiv = document.getElementById("status");
const output = document.getElementById("output");
const researchDiv = document.getElementById("research");
const summaryDiv = document.getElementById("summary");
const quizBtn = document.getElementById("generateQuizBtn");

// Check if these elements exist before manipulating classes/events
if (quizBtn) {
  quizBtn.classList.remove("hidden");
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const topic = document.getElementById("topic").value.trim();
    const model = document.getElementById("model").value;
    // Use a modal/toast instead of alert
    if (!topic) return console.error("Enter a topic!");

    statusDiv.innerHTML = "⏳ Researching...";
    output.classList.add("hidden");

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, model }),
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (!data.success) {
        statusDiv.innerHTML = "❌ Error: " + (data.error || "Unknown error");
        return;
      }

      statusDiv.innerHTML = data.steps.join("<br>");
      researchDiv.innerHTML = marked.parse(data.research);
      summaryDiv.innerHTML = marked.parse(data.summary);
      output.classList.remove("hidden");

      // Show quiz button
      const quizBtn = document.getElementById("generateQuizBtn");
      quizBtn.classList.remove("hidden");

      // Attach click
      quizBtn.onclick = async () => {
        quizBtn.innerText = "⏳ Generating quiz...";
        const resQuiz = await fetch(`/api/quiz/${data.id}`);
        const quizData = await resQuiz.json();

        if (!quizData.success) {
          console.error("Error generating quiz");
          quizBtn.innerText = "🎯 Error Generating Quiz";
          return;
        }

        quizBtn.innerText = "🎯 Generate Quiz Again";
        document.getElementById("quizOutput").innerHTML = marked.parse(
          quizData.quiz
        );
        document.getElementById("quizOutput").classList.remove("hidden");
      };

      // Show PDF button
      const pdfBtn = document.getElementById("exportPdfBtn");
      pdfBtn.classList.remove("hidden");

      pdfBtn.onclick = () => {
        window.location.href = `/api/pdf/${data.id}`;
      };
    } catch (error) {
      console.error("Fetch error:", error);
      statusDiv.innerHTML = "❌ Network error: " + error.message;
    }
  });
}

// --- HISTORY DETAIL PAGE LOGIC ---

// Chat Tutor Logic (Feature 1)
const chatHistory = []; // Stores the ongoing conversation: [{role: 'user'/'model', text: '...'}, ...]
const chatContainer = document.getElementById("chatContainer");

if (chatContainer) {
  const recordIdMatch = window.location.pathname.match(
    /\/history\/([a-f\d]{24})/
  );
  const recordId = recordIdMatch ? recordIdMatch[1] : null;

  const chatMessageInput = document.getElementById("chatMessage");
  const sendChatBtn = document.getElementById("sendChatBtn");
  const chatHistoryDiv = document.getElementById("chatHistory");
  const chatStatusDiv = document.getElementById("chatStatus");

  const appendMessage = (role, text) => {
    const messageWrapper = document.createElement("div");
    messageWrapper.className = `flex ${
      role === "user" ? "justify-end" : "justify-start"
    }`;

    const messageBubble = document.createElement("div");
    messageBubble.className = `p-3 rounded-xl max-w-xs ${
      role === "user"
        ? "bg-blue-600 text-white rounded-br-none"
        : "bg-green-200 text-gray-800 rounded-bl-none"
    }`;

    // Use marked.parse for model responses only, as they contain markdown
    messageBubble.innerHTML = role === "model" ? marked.parse(text) : text;

    messageWrapper.appendChild(messageBubble);
    chatHistoryDiv.appendChild(messageWrapper);

    // Scroll to the bottom
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
  };

  const handleSend = async () => {
    const userMessage = chatMessageInput.value.trim();
    if (!userMessage || !recordId) return;

    // Display user message
    appendMessage("user", userMessage);
    chatHistory.push({ role: "user", text: userMessage });

    chatMessageInput.value = "";
    sendChatBtn.disabled = true;
    chatStatusDiv.innerText = "AI Tutor is thinking...";

    try {
      // Add a placeholder for the model response
      appendMessage("model", '<i class="fas fa-spinner fa-spin"></i>');
      const modelPlaceholder =
        chatHistoryDiv.lastElementChild.querySelector(".bg-green-200");

      const res = await fetch(`/api/chat/${recordId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage, chatHistory }),
      });

      const data = await res.json();

      if (data.success) {
        const modelResponse = data.response;
        chatHistory.push({ role: "model", text: modelResponse });

        // Replace placeholder with actual response
        modelPlaceholder.innerHTML = marked.parse(modelResponse);
      } else {
        const errorMessage = data.error || "An error occurred during chat.";
        modelPlaceholder.innerHTML = `<span class="text-red-600">Error: ${errorMessage}</span>`;
      }
    } catch (error) {
      console.error("Chat fetch error:", error);
      chatStatusDiv.innerText = "❌ Network error.";
    } finally {
      sendChatBtn.disabled = false;
      chatStatusDiv.innerText = "";
    }
  };

  sendChatBtn.addEventListener("click", handleSend);
  chatMessageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSend();
  });
}

// Quiz Generation Logic (Modified for detail page)
const generateQuizHistoryBtn = document.getElementById("generateQuizHistory");
if (generateQuizHistoryBtn) {
  generateQuizHistoryBtn.onclick = async () => {
    const btn = document.getElementById("generateQuizHistory");
    btn.innerText = "⏳ Generating quiz...";

    // Extract record ID from URL path
    const recordIdMatch = window.location.pathname.match(
      /\/history\/([a-f\d]{24})/
    );
    const recordId = recordIdMatch ? recordIdMatch[1] : null;

    if (!recordId) {
      btn.innerText = "🎯 Error: No ID found";
      return console.error("Could not find record ID in URL.");
    }

    const res = await fetch(`/api/quiz/${recordId}`);
    const data = await res.json();

    btn.innerText = "🎯 Regenerate Quiz";

    if (data.success) {
      document.getElementById("quizBox").innerHTML = marked.parse(data.quiz);
      document.getElementById("quizBox").classList.remove("hidden");
    } else {
      document.getElementById(
        "quizBox"
      ).innerHTML = `<div class="text-red-600">Error generating quiz: ${
        data.error || "Unknown error"
      }</div>`;
      document.getElementById("quizBox").classList.remove("hidden");
    }
  };
}

// Regenerate Notes Logic
async function regenerateNotes(id) {
  const loader = document.getElementById("regenLoader");
  const loaderText = document.getElementById("regenLoaderText");
  loader.style.display = "block";

  const model = document.getElementById("regenModelSelect").value; // The API route is /api/regenerate/:id, not /history/regenerate/:id

  const response = await fetch(`/api/regenerate/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });

  const data = await response.json();
  loaderText.innerText = "Notes regenerated successfully!";

  if (data.success) {
    // Small delay to let the user see the success message
    setTimeout(() => location.reload(), 500);
  } else {
    loaderText.innerText = "Error: " + (data.error || "Unknown error");
  }
}

// Attach to global scope for EJS onclick
if (typeof window !== "undefined") {
  window.regenerateNotes = regenerateNotes;
  window.regenFromList = regenFromList; // Ensure this is also accessible
}

function regenFromList(recordId) {
  const spinner = document.getElementById(`spinner-${recordId}`);
  const rotateIcon = document.querySelector(
    `button[onclick="regenFromList('${recordId}')"] .fa-rotate-right`
  );
  const button = document.querySelector(
    `button[onclick="regenFromList('${recordId}')"]`
  );
  const dropdown = document.getElementById(`model-${recordId}`);

  // Hide rotate icon and show spinner
  if (rotateIcon) rotateIcon.style.display = "none";
  if (spinner) spinner.style.display = "block";
  if (button) button.disabled = true;

  const selectedModel = dropdown.value;

  // The API route is /api/regenerate/:id, not /history/regenerate/:id
  fetch(`/api/regenerate/${recordId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: selectedModel }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        // Use console.log instead of alert
        console.log("Notes regenerated successfully!");
        // Reload the page to see updated notes
        location.reload();
      } else {
        console.error("Error: " + data.error);
      }
    })
    .catch((err) => {
      console.error("Failed to regenerate notes:", err);
    })
    .finally(() => {
      // Show rotate icon and hide spinner
      if (rotateIcon) rotateIcon.style.display = "inline";
      if (spinner) spinner.style.display = "none";
      if (button) button.disabled = false;
    });
}
