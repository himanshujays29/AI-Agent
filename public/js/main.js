// --- MAIN DASHBOARD PAGE LOGIC ---

const form = document.getElementById("studyForm");
const statusDiv = document.getElementById("status");
const output = document.getElementById("output");
const researchDiv = document.getElementById("research");
const summaryDiv = document.getElementById("summary");
const quizBtn = document.getElementById("generateQuizBtn");
const flashBtn = document.getElementById("generateFlashcardsBtn");
const diagramBtn = document.getElementById("generateDiagramBtn");

// Show buttons if exist
if (quizBtn) quizBtn.classList.remove("hidden");
if (flashBtn) flashBtn.classList.remove("hidden");
if (diagramBtn) diagramBtn.classList.remove("hidden");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const topic = document.getElementById("topic").value.trim();
    const model = document.getElementById("model").value;
    if (!topic) {
      console.error("Enter a topic!");
      return;
    }

    statusDiv.innerHTML = "⏳ Researching...";
    output.classList.add("hidden");

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, model }),
      });

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

      // QUIZ button
      if (quizBtn) {
        quizBtn.classList.remove("hidden");
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
      }

      // PDF button
      const pdfBtn = document.getElementById("exportPdfBtn");
      if (pdfBtn) {
        pdfBtn.classList.remove("hidden");
        pdfBtn.onclick = () => {
          window.location.href = `/api/pdf/${data.id}`;
        };
      }

      // FLASHCARDS button
      if (flashBtn) {
        flashBtn.classList.remove("hidden");
        flashBtn.onclick = async () => {
          flashBtn.innerText = "⏳ Generating Flashcards...";
          const resF = await fetch(`/api/flashcards/${data.id}`);
          const fData = await resF.json();

          if (!fData.success) {
            flashBtn.innerText = "⚠ Error Generating Flashcards";
            return;
          }

          flashBtn.innerText = "📘 Regenerate Flashcards";
          const box = document.getElementById("flashcardOutput");
          box.innerHTML = marked.parse(fData.flashcards);
          box.classList.remove("hidden");
        };
      }

      // DIAGRAM button
      if (diagramBtn) {
        diagramBtn.classList.remove("hidden");
        diagramBtn.onclick = async () => {
          diagramBtn.innerText = "⏳ Generating Mind Map...";
          const resD = await fetch(`/api/diagram/${data.id}`);
          const dData = await resD.json();

          if (!dData.success) {
            diagramBtn.innerText = "⚠ Error";
            return;
          }

          diagramBtn.innerText = "🧠 Regenerate Mind Map";
          const wrapper = document.getElementById("diagramWrapper");
          const diagram = document.getElementById("mindmapDiagram");

          if (diagram) {
            diagram.textContent = dData.diagram;
          }
          wrapper.classList.remove("hidden");

          mermaid.init(undefined, ".mermaid");
          initMindmapControls();
        };
      }
    } catch (error) {
      console.error("Fetch error:", error);
      statusDiv.innerHTML = "❌ Network error: " + error.message;
    }
  });
}

// --- HISTORY DETAIL PAGE CHAT TUTOR LOGIC ---

const chatContainer = document.getElementById("chatContainer");
const chatHistoryLocal = [];

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

    messageBubble.innerHTML = role === "model" ? marked.parse(text) : text;

    messageWrapper.appendChild(messageBubble);
    chatHistoryDiv.appendChild(messageWrapper);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
  };

  const handleSend = async () => {
    const userMessage = chatMessageInput.value.trim();
    if (!userMessage || !recordId) return;

    appendMessage("user", userMessage);
    chatHistoryLocal.push({ role: "user", text: userMessage });

    chatMessageInput.value = "";
    sendChatBtn.disabled = true;
    chatStatusDiv.innerText = "AI Tutor is thinking...";

    try {
      appendMessage("model", '<i class="fas fa-spinner fa-spin"></i>');
      const modelPlaceholder =
        chatHistoryDiv.lastElementChild.querySelector(".bg-green-200");

      const res = await fetch(`/api/chat/${recordId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage, chatHistory: chatHistoryLocal }),
      });

      const data = await res.json();

      if (data.success) {
        const modelResponse = data.response;
        chatHistoryLocal.push({ role: "model", text: modelResponse });
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

// QUIZ generation on history detail
const generateQuizHistoryBtn = document.getElementById("generateQuizHistory");
if (generateQuizHistoryBtn) {
  generateQuizHistoryBtn.onclick = async () => {
    const btn = generateQuizHistoryBtn;
    btn.innerText = "⏳ Generating quiz...";

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

    const box = document.getElementById("quizBox");
    if (data.success) {
      box.innerHTML = marked.parse(data.quiz);
    } else {
      box.innerHTML = `<div class="text-red-600">Error generating quiz: ${
        data.error || "Unknown error"
      }</div>`;
    }
    box.classList.remove("hidden");
  };
}

// FLASHCARDS on history detail
const generateFlashcardsHistoryBtn = document.getElementById(
  "generateFlashcardsHistory"
);
if (generateFlashcardsHistoryBtn) {
  generateFlashcardsHistoryBtn.onclick = async () => {
    const recordIdMatch = window.location.pathname.match(
      /\/history\/([a-f\d]{24})/
    );
    const recordId = recordIdMatch ? recordIdMatch[1] : null;

    generateFlashcardsHistoryBtn.innerText = "⏳ Generating...";

    const res = await fetch(`/api/flashcards/${recordId}`);
    const data = await res.json();

    generateFlashcardsHistoryBtn.innerText = "📘 Regenerate Flashcards";

    const box = document.getElementById("flashcardBox");
    box.innerHTML = marked.parse(data.flashcards);
    box.classList.remove("hidden");
  };
}

// DIAGRAM on history detail
const generateDiagramHistoryBtn = document.getElementById("generateDiagramHistory");
if (generateDiagramHistoryBtn) {
  generateDiagramHistoryBtn.onclick = async () => {
    const recordIdMatch = window.location.pathname.match(
      /\/history\/([a-f\d]{24})/
    );
    const recordId = recordIdMatch ? recordIdMatch[1] : null;

    generateDiagramHistoryBtn.innerText = "⏳ Generating...";

    const res = await fetch(`/api/diagram/${recordId}`);
    const data = await res.json();

    const wrapper = document.getElementById("diagramWrapper");
    const diagram = document.getElementById("mindmapDiagram");
    diagram.textContent = data.diagram;
    wrapper.classList.remove("hidden");

    mermaid.init(undefined, ".mermaid");
    initMindmapControls();

    generateDiagramHistoryBtn.innerText = "🧠 Regenerate Mind Map";
  };
}

// Regenerate Notes (detail page)
async function regenerateNotes(id) {
  const loader = document.getElementById("regenLoader");
  const loaderText = document.getElementById("regenLoaderText");
  loader.style.display = "block";

  const model = document.getElementById("regenModelSelect").value;

  const response = await fetch(`/api/regenerate/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });

  const data = await response.json();
  loaderText.innerText = "Notes regenerated successfully!";

  if (data.success) {
    setTimeout(() => location.reload(), 500);
  } else {
    loaderText.innerText = "Error: " + (data.error || "Unknown error");
  }
}

// Regen from history list
function regenFromList(recordId) {
  const spinner = document.getElementById(`spinner-${recordId}`);
  const rotateIcon = document.querySelector(
    `button[onclick="regenFromList('${recordId}')"] .fa-rotate-right`
  );
  const button = document.querySelector(
    `button[onclick="regenFromList('${recordId}')"]`
  );
  const dropdown = document.getElementById(`model-${recordId}`);

  if (rotateIcon) rotateIcon.style.display = "none";
  if (spinner) spinner.style.display = "block";
  if (button) button.disabled = true;

  const selectedModel = dropdown.value;

  fetch(`/api/regenerate/${recordId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: selectedModel }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        console.log("Notes regenerated successfully!");
        location.reload();
      } else {
        console.error("Error: " + data.error);
      }
    })
    .catch((err) => {
      console.error("Failed to regenerate notes:", err);
    })
    .finally(() => {
      if (rotateIcon) rotateIcon.style.display = "inline";
      if (spinner) spinner.style.display = "none";
      if (button) button.disabled = false;
    });
}

// expose to window
if (typeof window !== "undefined") {
  window.regenerateNotes = regenerateNotes;
  window.regenFromList = regenFromList;
}

// Mindmap controls (fullscreen + zoom + pan)
function initMindmapControls() {
  const wrapper = document.getElementById("diagramWrapper");
  const container = document.getElementById("mindmapContainer");
  const diagram = document.getElementById("mindmapDiagram");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const resetZoomBtn = document.getElementById("resetZoomBtn");
  const fullScreenBtn = document.getElementById("fullScreenBtn");

  if (!wrapper || !container || !diagram) return;

  let scale = 1;
  let isPanning = false;
  let startX, startY, scrollLeft, scrollTop;

  diagram.classList.add("mindmap-scale");

  if (zoomInBtn) {
    zoomInBtn.onclick = () => {
      scale += 0.1;
      diagram.style.transform = `scale(${scale})`;
    };
  }

  if (zoomOutBtn) {
    zoomOutBtn.onclick = () => {
      if (scale > 0.2) scale -= 0.1;
      diagram.style.transform = `scale(${scale})`;
    };
  }

  if (resetZoomBtn) {
    resetZoomBtn.onclick = () => {
      scale = 1;
      diagram.style.transform = "scale(1)";
      container.scrollTop = 0;
      container.scrollLeft = 0;
    };
  }

  if (fullScreenBtn) {
    fullScreenBtn.onclick = () => {
      wrapper.classList.toggle("fullscreen");
      mermaid.init(undefined, ".mermaid");
    };
  }

  container.addEventListener("mousedown", (e) => {
    isPanning = true;
    startX = e.clientX;
    startY = e.clientY;
    scrollLeft = container.scrollLeft;
    scrollTop = container.scrollTop;
  });

  container.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    container.scrollLeft = scrollLeft - (e.clientX - startX);
    container.scrollTop = scrollTop - (e.clientY - startY);
  });

  container.addEventListener("mouseup", () => (isPanning = false));
  container.addEventListener("mouseleave", () => (isPanning = false));
}

// No direct export, runs in browser
